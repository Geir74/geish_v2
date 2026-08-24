/*
 * age.ts — dynamisk aldersberegning.
 *
 * Alderen regnes ut ved render (server-side). Fordi forsiden og /blogg er
 * statiske, setter vi `export const revalidate = 86400` (daglig ISR) på de
 * rutene som viser alderen, slik at tallet faktisk oppdateres etter bursdagen
 * ved neste revalidering — uten manuell redigering.
 *
 * Tidssone: beregningen bruker serverens `new Date()` (UTC på Vercel). For en
 * enkel årsalder er dette presist nok; vi trenger ikke minuttnøyaktig grense.
 */

/** Geirs fødselsdato (1974-06-08). Måned er 0-indeksert (5 = juni). */
export const GEIR_BIRTHDATE = new Date(Date.UTC(1974, 5, 8));

/** Hele år mellom fødselsdato og `now`. */
export function getAge(birthdate: Date, now: Date = new Date()): number {
  let age = now.getUTCFullYear() - birthdate.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birthdate.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birthdate.getUTCDate())) {
    age -= 1;
  }
  return age;
}

/** Sant hvis `now` faller på samme dag/måned som fødselsdatoen. */
export function isBirthday(birthdate: Date, now: Date = new Date()): boolean {
  return (
    now.getUTCMonth() === birthdate.getUTCMonth() &&
    now.getUTCDate() === birthdate.getUTCDate()
  );
}

/**
 * Aldersetikett for Geir. På selve bursdagen (8. juni) markeres den diskret
 * med «nyslått» foran tallet — bevisst uten emoji, da prosjektets forbudsliste
 * (§8) ikke tillater emoji-ikoner i UI-et.
 */
export function geirAgeLabel(now: Date = new Date()): string {
  const age = getAge(GEIR_BIRTHDATE, now);
  return isBirthday(GEIR_BIRTHDATE, now) ? `nyslått ${age}` : String(age);
}
