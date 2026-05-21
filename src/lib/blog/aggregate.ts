/*
 * Aggregerer tag-counts og arkiv-måneder fra en liste poster.
 * Brukes av /blogg-sidebar.
 */
import type { Post } from "./schema";

export interface TagCount {
  tag: string;
  count: number;
}

export interface MonthCount {
  /** "YYYY-MM" for sortering. */
  key: string;
  /** F.eks. "mai 2026" — menneskelesbar. */
  label: string;
  count: number;
}

const NORSKE_MAANEDER = [
  "jan", "feb", "mars", "apr", "mai", "juni",
  "juli", "aug", "sep", "okt", "nov", "des",
];

export function aggregateTags(posts: Post[]): TagCount[] {
  const counts = new Map<string, number>();
  for (const p of posts) {
    counts.set(p.tag, (counts.get(p.tag) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function aggregateMonths(posts: Post[]): MonthCount[] {
  const counts = new Map<string, number>();
  for (const p of posts) {
    // published er "YYYY-MM-DD"; ta de første 7.
    const key = p.published.slice(0, 7);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, count]) => {
      const [year, month] = key.split("-");
      const monthIdx = Number(month) - 1;
      const label = `${NORSKE_MAANEDER[monthIdx]} ${year}`;
      return { key, label, count };
    })
    .sort((a, b) => b.key.localeCompare(a.key));
}
