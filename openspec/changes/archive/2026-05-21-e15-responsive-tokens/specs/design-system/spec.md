## MODIFIED Requirements

### Requirement: tokens.css kopieres ordrett fra handoffen

`src/styles/tokens.css` SHALL være basert på `design_handoff_geish/references/tokens.css`. Variabelnavn og kommentar-struktur MUST forbli identiske med kilden, slik at Geir kan redigere én fil og se endringen på tvers. **Verdier kan avvike** der avtalt responsive utvidelser er definert i `src/styles/RESPONSIVE.md`:

- Heading-skala-tokens (`--t-h3`, `--t-h2`, `--t-h1`, `--t-mega`) er `clamp(min, vw, max)`-uttrykk der `max` er handoff-verdien. Desktop-rendering (≥1280px viewport) er identisk med handoff.
- Smalere skala-tokens (`--t-meta`, `--t-small`, `--t-body`, `--t-lead`) forblir faste px-verdier som i handoff.
- Nye tokens kan legges til (f.eks. breakpoint-konstanter) så lenge de er dokumentert i RESPONSIVE.md.

Filen MUST inneholde (i tillegg til original handoff-innhold):

- Papir/blekk-paletten: `--paper`, `--paper-warm`, `--paper-edge`, `--paper-dark`, `--ink`, `--ink-soft`, `--ink-fade` (alle i `oklch()`).
- Aksent-paletten: `--stamp`, `--stamp-fade`, `--highlight`.
- Font-rolle-variabler: `--font-display`, `--font-poster`, `--font-typewriter`, `--font-mono`, `--font-serif` med fallback-stacker.
- Type-skala: `--t-meta` til `--t-mega` (heading-tier som clamp()).
- Spacing: `--sp-1` til `--sp-16`.
- Border-shorthands: `--border`, `--border-soft`, `--border-dashed`.
- Hjelpeklasser: `.paper` (grain-bakgrunn), `.stamp`, `.torn-bottom`, `.blink`.
- Globale resets: box-sizing, body-margin, button/a-defaults.
- **Breakpoint-konstanter**: `--bp-tablet: 768px;` og `--bp-mobile: 480px;` med kommentar som forklarer at media queries må bruke raw px (CSS-spesifikasjonen tillater ikke `var()` i `@media`-conditions).

#### Scenario: variabelnavn matcher handoff-kilden
- **WHEN** variabel-navnene i `src/styles/tokens.css` sammenlignes med `design_handoff_geish/references/tokens.css`
- **THEN** alle originale variabelnavn (`--paper`, `--ink`, `--font-display`, `--t-h1`, `--sp-4`, osv.) finnes i begge filer med samme navn

#### Scenario: desktop-rendering uendret
- **WHEN** en side med `var(--t-mega)` rendres på ≥1280px viewport-bredde
- **THEN** computed font-size er 144px (clamp `max` vinner)

#### Scenario: heading-tokens skalerer på smal skjerm
- **WHEN** en side med `var(--t-h1)` rendres på 380px viewport
- **THEN** computed font-size er mindre enn 88px og minst clamp `min` (40px)

#### Scenario: breakpoint-konstanter eksisterer
- **WHEN** `getComputedStyle(document.documentElement).getPropertyValue("--bp-tablet")` evalueres
- **THEN** verdien er `"768px"`. Tilsvarende `--bp-mobile` er `"480px"`.

## ADDED Requirements

### Requirement: --chaos skaleres ned ved tablet og mobil

`src/app/globals.css` SHALL definere `--chaos: 1` på `:root` (desktop default), og overstyre den i to media queries:

- `@media (max-width: 767.98px)` SHALL sette `--chaos` til `0.4` (tablet og smalere).
- `@media (max-width: 479.98px)` SHALL sette `--chaos` til `0.15` (mobil og smalere — overstyrer tablet-regelen via senere kaskade).

Verdiene SHALL ikke være `0` — collage-sjelen skal bevares (per mandatets "roligere, ikke flatere"-prinsipp).

Siden alle rotasjoner i E1 bruker `var(--chaos, 1)` (Stamp, StuaPreview, GuestbookGrid, ProjectsRow, ImagePlaceholder, AboutRow-photos, IntroNote, CornerStamp), forplanter dempingen seg automatisk. Ingen komponent endres for å støtte dette.

#### Scenario: --chaos er 1 på desktop
- **WHEN** viewport er ≥768px og `getComputedStyle(document.documentElement).getPropertyValue("--chaos")` evalueres
- **THEN** verdien er `"1"` (eller tilsvarende numerisk representasjon)

#### Scenario: --chaos er 0.4 på tablet
- **WHEN** viewport er 480–767px
- **THEN** verdien er `"0.4"`

#### Scenario: --chaos er 0.15 på mobil
- **WHEN** viewport er <480px
- **THEN** verdien er `"0.15"`

#### Scenario: roterte komponenter dempes på smal skjerm
- **WHEN** en `<Stamp rotate={-7}>` rendres på `/styleguide` ved 380px viewport
- **THEN** computed transform er omtrent `rotate(-1.05deg)` (-7 * 0.15)

### Requirement: Fluid mega-typografi via clamp()

`src/styles/tokens.css` SHALL definere heading-skala-tokens som `clamp(min, vw, max)`-uttrykk:

- `--t-h3`, `--t-h2`, `--t-h1`, `--t-mega` MUST være clamp()-uttrykk der `max` er dagens desktop-verdi (hhv. 28px, 48px, 88px, 144px).
- `min` MUST være lesbar på 380px viewport (foreslått: 20px, 28px, 40px, 56px — Geir kan finjustere).
- `vw`-koeffisienten SHALL være valgt slik at clamp `max` vinner ved ≥1280px viewport-bredde (foreslått: 2.5vw, 4vw, 7vw, 12vw).

Mindre tokens (`--t-meta: 11px`, `--t-small: 13px`, `--t-body: 16px`, `--t-lead: 20px`) SHALL forbli faste — det er kun mega-tier som sprenger på smal skjerm.

#### Scenario: heading-tokens er clamp-uttrykk
- **WHEN** `src/styles/tokens.css` inspiseres
- **THEN** `--t-h3`, `--t-h2`, `--t-h1`, `--t-mega` har verdier på formen `clamp(<min>, <vw>, <max>)`

#### Scenario: body-tokens er faste
- **WHEN** `src/styles/tokens.css` inspiseres
- **THEN** `--t-meta`, `--t-small`, `--t-body`, `--t-lead` har enkle px-verdier

### Requirement: RESPONSIVE.md dokumenterer mønsteret

Repoet SHALL ha en `src/styles/RESPONSIVE.md` som dokumenterer responsive-strategien som en oppskrift E2+ kan følge. Filen MUST inneholde:

1. **Breakpoints-tabell**: navn (tablet, mobil), px-verdi, hva som skjer der.
2. **`--chaos`-skalaen**: verdiene per breakpoint og hvordan de forplanter seg.
3. **Typografi-strategi**: hvorfor `clamp()` for mega-tier, hvorfor faste body-tier-verdier.
4. **Grid-kollaps-prinsipp**: 12 → 2 → 1 ved breakpoints, med referanse til Change 2 (`e15-forside-responsive`) som anvender det på forsiden.
5. **Sjekkliste for E2+**: bruk tokens, ikke hardkod heading-fontstørrelser i px, ikke innfør parallell rotasjons-styring, ikke bruk DOM-`order`-hacks for å oppnå stabling, plasser breakpoint-spesifikke overrides i globals.css eller den ruten-spesifikke `*.module.css` — ikke i komponentens egen modul (gjør den uskalerbart i andre kontekster).

#### Scenario: RESPONSIVE.md finnes
- **WHEN** `ls src/styles/RESPONSIVE.md` kjøres
- **THEN** filen finnes med ikke-tomt innhold

#### Scenario: dokumentet refererer breakpoints
- **WHEN** `RESPONSIVE.md` inspiseres
- **THEN** filen nevner `768px`, `480px`, `--bp-tablet`, `--bp-mobile`, og `--chaos`-overrides

### Requirement: Shared-komponenter forblir lesbare på 380px

`src/components/shared/` SHALL ikke ha komponenter som sprenger horisontal scroll eller blir uleselige på 380px viewport. Komponenter som hardkoder bredder/størrelser SHALL inspiseres; fix gjøres kun der det faktisk knekker (ikke proaktiv refaktorering av komponenter som allerede flyter).

`WebringWidget` bar-variant SHALL bruke `flex-wrap: wrap` for å unngå horisontal scroll når lenkene + members-tellingen ikke får plass på én linje.

Andre shared-komponenter er allerede fleksible (padding-basert, flex/grid med auto-fit) og krever ingen endring.

#### Scenario: WebringWidget bar wrapper
- **WHEN** `<WebringWidget variant="bar">` rendres på 380px viewport
- **THEN** komponenten forårsaker ikke horisontal scroll; innholdet wrapper til ny linje hvis nødvendig

#### Scenario: ingen shared-komponent forårsaker scroll
- **WHEN** `/styleguide` rendres på 380px viewport (Chrome DevTools device-emulering)
- **THEN** body har ikke horisontal scroll
