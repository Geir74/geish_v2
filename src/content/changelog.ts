/*
 * ENDRINGSLOGG — datakilde for /endringslogg og forsidens Trio-kolonne.
 *
 * Én oppføring per brukersynlig endring. Interne ting (env-opprydding,
 * CI, db-detaljer) hører IKKE hjemme her — dette er loggen besøkende ser.
 *
 * Vedlikehold: kjør `npm run changelog:sync` (scripts/changelog-sync.mjs)
 * for å få UTKAST-oppføringer for mergede PR-er som mangler. Scriptet
 * kjøres kun manuelt — aldri i build. Tekstene er utkast til Geir har
 * godkjent dem.
 *
 * `date` er ISO (YYYY-MM-DD) = merge-dato. `prNummer` er valgfritt —
 * tidlige endringer landet før PR-workflowen fantes.
 */

export type ChangelogEntry = {
  /** ISO-dato (YYYY-MM-DD) for da endringen gikk live (merge-dato). */
  date: string;
  title: string;
  description: string;
  /** PR-nummer i Geir74/geish_v2 — utelates for endringer før PR-workflow. */
  prNummer?: number;
};

/** Nyeste først. Hold sorteringen ved innsetting — rendering stoler på den. */
export const changelog: ReadonlyArray<ChangelogEntry> = [
  {
    date: "2026-08-24",
    title: "Brukerprofiler",
    description:
      "Innloggede kan nå sette visningsnavn og en kort bio på kontosiden.",
    prNummer: 9,
  },
  {
    date: "2026-08-24",
    title: "Ekte innhold, ekte by, ekte alder",
    description:
      "Placeholder-innholdet fra designfasen er ryddet bort. Siden sier nå Skien (som sant er), og alderen regnes ut automatisk.",
    prNummer: 8,
  },
  {
    date: "2026-08-23",
    title: "Passordløs innlogging",
    description:
      "Logg inn med en magisk lenke på e-post — ingen passord å huske eller lekke.",
    prNummer: 5,
  },
  {
    date: "2026-08-22",
    title: "Første ekte bloggpost",
    description: "«Hello World» — bloggen har fått sitt første innlegg.",
    prNummer: 7,
  },
  {
    date: "2026-08-19",
    title: "Coverbilder på bloggen",
    description:
      "Bloggposter kan ha coverbilde som vises i lista og på selve posten.",
    prNummer: 6,
  },
  {
    date: "2026-05-21",
    title: "Blogg og manifest",
    description:
      "MDX-drevet blogg og /manifest med punk-standup-tone. Forsiden ble responsiv på kjøpet.",
  },
  {
    date: "2026-05-20",
    title: "Forsiden lansert",
    description:
      "Cut & Paste Zine-designet så dagens lys — 13 seksjoner klippet og limt med kjærlighet.",
  },
];

/*
 * Kort norsk datovisning ("24. aug") for kompakte flater (Trio på forsiden).
 * Full dato på /endringslogg bruker formatDateLong.
 */
const MONTHS_SHORT = [
  "jan",
  "feb",
  "mar",
  "apr",
  "mai",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "des",
] as const;

const MONTHS_LONG = [
  "januar",
  "februar",
  "mars",
  "april",
  "mai",
  "juni",
  "juli",
  "august",
  "september",
  "oktober",
  "november",
  "desember",
] as const;

function parts(iso: string): { day: number; month: number; year: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { day: d, month: m - 1, year: y };
}

export function formatDateShort(iso: string): string {
  const { day, month } = parts(iso);
  return `${day}. ${MONTHS_SHORT[month] ?? "?"}`;
}

export function formatDateLong(iso: string): string {
  const { day, month, year } = parts(iso);
  return `${day}. ${MONTHS_LONG[month] ?? "?"} ${year}`;
}
