/*
 * Trygg slug-generering for Stua-tråder (E6, task 2.1/2.2).
 *
 * Trådslug er GLOBALT unik + immutabel (kanonisk rute /stua/t/[slug]). Genereres
 * fra brukervalgt tittel — som kan inneholde hva som helst (æøå, emoji, kun
 * symboler). Derfor: translitterering → normalisering → tom-fallback → unik-
 * suffiks (unikhet håndteres i skrive-action mot DB, se uniqueThreadSlug).
 *
 * Rekkefølge (spec): normaliser → fallback-hvis-tom → unik-suffiks.
 */

const TRANSLIT: Record<string, string> = {
  æ: "ae", ø: "oe", å: "aa", ä: "ae", ö: "oe", ü: "ue", ß: "ss",
  Æ: "ae", Ø: "oe", Å: "aa", Ä: "ae", Ö: "oe", Ü: "ue",
};

/**
 * Normaliser en tittel til en slug-base. Kan returnere tom streng (håndteres av
 * baseThreadSlug som legger på fallback).
 */
export function slugifyBase(input: string): string {
  const translit = input
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("");
  return translit
    .normalize("NFKD") // dekomponer aksenter
    .replace(/[\u0300-\u036f]/g, "") // fjern diakritiske tegn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // ikke-alfanumerisk → bindestrek
    .replace(/^-+|-+$/g, "") // trim ledende/etterfølgende bindestrek
    .slice(0, 80); // hold slug rimelig kort
}

/** Kort tilfeldig id-suffiks for tom-fallback (unngår kollisjon på tom base). */
function shortId(): string {
  return Math.random().toString(36).slice(2, 8);
}

/**
 * Slug-base med garantert ikke-tomt resultat. Tittel som normaliserer til tom
 * streng (kun emoji/symboler) → `traad-<kort-id>`.
 */
export function baseThreadSlug(title: string): string {
  const base = slugifyBase(title);
  return base.length > 0 ? base : `traad-${shortId()}`;
}

/**
 * Gjør en base globalt unik ved å legge på -2, -3, … til den ikke kolliderer.
 * `exists` sjekker DB (kalt fra skrive-action). Ren funksjon av hensyn til test.
 */
export async function uniqueThreadSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  if (!(await exists(base))) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!(await exists(candidate))) return candidate;
  }
}
