/*
 * GEISH.NO — NO-locale.
 *
 * Portert fra design_handoff_geish/references/content.js. Endre tekst HER,
 * ikke i komponentene. Alle felt er `as const` slik at TypeScript får
 * litterale typer — typos i feltnavn fanges på compile time.
 *
 * Når engelsk blir aktuelt: kopier hele objektet, lim inn i locales/en.ts,
 * og oversett verdiene. i18n.ts registrerer da begge locales automatisk.
 */
export const no = {
  /* ── MERKE / IDENTITET ─────────────────────────────────── */
  brand: {
    name: "geish.no",
    estd: "EST. 2026",
    tagline: "Geirs digitale hjemmebase",
    location: "Skien, internett",
    author: "Geir",
    // Byen som vises i AboutRow-overskriften (h3). Ligger i content så den
    // ikke hardkodes i komponenten.
    city: "SKIEN",
  },

  /* ── HERO / FORSIDE-MOTTO ──────────────────────────────── */
  hero: {
    punch: "ÅPNE FACEBOOK.\nGÅ VIDERE.\nJEG VENTER.",
    credo: "STAY GROUNDED, AND CREATE SHIT",
    // Megabox-strukturen — eksplisitte linjer slik at "CREATE" kan få aksent-
    // farge uten å gjette splitting. Mockup-en dropper "AND" i display-versjonen.
    credo_lines: {
      l1: "STAY",
      l2: "GROUNDED,",
      l3a: "CREATE",
      l3b: "SHIT.",
    },
    intro_short:
      "Hei. Jeg heter Geir. Dette er min digitale hjemmebase — ikke leid, ikke lånt, ikke underlagt en algoritme.",
    intro_long:
      "Dette er hjemmebasen min. Blogg, prosjekter, en stue jeg inviterer folk inn i, et manifest om hvorfor du burde lage din egen side. Velkommen inn. Tørk av deg på beina.",
    sub: "En personlig hjemmeside med retro-sjel og moderne under-panseret.",
  },

  /* ── PROSJEKTER (subdomener) ───────────────────────────── */
  projects: [
    {
      name: "bake.geish.no",
      href: "https://bake.geish.no",
      desc: "Bakeapp — surdeigslogg, oppskrifter, hydrasjon",
      status: "live",
      tag: "#brød",
    },
    {
      name: "hund.geish.no",
      href: "https://hund.geish.no",
      desc: "Hundetreningsapp, sosial — for retrievereiere",
      status: "live",
      tag: "#hund",
    },
    {
      name: "reise.geish.no",
      href: "https://reise.geish.no",
      desc: "Reiseplanlegger — bilturer, kart, stoppesteder",
      status: "wip",
      tag: "#reise",
    },
    {
      // Ingen URL ennå — card rendres uten lenke.
      name: "readme.riot",
      href: null,
      desc: "How-to-zine: bygg din egen hjemmeside",
      status: "idea",
      tag: "#manifest",
    },
    {
      // Ingen URL ennå — card rendres uten lenke.
      name: "starter-kit",
      href: null,
      desc: "Next.js-mal for webring-medlemmer",
      status: "idea",
      tag: "#webring",
    },
  ],

  /* ── METADATA / FOOTER ─────────────────────────────────── */
  meta: {
    // Ingen ekte analytics ennå — telleren står på null som en bevisst
    // retro-gimmick, ikke et oppdiktet besøkstall.
    visitors: "00 000 000",
    visitors_label: "BESØKENDE · INGEN SPORING",
    last_updated: "AUGUST 2026",
    last_updated_what: "ryddet bort placeholder-innhold",
    server: "Vercel · ingen sporing · ingen reklame",
    construction: "UNDER CONSTRUCTION — ALLTID",
    construction_long:
      "Denne siden er, og forblir, under konstruksjon. Det er en livsstil.",
    copyright: "© Geir, 2026. CC-BY-SA der annet ikke er nevnt.",
  },

  /* ── GJESTEBOK-utdrag ──────────────────────────────────── */
  // Tømt for fabrikkert seed-innhold. Fylles med ekte innlegg når
  // gjesteboka (egen epic) er live.
  guestbook: [] as ReadonlyArray<{ who: string; when: string; msg: string }>,
  guestbook_empty: "Gjesteboka er tom ennå — bli den første til å skrive noe pent.",

  /* ── BLOGG-POSTER ──────────────────────────────────────────
     Fjernet i e2-blog-engine. BlogStrip leser nå ekte poster
     fra MDX-pipelinen (src/content/posts/*.mdx) via getAllPosts(). */

  /* ── STUA — diskusjonstråder (forhåndsvisning) ─────────── */
  stua: {
    intro:
      "Stua er der vi snakker sammen. Ingen algoritme, ingen reklame, ingen som ikke vet hva du heter. Invitasjonsbasert.",
    // Tømt for fabrikkerte tråder/spørsmål. Fylles med ekte data når
    // Stua-forumet (egen epic) er på plass.
    week_question: "",
    threads: [] as ReadonlyArray<{
      title: string;
      who: string;
      replies: number;
      last: string;
      cat: string;
    }>,
    empty: "Stua åpner snart. Her blir det prat når døra er på plass.",
  },

  /* ── MANIFEST-pullquotes (vises på forsiden) ───────────── */
  manifest_pullquotes: [
    "Trilliardærene bygde gjerder rundt nettet og kalte det «community». La oss rive gjerdene og bygge noe ekte.",
    "En gjestebok med tre innlegg er mer verdt enn tusen likes fra folk du aldri har møtt.",
    "Under Construction er en livsstil, ikke en feilmelding.",
    "Du er ikke brukeren. Du er produktet. Og produktet har gått ut på dato.",
  ],

  /* ── OM GEIR (kort bio på forsiden) ────────────────────── */
  about: {
    heading: "Hvem skriver dette?",
    // {alder} erstattes ved render av dynamisk alder (src/lib/age.ts).
    // Resten står ordrett til Geir dikterer ny bio.
    lead: "Geir, {alder}. Bygger ting i Skien. Skriver kode på dagtid, brød om kvelden, manifest om natten.",
    interests: [
      "#jakt",
      "#hund",
      "#D&D",
      "#3D-print",
      "#dreiebenk",
      "#Ableton",
      "#surdeig",
      "#tech",
      "#friluft",
    ],
    links: [
      { label: "epost", value: "geir@geish.no" },
      { label: "matrix", value: "@geir:geish.no" },
      { label: "mastodon", value: "@geir@tilde.zone" },
      { label: "rss", value: "geish.no/feed" },
    ],
    // Photo-labels for AboutRow foto-kollasj. Posisjon/rotasjon ligger i komponenten.
    photos: [
      { label: "PORTRETT" },
      { label: "HUND.JPG" },
      { label: "VERKSTED" },
      { label: "BRØD N° 47" },
    ],
  },

  /* ── TIL — today I learned, mikroposter ───────────────── */
  til: [
    {
      date: "20 mai",
      text: "Postgres `INSERT … ON CONFLICT DO NOTHING RETURNING *` returnerer ingen rad ved konflikt. Pussig liten gotcha.",
    },
    {
      date: "19 mai",
      text: "Surdeig som har stått 12 timer på benken ved 22°C er ferdig før jeg har fått kaffe.",
    },
    {
      date: "17 mai",
      text: "Norske flagg har et offisielt fargebibliotek (NS 4501). Det visste jeg ikke.",
    },
    {
      date: "15 mai",
      text: "Vercel rewrites kan håndtere subdomener uten å eksponere monorepo-strukturen. Magisk.",
    },
  ],

  /* ── LABBEN — eksperimenter på forsiden ──────────────── */
  lab: [
    {
      name: "lyd-toggleren",
      desc: "Web Audio + en oscillator du kan dra rundt på siden. Lager ambient drone.",
      status: "live",
    },
    {
      name: "ascii-portrett",
      desc: "Kameraet ditt → ASCII i sanntid. Helt fjollete, men gøy.",
      status: "live",
    },
    {
      name: "spotify-now",
      desc: "Hva jeg hører på akkurat nå (uten å spore deg).",
      status: "wip",
    },
  ],

  /* ── SITE CHANGELOG ────────────────────────────────────── */
  // Tømt for fabrikkerte oppføringer (inkl. referanse til en blogpost som
  // ikke finnes). Fylles med ekte endringer etter hvert.
  changelog: [] as ReadonlyArray<{ date: string; what: string }>,
  changelog_empty: "Endringsloggen fylles etter hvert som ting skjer.",

  /* ── PULLQUOTE som vises på forsiden ───────────────────── */
  homepage_pullquote:
    "En gjestebok med tre innlegg er mer verdt enn tusen likes fra folk du aldri har møtt.",

  /* ── WEBRING ───────────────────────────────────────────── */
  webring: {
    title: "GEISH.NO WEBRING",
    sub: "Personlige hjemmesider lenker til hverandre. Som i 1999.",
    prev: "← Forrige",
    next: "Neste →",
    // Ringen er under oppstart — ingen oppdiktet medlemsmasse.
    members: "ingen medlemmer ennå",
    join: "Bli med",
  },

  /* ── AUTH — innlogging, konto, nav (E3) ────────────────── */
  auth: {
    login: {
      heading: "Logg inn.",
      deck: "Ingen passord. Skriv e-posten din, få en lenke, klikk. Ferdig.",
      emailLabel: "E-postadresse",
      emailPlaceholder: "deg@eksempel.no",
      submit: "SEND MEG EN LENKE",
      submitting: "SENDER …",
      sentStamp: "LENKE SENDT",
      sentBefore: "Sjekk innboksen til",
      sentAfter:
        "Lenken virker i én time. Åpne den på samme enhet og i samme nettleser som du bestilte den fra.",
      useAnother: "bruk en annen adresse",
      errorLink:
        "Lenken var ugyldig eller utløpt. Be om en ny under.",
      errorSend:
        "Fikk ikke sendt lenken. Sjekk adressen og prøv igjen.",
    },
    konto: {
      heading: "Konto.",
      crumb: "KONTO",
      loggedInAs: "logget inn som",
      note: "Mer kommer her etter hvert. Foreløpig: du er deg, og det holder.",
      logout: "LOGG UT",
    },
    nav: {
      login: "LOGG INN →",
      konto: "KONTO",
      logout: "LOGG UT",
    },
  },

  /* ── PROFIL — vis/rediger egen profil på /konto (E4) ─────
   * UTKAST: alle disse tekstene skal godkjennes av Geir. Lavmælt zine-tone.
   */
  profil: {
    heading: "Profil",
    // Fallback-navn når en bruker er navnløs. Aldri e-post, aldri avledet.
    anon: "Anonym",
    // Vises når eget display_name er tomt (NULL) — oppfordring, ingen tvang.
    noName: "Du har ikke valgt et visningsnavn ennå.",
    displayNameLabel: "Visningsnavn",
    displayNamePlaceholder: "Hva vil du hete her?",
    displayNameHint: "2–40 tegn. Kan endres når som helst. Trenger ikke være unikt.",
    bioLabel: "Om deg",
    bioPlaceholder: "Noen linjer, om du vil. Eller ingen.",
    // Personvern-merknad ved feltene (Geirs prinsipp — skriv det tydelig).
    publicNotice:
      "Visningsnavn og «om deg» er offentlig. Skriv som om hvem som helst kan lese det — for det kan de.",
    charsLeft: "tegn igjen",
    save: "LAGRE",
    saving: "LAGRER …",
    // Statuslinjer etter lagring.
    saved: "Lagret.",
    // D1: ikke-blokkerende advarsel — navnet er brukt av noen andre.
    nameInUse:
      "Navnet er allerede i bruk av en annen — du kan likevel bruke det. Lagret.",
    errorUnauthenticated: "Du er ikke logget inn. Logg inn og prøv igjen.",
    errorNameTooShort: "Visningsnavnet må være minst 2 tegn (eller la det stå tomt).",
    errorNameTooLong: "Visningsnavnet kan være høyst 40 tegn.",
    errorBioTooLong: "«Om deg» kan være høyst 300 tegn.",
  },
} as const;
