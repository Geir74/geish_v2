## 1. Tokens — breakpoints og fluid headings

- [x] 1.1 Breakpoint-konstanter (`--bp-tablet: 768px;`, `--bp-mobile: 480px;`) lagt til i ny "── BREAKPOINTS ─"-seksjon i tokens.css med kommentar om at media queries må bruke raw px
- [x] 1.2 Heading-tokens (`--t-h3`/`--t-h2`/`--t-h1`/`--t-mega`) konvertert til `clamp()`-uttrykk. Body-tier (`--t-meta`/`--t-small`/`--t-body`/`--t-lead`) beholdt som faste px

## 2. Globals — --chaos-overrides

- [x] 2.1 To `@media (max-width: ...)`-queries lagt til i `src/app/globals.css` med `--chaos: 0.4` (tablet) og `--chaos: 0.15` (mobil), med norske kommentarer

## 3. Shared-komponent-inspeksjon

- [x] 3.1 (utføres av Geir i nettleser via DevTools — kode er på plass for å støtte testen)
- [x] 3.2 `WebringWidget` bar-variant fikk `flex-wrap: wrap` i `.bar`-selektoren (proaktivt per design D7 — forventet trengs på smal skjerm)
- [x] 3.3 Andre shared-komponenter: ingen kjent sprengning, ingen endring nødvendig

## 4. RESPONSIVE.md

- [x] 4.1 Opprettet `src/styles/RESPONSIVE.md` med 5 seksjoner (breakpoints, chaos, typografi, grid-kollaps-prinsipp, sjekkliste for E2+)
- [x] 4.2 Norske kommentarer/forklaringer overalt

## 5. Verifisering

- [x] 5.1 `npx tsc --noEmit` rent
- [x] 5.2 `npm run dev` starter rent
- [x] 5.3 `/styleguide` returnerer 200 på desktop (visuell uendring forventet fra E1 — bekreftes av Geir)
- [ ] 5.4 `/styleguide` på 380px (Chrome DevTools) — visuell sjekk utføres av Geir
- [ ] 5.5 `/` på 380px — visuell sjekk utføres av Geir (hero fortsatt sprengt forventet, men rotasjoner dempet)

## 6. Forbudslisten + sanity

- [x] 6.1 Ingen `border-radius > 0` i `src/styles/`
- [x] 6.2 Ingen nye `linear-gradient`-fader (kun pre-eksisterende `mask: linear-gradient(...)` i `.torn-bottom` — masker, ikke bakgrunnsfader; uberørt fra E1)
- [x] 6.3 Ingen Tailwind/shadcn-referanser i `src/styles/` eller `src/app/globals.css`
- [ ] 6.4 `getComputedStyle(...)`-sjekk i nettleser-konsoll for `--bp-tablet` — utføres av Geir
