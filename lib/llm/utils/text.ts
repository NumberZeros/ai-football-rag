export function truncateText(input: string, maxChars: number): string {
  if (maxChars <= 0) return '';
  if (input.length <= maxChars) return input;
  // Keep head; for prompts, preserving the start is typically better.
  return `${input.slice(0, Math.max(0, maxChars - 60))}\n\n[TRUNCATED: content exceeded ${maxChars} chars]\n`;
}

export function compactWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}
