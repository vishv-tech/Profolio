const VISHV_FULL_NAME = "vishv deepak lange";
const VISHV_EMAIL = "vishvlange843@gmail.com";
const VISHV_GITHUB = "github.com/vishv-tech";
const VISHV_LINKEDIN = "linkedin.com/in/vishv-lange-a781352b7";

function normalizeMatchText(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/\s+/gu, " ")
    .trim();
}

export function isVishvDemoResume(resumeText: string): boolean {
  const text = normalizeMatchText(resumeText);

  return (
    text.includes(VISHV_FULL_NAME) &&
    (text.includes(VISHV_EMAIL) ||
      text.includes(VISHV_GITHUB) ||
      text.includes(VISHV_LINKEDIN))
  );
}

export function shouldUseVishvDemoResume(
  resumeText: string,
  demoMode: boolean,
): boolean {
  return demoMode && isVishvDemoResume(resumeText);
}
