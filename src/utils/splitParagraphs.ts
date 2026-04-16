export function splitIntoParagraphs(text: string, sentencesPerParagraph = 2): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-Z"'(])/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length <= sentencesPerParagraph) return [text.trim()];
  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
    paragraphs.push(sentences.slice(i, i + sentencesPerParagraph).join(' '));
  }
  return paragraphs;
}
