## 1. Content-modul

- [x] 1.1 Opprett mappen `src/content/locales/`
- [x] 1.2 Skriv `src/content/locales/no.ts` med `as const`-objekt, inkludert `credo_lines`, `about.photos`, og `href` per prosjekt
- [x] 1.3 Skriv `src/content/i18n.ts` med `t()`, `locales`, `defaultLocale`, `Locale`, `Dictionary`
- [x] 1.4 `npx tsc --noEmit` rent — t() har litterale typer

## 2. Utvid HalftoneBlock med color-prop

- [x] 2.1 Legg til `color?: string` på props og sett `--halftone-fill` via inline style
- [x] 2.2 Oppdater modulen til `fill: var(--halftone-fill, var(--ink))`
- [x] 2.3 Barrel-eksporten ble ikke berørt (props-type allerede re-eksportert via type-block)
- [x] 2.4 `/styleguide` rendrer HalftoneBlock fortsatt (default-fill)

## 3. Seksjonskomponenter — del 1

- [x] 3.1 `Megabox` med credo_lines + halftone color="oklch(85% 0.08 80)"
- [x] 3.2 `CornerStamp` med -7° rotasjon og no-ads/no-algorithm/no-tracking-sub-linje
- [x] 3.3 `IntroNote` med gul lapp, +1.2° rotasjon, box-shadow, lenke til /manifest
- [x] 3.4 `PullquoteBand` med halftone i begge hjørner (color dempet ink for gul bg)

## 4. Seksjonskomponenter — del 2

- [x] 4.1 `ManifestCut` med to photo-tape-strimler, 3 sitater fra manifest_pullquotes
- [x] 4.2 `StuaPreview` -0.8° med tape sentrert, ukens-spørsmål + 4 tråder + Logg inn-lenke
- [x] 4.3 `GuestbookGrid` med 3 notes med vekslende rotasjon og fargevariasjon
- [x] 4.4 `ProjectsRow` med 5 cards og lenke-wrapping per D14 (http → `<a>`, intern → `<Link>`, null → `<div>`)

## 5. Seksjonskomponenter — del 3

- [x] 5.1 `AboutRow` med bio + 4 ImagePlaceholders + PHOTO_LAYOUT-tabell
- [x] 5.2 `Trio` med warm/default/dark varianter (TIL/Lab/Endringslogg)
- [x] 5.3 `BlogStrip` med 3 hvite klipp på sort bakgrunn
- [x] 5.4 Tom-fallback i BlogStrip → `<UnderConstructionBanner>`

## 6. FooterRow + copyright-linje

- [x] 6.1 `FooterRow` med VisitorCounter + WebringWidget card + UnderConstructionBanner
- [x] 6.2 Copyright-linja inline i page.tsx (mono 10px, ink-fade)

## 7. Barrel + page assembly

- [x] 7.1 Barrel-eksport `src/components/forside/index.ts` med alle 12 + props-typer
- [x] 7.2 `src/app/page.tsx` server component med alle 12 seksjoner i wrapper-`<section>`s
- [x] 7.3 `src/app/page.module.css` med 12-kolonners grid og per-seksjon plassering

## 8. Verifisering

- [x] 8.1 `npx tsc --noEmit` rent
- [x] 8.2 `npm run dev` rent
- [x] 8.3 `/` returnerer 200 — alle 13 seksjoner bekreftet via grep (STAY, GROUNDED, CREATE, SHIT, Privat·Eid, Hei. Jeg heter, Manifest · Akt 1, Stua → akkurat nå, Gjestebok, Prosjekter, gjestebok med tre, Hvem skriver dette, TIL, Labben, Endringslogg, Fra bloggen, BESØKENDE, © Geir, bake.geish.no, readme.riot)
- [x] 8.4 `/smoke` returnerer 200 (uberørt)
- [x] 8.5 `/styleguide` returnerer 200 (HalftoneBlock default fortsatt fungerer)
- [ ] 8.6 Visuell sammenligning av `/` mot `screenshots/01-forside.png` — utføres av Geir i nettleser

## 9. Forbudslisten + cleanup

- [x] 9.1 Ingen `border-radius > 0` i forside-komponentene eller page.module.css
- [x] 9.2 Ingen blur-skygger
- [x] 9.3 Ingen `linear-gradient` (kun shared har repeating-linear-gradient i UC-banner og ImagePlaceholder)
- [x] 9.4 Ingen Tailwind/shadcn-referanser i src/components/forside/, src/app/page.*, src/content/
- [x] 9.5 Ingen `@/components/ui`-imports
