const MIN_TEXT_CHARACTERS = 120;
const MIN_TEXT_WORDS = 20;
const MAX_TEXT_CHARACTERS = 80_000;

export function cleanResumeText(value: string) {
  return value
    .replace(/\r\n?/gu, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu, "")
    .replace(/[\t\u00a0 ]+/gu, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

export function isUsableResumeText(text: string) {
  if (
    text.length < MIN_TEXT_CHARACTERS ||
    text.length > MAX_TEXT_CHARACTERS
  ) {
    return false;
  }

  const words = text.match(/[\p{L}\p{N}][\p{L}\p{N}.'’+-]*/gu) ?? [];
  const replacementCharacters = text.match(/\ufffd/gu)?.length ?? 0;
  const meaningfulCharacters = text.match(/[\p{L}\p{N}]/gu)?.length ?? 0;

  return (
    words.length >= MIN_TEXT_WORDS &&
    replacementCharacters / text.length <= 0.01 &&
    meaningfulCharacters / text.length >= 0.35
  );
}
