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
    location: "Oslo, internett",
    author: "Geir",
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
    visitors: "00 042 117",
    visitors_label: "BESØKENDE SIDEN 20. MAI 2026",
    last_updated: "20. MAI 2026",
    last_updated_what: "la til Stua-tråden om elgjakt",
    server: "Vercel · ingen sporing · ingen reklame",
    construction: "UNDER CONSTRUCTION — ALLTID",
    construction_long:
      "Denne siden er, og forblir, under konstruksjon. Det er en livsstil.",
    copyright: "© Geir, 2026. CC-BY-SA der annet ikke er nevnt.",
  },

  /* ── GJESTEBOK-utdrag ──────────────────────────────────── */
  guestbook: [
    {
      who: "Eirik",
      when: "17. mai",
      msg: "Endelig en grunn til å logge av Facebook. Webringen er inne — sjekk sida mi.",
    },
    {
      who: "Tante Liv",
      when: "15. mai",
      msg: "Veldig fint, Geir. Når kommer bildene fra påsken?",
    },
    {
      who: "D&D-Mads",
      when: "12. mai",
      msg: "Sesjonsnotater i Stua, nå.",
    },
    {
      who: "Sigrid",
      when: "11. mai",
      msg: "Manifestet traff hardt. Kloner starter-kitet i kveld.",
    },
  ],

  /* ── BLOGG-POSTER (forhåndsvisning) ────────────────────── */
  blog_posts: [
    {
      title: "Hvorfor jeg sluttet å scrolle",
      date: "18. mai 2026",
      read: "6 min",
      tag: "manifest",
    },
    {
      title: "Subdomener uten å miste forstanden",
      date: "14. mai 2026",
      read: "11 min",
      tag: "tech",
    },
    {
      title: "Hundetreningsappen — en postmortem på MVP-en",
      date: "09. mai 2026",
      read: "8 min",
      tag: "prosjekt",
    },
    {
      title: "Brød nummer 47: en surdeigsdagbok",
      date: "04. mai 2026",
      read: "4 min",
      tag: "liv",
    },
    {
      title: "AI-en min holder hammeren. Jeg slår spikeren.",
      date: "28. apr 2026",
      read: "7 min",
      tag: "manifest",
    },
    {
      title: "Elgjakta 2025: alt jeg gjorde feil",
      date: "12. apr 2026",
      read: "9 min",
      tag: "jakt",
    },
  ],

  /* ── STUA — diskusjonstråder (forhåndsvisning) ─────────── */
  stua: {
    intro:
      "Stua er der vi snakker sammen. Ingen algoritme, ingen reklame, ingen som ikke vet hva du heter. Invitasjonsbasert.",
    week_question:
      "Hva er den dummeste tingen du har lært deg å gjøre — som du faktisk er stolt av?",
    threads: [
      {
        title: "Hva tar dere med på elgjakt i år?",
        who: "Geir",
        replies: 14,
        last: "for 2 timer siden",
        cat: "jakt",
      },
      {
        title: "Beste 3D-printer under 5000,-",
        who: "Eirik",
        replies: 8,
        last: "i går",
        cat: "verksted",
      },
      {
        title: "Søndagens D&D — kan vi flytte til lørdag?",
        who: "Mads",
        replies: 22,
        last: "i går",
        cat: "d&d",
      },
      {
        title: "Ukens spørsmål: dummeste ting du har lært deg å gjøre",
        who: "Geir",
        replies: 31,
        last: "mandag",
        cat: "ukens",
      },
      {
        title: "Noen som har prøvd Ableton 12?",
        who: "Sigrid",
        replies: 5,
        last: "11. mai",
        cat: "musikk",
      },
      {
        title: "Bilder fra påska — last opp her",
        who: "Liv",
        replies: 17,
        last: "10. mai",
        cat: "foto",
      },
    ],
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
    lead: "Geir, 38. Bygger ting i Oslo. Skriver kode på dagtid, brød om kvelden, manifest om natten.",
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
  changelog: [
    { date: "20 mai", what: "Lagt til Stua-tråden om elgjakt." },
    { date: "18 mai", what: "Ny blogpost: «Hvorfor jeg sluttet å scrolle»." },
    { date: "16 mai", what: "Webringen har fått sitt første medlem (Eirik)." },
    { date: "14 mai", what: "Subdomene-arkitekturen ferdig satt opp." },
    { date: "12 mai", what: "Manifestet — første utkast publisert." },
    { date: "10 mai", what: "Siden ble født. Hei." },
  ],

  /* ── PULLQUOTE som vises på forsiden ───────────────────── */
  homepage_pullquote:
    "En gjestebok med tre innlegg er mer verdt enn tusen likes fra folk du aldri har møtt.",

  /* ── WEBRING ───────────────────────────────────────────── */
  webring: {
    title: "GEISH.NO WEBRING",
    sub: "Personlige hjemmesider lenker til hverandre. Som i 1999.",
    prev: "← Forrige",
    next: "Neste →",
    members: "12 medlemmer",
    join: "Bli med",
  },
} as const;
