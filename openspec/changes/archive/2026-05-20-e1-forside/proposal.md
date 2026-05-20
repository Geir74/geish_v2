## Why

E1 første halvdel (`e1-design-system`) leverte fundamentet — tokens, fonter, 8 shared-komponenter, /styleguide. Forsiden er fortsatt en minimal placeholder. Andre halvdel av epic E1 bygger den faktiske `/`: 13 seksjoner i et 12-kolonners zine-grid per `02-PAGES.md` Side 1. Det er Facebook-erstatteren for besøkende — den levende landingen som setter tonen og gir inngang til alle hovedseksjoner. Når denne lander er epic E1 ferdig og videre arbeid kan gå direkte inn i undersider (E2 manifest, E4 blogg) uten å måtte tenke på forside-arkitektur eller content-laget.

## What Changes

- **12 forside-spesifikke seksjonskomponenter** under `src/components/forside/`, én per seksjon i 02-PAGES Side 1: `Megabox`, `CornerStamp`, `IntroNote`, `ManifestCut`, `StuaPreview`, `GuestbookGrid`, `ProjectsRow`, `PullquoteBand`, `AboutRow` (bio + foto-kollasj), `Trio` (TIL/Lab/Changelog), `BlogStrip`, `FooterRow`. (13. seksjon — copyright-linje — ligger inline i `page.tsx`.)
- **Skriv om `src/app/page.tsx`** fra placeholder til full forside: 12-kolonners CSS-grid (`grid-template-columns: repeat(12, 1fr)`, `gap: 14px`, padding `32px 28px 48px`), seksjoner plassert via `grid-column` / `grid-row: span N` per layout-tabell i 02-PAGES.
- **Gjenbruk shared-komponentene** der layouten krever det: `HalftoneBlock` (Megabox-dekor + Pullquote-band), `Stamp` (CornerStamp), `StatusBadge` (ProjectsRow + Lab i Trio), `GuestbookSnippet` (med `style="cards"` for forsiden, men selve "torn notes"-rotasjonen er allerede innebygd), `ImagePlaceholder` (AboutRow foto-kollasj), `VisitorCounter` + `WebringWidget` (variant card) + `UnderConstructionBanner` (FooterRow).
- **Typed content-modul**: opprett `src/content/i18n.ts` med `t()`/`locales`/`defaultLocale = "no"` og `src/content/locales/no.ts` som inneholder de forside-relevante slicene fra `references/content.js`. All copy hentes fra `t()` — ingen hardkodet tekst i seksjonskomponentene.
- **Lenker** peker på riktige (eventuelle) URL-er per 02-PAGES interactions: `/manifest`, `/stua`, `/stua/[slug]`, `/blogg`, `/blogg/[slug]`, `/gjestebok`, `bake.geish.no` osv. Rutene finnes ikke ennå — de 404-er. Ingen stub-ruter.
- **Tom-tilstand-logikk**: hver seksjon returnerer `null` ved tomt datasett; `BlogStrip` faller tilbake til `<UnderConstructionBanner>` hvis `blog_posts` er tomt. Seed-data dekker alle seksjoner nå, så forsiden viser full layout.

## Capabilities

### New Capabilities
- `homepage`: Forsiden (`/`) — 12-kolonners zine-grid med 13 seksjoner, content fra typed i18n-modul, gjenbruk av shared-komponenter, tom-tilstand-håndtering per seksjon, lenker til ennå-ikke-eksisterende undersider.

### Modified Capabilities
- `project-foundation`: "Dev-server starter rent, forsiden og smoke-ruten laster" oppdateres — forsiden viser nå full Cut & Paste Zine-forside, ikke "geish v2"-placeholderen.

## Impact

- **Avhengigheter (ingen nye)**: alt eksisterer fra E1-design-system. Ingen nye npm-pakker.
- **Filsystem (nytt)**:
  - `src/content/i18n.ts`, `src/content/locales/no.ts` — typed content-modul.
  - `src/components/forside/{Megabox,CornerStamp,IntroNote,ManifestCut,StuaPreview,GuestbookGrid,ProjectsRow,PullquoteBand,AboutRow,Trio,BlogStrip,FooterRow}/{index.tsx, *.module.css}` — 12 seksjonskomponenter.
  - `src/components/forside/index.ts` — barrel-eksport.
- **Filsystem (modifisert)**: `src/app/page.tsx` (full forside-assembler), `src/app/page.module.css` (12-kolonners grid + seksjons-plasseringer).
- **Røres ikke**: tokens, shared-komponenter, DB-laget, Supabase-laget, `/smoke`, `/styleguide`, fonts i layout.
- **Eksterne systemer**: ingen. Alt er statisk fra content-modulet.
- **Ut av scope**: undersider (`/manifest`, `/stua`, `/blogg`) — E2/E4. Auth, backend, MDX, webring-API, gjestebok-innsending — senere. Engelsk locale — strukturen er i18n-klar men kun `no` fylles.
