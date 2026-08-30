import {
  deduplicateResumeSourceLinks,
  extractLinksFromPdfAnnotations,
  extractVisibleResumeLinks,
  type ResumeSourceLink,
} from "@/lib/resumes/links";
import { cleanResumeText, isUsableResumeText } from "@/lib/resumes/text";

type PdfTextItem = {
  hasEOL?: boolean;
  str: string;
};

export type ResumePdfSource = {
  diagnostics: {
    annotationPageFailures: number;
    pageFailures: number;
    textPageFailures: number;
  };
  links: ResumeSourceLink[];
  pageCount: number;
  text: string;
  useTextForGemini: boolean;
};

function isPdfTextItem(value: unknown): value is PdfTextItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "str" in value &&
    typeof value.str === "string"
  );
}

function textFromItems(items: readonly unknown[]) {
  let text = "";

  for (const item of items) {
    if (!isPdfTextItem(item) || !item.str) {
      continue;
    }

    if (text && !/[\s-]$/u.test(text) && !/^[,.;:!?)]/u.test(item.str)) {
      text += " ";
    }

    text += item.str;
    text += item.hasEOL ? "\n" : " ";
  }

  return text;
}

export async function parseResumePdf(
  pdfBytes: Uint8Array,
): Promise<ResumePdfSource> {
  const { getDocument, VerbosityLevel } = await import(
    "pdfjs-dist/legacy/build/pdf.mjs"
  );
  const loadingTask = getDocument({
    data: pdfBytes.slice(),
    isEvalSupported: false,
    stopAtErrors: false,
    useWasm: false,
    useWorkerFetch: false,
    verbosity: VerbosityLevel.ERRORS,
  });
  const annotationLinks: ResumeSourceLink[] = [];
  const visibleLinks: ResumeSourceLink[] = [];
  const pageTexts: string[] = [];
  let annotationPageFailures = 0;
  let pageFailures = 0;
  let textPageFailures = 0;

  try {
    const document = await loadingTask.promise;

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      let page;

      try {
        page = await document.getPage(pageNumber);
      } catch {
        pageFailures += 1;
        continue;
      }

      const [textResult, annotationResult] = await Promise.allSettled([
        page.getTextContent(),
        page.getAnnotations({ intent: "display" }),
      ]);
      const textItems =
        textResult.status === "fulfilled" ? textResult.value.items : [];

      if (textResult.status === "fulfilled") {
        const pageText = cleanResumeText(textFromItems(textItems));
        pageTexts.push(pageText ? `[Page ${pageNumber}]\n${pageText}` : "");
        visibleLinks.push(...extractVisibleResumeLinks(pageText));
      } else {
        textPageFailures += 1;
      }

      if (annotationResult.status === "fulfilled") {
        annotationLinks.push(
          ...extractLinksFromPdfAnnotations(annotationResult.value, textItems),
        );
      } else {
        annotationPageFailures += 1;
      }

      page.cleanup();
    }

    const text = cleanResumeText(pageTexts.filter(Boolean).join("\n\n"));

    return {
      diagnostics: {
        annotationPageFailures,
        pageFailures,
        textPageFailures,
      },
      links: deduplicateResumeSourceLinks([
        ...annotationLinks,
        ...visibleLinks,
      ]),
      pageCount: document.numPages,
      text,
      useTextForGemini:
        pageFailures === 0 &&
        textPageFailures === 0 &&
        isUsableResumeText(text),
    };
  } finally {
    await loadingTask.destroy();
  }
}
