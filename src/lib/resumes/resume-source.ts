import { cleanResumeText } from "@/lib/resumes/text";

type PdfTextItem = {
  hasEOL?: boolean;
  str: string;
};

export type ResumePdfSource = {
  diagnostics: {
    pageFailures: number;
    textPageFailures: number;
  };
  pageCount: number;
  text: string;
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
  const pageTexts: string[] = [];
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

      try {
        const textContent = await page.getTextContent();
        const pageText = cleanResumeText(textFromItems(textContent.items));
        pageTexts.push(pageText ? `[Page ${pageNumber}]\n${pageText}` : "");
      } catch {
        textPageFailures += 1;
      }

      page.cleanup();
    }

    const text = cleanResumeText(pageTexts.filter(Boolean).join("\n\n"));

    return {
      diagnostics: {
        pageFailures,
        textPageFailures,
      },
      pageCount: document.numPages,
      text,
    };
  } finally {
    await loadingTask.destroy();
  }
}
