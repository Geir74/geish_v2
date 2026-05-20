---
project: geish.no v2
feature: e1-forside
date: 2026-05-20
type: brownfield
status: draft
---

# Mandat: E1 — Forside (Cut & Paste Zine)

## Mål

Bygg den faktiske forsiden (`/`) på designsystemet fra `e1-design-system`: 13 seksjoner i et 12-kolonners zine-grid, med seed-innhold fra et typet content-modul. Dette er andre og siste halvdel av epic E1. Forsiden er den levende landingen som setter tonen og gir inngang til alle hovedseksjoner — Facebook-erstatteren for besøkende. Layouten er definert til seksjonsnivå i `02-PAGES.md` (Side 1).

## Scope

### Inn

- **Forside-spesifikke seksjonskomponenter** under `src/components/forside/`, én per seksjon i `02-PAGES.md` Side 1: `Megabox` (hero), `CornerStamp`, `IntroNote`, `ManifestCut`, `StuaPreview`, `GuestbookGrid`, `ProjectsRow`, `PullquoteBand`, `AboutRow`, `Trio` (TIL/Lab/Changelog), `BlogStrip`, `FooterRow`. (Per 03-IMPLEMENTATION komponent-mapping.)
- **Assembler i `src/app/page.tsx`** etter 12-kolonners grid-layouten i 02-PAGES (`grid-template-columns: repeat(12, 1fr)`, `gap: 14px`, padding `32px 28px 48px`, seksjoner plassert via `grid-column` / `grid-row: span N`).
- **Gjenbruk shared-komponentene fra `e1-design-system`** der layouten krever det: `VisitorCounter` + `WebringWidget` (card-variant) + `UnderConstructionBanner` i footer; `StatusBadge` i ProjectsRow; `GuestbookSnippet` i gjestebok-seksjonen; `ImagePlaceholder` / `Stamp` / `HalftoneBlock` der seksjonene bruker dem.
- **Port `references/content.js` til et typet content-modul**: `src/content/i18n.ts` (`t()`, `locales`, `defaultLocale = 'no'`) + `src/content/locales/no.ts`. Fyll de forside-relevante slicene som seed: `brand`, `hero`, `manifest_pullquotes`, `homepage_pullquote`, `projects`, `about`, `til`, `lab`, `changelog`, `guestbook`, `stua.week_question` + `stua.threads` (preview), `blog_posts` (preview), `meta`, `webring`. Seksjonskomponentene leser fra `t()`, **ikke** hardkodet tekst.
- **Lenker** per 02-PAGES interactions: seksjoner lenker til `/manifest`, `/stua/[slug]`, `/blogg/[slug]`, og subdomener (`bake/hund/reise.geish.no`). Rutene finnes ikke ennå — lenkene peker dit de skal og 404-er inntil epicene lander. Ingen stub-ruter.
- **Tom-tilstand-logikk** per 02-PAGES (skjul data-løse seksjoner, vis UC-banner i stedet for blog-strip), men seedet slik at forsiden viser full layout nå.

### Ut

- **Undersidene** (`/manifest`, `/stua`, `/blogg`) — E2/E4. Ingen stub-ruter.
- **Live DB / backend** for noen seksjon — alt er seed/statisk fra content-modulet. Stua-tråder, blogg-poster, gjestebok, besøksteller viser seed-data.
- **Full manifest-MDX-tekst** — manifest-epicen. Forsiden bruker kun de 3 pullquotes + `homepage_pullquote`.
- **Auth, gjestebok-innsending, webring-API, besøksteller-backend** — senere epics.
- **Engelsk locale** — strukturen er i18n-klar, men kun `no` fylles.
- **Full responsivitet** utover beste skjønn — desktop 1280px er primær (handoff-premiss).
- **Endring av tokens, shared-komponenter, eller DB/Supabase-laget** — de står urørt.

## Delta-type

**Type:** brownfield

Bygger på `e1-design-system` (shared-komponenter, tokens) og E0 (struktur). Skriver om `src/app/page.tsx` fra placeholder til full forside.

## Suksesskriterier

- [ ] Alle 13 seksjoner rendrer på `/` i riktig grid-rekkefølge per 02-PAGES.
- [ ] Forsiden bruker **kun** designsystemet (tokens + shared-komponenter) — ingen nytt stylinglag, ingen Tailwind/shadcn.
- [ ] All tekst kommer fra det typede content-modulet (`t()`), ingen hardkodet copy i seksjonskomponentene.
- [ ] Lenker peker på de riktige (eventuelle) URL-ene.
- [ ] `npx tsc --noEmit` rent; `npm run dev` rent; `/` returnerer 200.
- [ ] Visuelt match mot `screenshots/01-forside.png` (review-sjekkpunkt — Geir i nettleser).
- [ ] Forbudslisten ren (grep-sjekkene fra `e1-design-system` gjelder fortsatt).

## Constraints

- Bygg **kun** på `e1-design-system`: `tokens.css`-variabler + CSS Modules + shared-komponentene. Ingen Tailwind/shadcn, ingen ny CSS-i-JS.
- Layouten i `02-PAGES.md` (grid-plassering per seksjon) er autoritativ. `references/forside.jsx` er designreferanse — oversettes til React + CSS Modules, kopieres ikke rått.
- Content i **ett** typet modul, ikke spredt — Geir redigerer copy ett sted (i18n-klar).
- `ImagePlaceholder` med klammeparentes-labels der ekte bilder ikke finnes — det er et eksplisitt designvalg, ikke en mangel.
- Forbudsliste §8 i `01-DESIGN-SYSTEM.md` gjelder.
- Globalt nav er **ikke** en sticky topp-nav — det er strødd inn i seksjonene (handoff: "Felles elementer"). Ikke innfør en kontor-tool-header.
- Rause norske kommentarer.

## Kontekst for Code

- **Repo:** `C:\kode\geish_v2`. `e1-design-system` er levert og arkivert: `src/components/shared/` (8 komponenter), `src/styles/tokens.css`, `/styleguide`. `src/app/page.tsx` er nå en minimal placeholder — **denne ruten eies og bygges av dette mandatet.**
- **Autoritativ design:** `C:\Users\geirh\OneDrive\GRIM\03 Projects\geish 2.0\design_handoff_geish\` — `02-PAGES.md` (Side 1 Forside: seksjonstabell, datakilder, interaksjoner, tilstander, designnotater), `references/forside.jsx` (komponent-referanse), `references/content.js` (seed-copy → port til typet modul), `screenshots/01-forside.png` (visuell fasit).
- **Innholdsstrategi:** `03-IMPLEMENTATION.md` §4 (`content.js` → `content/i18n.ts` + `content/locales/no.ts`, `t()`-mønster). Manifest-MDX (§4) er **ikke** i scope.
- **Delta-spec:** dette er en ny `homepage`-capability (`ADDED`) + en `MODIFIED` av `project-foundation` sin "Dev-server / `/` laster"-requirement (forsiden viser nå full forside, ikke placeholder). Code skriver deltaen.
- **Avvik fra `03-IMPLEMENTATION.md` står fast:** npm, `src/`, Supabase (ikke pnpm / Vercel Postgres / NextAuth).

## Åpne spørsmål

<!-- Code avklarer i proposal/design. -->

- Megabox-headline: 02-PAGES sier "STAY GROUNDED, CREATE SHIT." i Bungee — bekreft mot `content.js` `brand`/`hero`-feltene.
- Photo-placeholder-labels i Om-Geir-kollasjen (f.eks. `[HUND.JPG]`, `[BRØD N° 47]`) — hent fra `content.js` eller bruk handoff-eksemplene.
- Grid-layout: ligger den i `Forside.module.css` eller i `page.tsx` sin egen modul? Code velger.
- Seksjoner som previewer senere-epic-innhold (Stua, blogg, gjestebok): hvor mye seed-data er fornuftig — nok til å vise designet uten å late som features finnes. Code foreslår mengde.
