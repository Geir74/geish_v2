## Why

E1 ble bygget desktop-only med vilje. Forsiden laster på mobil men sprenger — 12-kolonners gridet med faste `grid-column`-spenn og hardkodede mega-fontstørrelser har ingen breakpoints. E1.5 retter dette, men viktigere: det definerer *hvordan* zine-stil oppfører seg responsivt som et prinsipp i designsystemet, slik at E2+ (blogg, Stua, gjestebok) arver et ferdig mønster.

Dette er Change 1 av to. Den etablerer mekanismen — breakpoints, dempet `--chaos`, fluid mega-typografi, dokumentert oppskrift — uten å røre forside-layouten. Change 2 (`e15-forside-responsive`) anvender mønsteret på forsiden etterpå.

## What Changes

- **Breakpoint-konstanter i `src/styles/tokens.css`** som CSS-variabler: `--bp-tablet: 768px;`, `--bp-mobile: 480px;`. Kommentar gjør det klart at *media queries må bruke raw px* (CSS-spesifikasjon tillater ikke `var()` i media query-conditions). Variablene er for dokumentasjon og bruk i `clamp()`/`calc()` der det er meningsfylt.
- **Fluid heading-tokens via `clamp()`** i `tokens.css`: `--t-h3`, `--t-h2`, `--t-h1`, `--t-mega` blir `clamp(min, vw, max)`-uttrykk der `max` er dagens desktop-verdi. På ≥1280px er resultatet identisk med før (max vinner); på smalere skjermer skalerer de jevnt ned. Smalere tokens (`--t-meta`, `--t-small`, `--t-body`, `--t-lead`) forblir faste — det er bare mega-tier som sprenger.
- **`--chaos`-overrides i `src/app/globals.css`**: to media queries (`max-width: 767.98px` og `max-width: 479.98px`) som setter `--chaos` til hhv. `0.4` og `0.15`. Siden alle rotasjoner i E1 bruker `var(--chaos, 1)` (Stamp, StuaPreview, GuestbookGrid-notes, ProjectsRow-cards, ImagePlaceholder-rotate, AboutRow-photos, IntroNote, CornerStamp), forplanter dempingen seg automatisk til hver komponent. Ingen komponent endres for å støtte dette — det er kjernen i "demp ett sted".
- **Inspeksjon av shared-komponenter** for hardkodede bredder/størrelser som sprenger på smal skjerm. Forventet utfall: ingen fix nødvendig — komponentene bruker padding/flex/grid og flyter naturlig. Eventuelle fix dokumenteres.
- **Dokumentere mønsteret** i en ny `src/styles/RESPONSIVE.md` med oppskriften E2+ skal følge: breakpoint-verdier, `--chaos`-skalaen, typografi-strategi, og grid-kollaps-prinsippet (12 → 2 → 1) — selv om Change 1 ikke selv anvender grid-kollaps, dokumenterer den regelen så Change 2 og senere kan referere til den.
- **Desktop forblir pixel-identisk** med dagens E1: max-clamp-verdiene er dagens verdier, og `--chaos: 1` er beholdt over 768px.

## Capabilities

### Modified Capabilities
- `design-system`: Tokens får responsive utvidelser (breakpoint-konstanter, fluid heading-tokens via clamp). Krav om "tokens.css ordrett fra handoff" oppdateres til å tillate avtalte responsive overrides med uendrede variabelnavn. `globals.css` får `--chaos`-skalering i media queries. En ny dokumentasjonsfil `RESPONSIVE.md` beskriver mønsteret.

## Impact

- **Avhengigheter (ingen nye)**: Vi går *ikke* re-introdusere PostCSS-pipeline for `postcss-custom-media`. Turbopack-støtten for vilkårlige PostCSS-plugins er begrenset i Next 16, og to breakpoints rettferdiggjør ikke build-pipeline-kompleksiteten. CSS-spesifikasjonen tillater uansett ikke `var()` i media query-conditions — så ingen native løsning finnes uten build-step.
- **Filsystem (modifisert)**:
  - `src/styles/tokens.css` — to nye breakpoint-konstanter med kommentar; `--t-h3`/`--t-h2`/`--t-h1`/`--t-mega` omformes til `clamp()`-uttrykk.
  - `src/app/globals.css` — to nye media queries med `--chaos`-overrides.
- **Filsystem (nytt)**: `src/styles/RESPONSIVE.md` — kort oppskrift.
- **Røres ikke**: shared-komponenter (med mindre inspeksjonen finner noe som sprenger — i så fall dokumenteres minimale fix), forside-seksjoner, forsidens grid-layout (`src/app/page.module.css`), content-modulet, DB/Supabase, smoke-ruten, styleguide-ruten.
- **Eksterne systemer**: ingen.
- **Ut av scope**: forsidens grid-kollaps (Change 2 `e15-forside-responsive`), seksjons-spesifikke responsive justeringer (Change 2), pixel-perfekt mobil-mockup (det finnes ingen), full mobil-styleguide (vi sikter på "lesbar", ikke "egen mobil-versjon"). Engelsk locale — fortsatt urørt.
