/*
 * Typed i18n-modul. Forsiden og senere undersider henter all copy via t().
 * Bytt locale ved å endre defaultLocale eller kalle t("en") når en-locale finnes.
 *
 * `as const` på no.ts gir litterale typer — t().brand.name har typen "geish.no",
 * ikke string. Det betyr at typos i feltnavn fanges på compile time, ikke runtime.
 */
import { no } from "./locales/no";

export const locales = { no } as const;
export type Locale = keyof typeof locales;
export const defaultLocale: Locale = "no";

export type Dictionary = typeof no;

export function t(locale: Locale = defaultLocale): Dictionary {
  return locales[locale];
}
