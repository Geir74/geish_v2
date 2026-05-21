/*
 * Utleder lese-tid fra MDX-innhold ved å telle ord (~200 wpm).
 * Strip enkel Markdown-syntaks så vi ikke teller `#`, `*`, `>` osv. som ord.
 */
const MARKDOWN_SYNTAX = /[#*_`>[\]()|-]/g;

export function deriveReadTime(content: string): number {
  const words = content
    .replace(MARKDOWN_SYNTAX, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
