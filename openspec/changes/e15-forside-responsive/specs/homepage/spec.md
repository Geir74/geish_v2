## MODIFIED Requirements

### Requirement: Forsiden bygger 13 seksjoner i 12-kolonners zine-grid

`src/app/page.tsx` SHALL rendre en hel forside med 13 seksjoner. Grid-layouten i `src/app/page.module.css` SHALL kollapse responsivt:

**≥ 768px viewport (desktop, uendret fra E1):**
12-kolonners CSS-grid med `grid-template-columns: repeat(12, 1fr)`, `grid-auto-rows: minmax(40px, auto)`, `gap: 14px`, padding `32px 28px 48px`. Hver seksjon har eksplisitt `grid-column` og `grid-row` per tabell:

| # | Seksjon | Grid-plassering |
|---|---------|-----------------|
| 1 | Megabox | `1 / span 8`, `span 4` |
| 2 | CornerStamp | `9 / span 4`, `1 / span 2` |
| 3 | IntroNote | `9 / span 4`, `3 / span 2` |
| 4 | ManifestCut | `1 / span 5`, `span 4` |
| 5 | StuaPreview | `6 / span 4`, `span 4` |
| 6 | GuestbookGrid | `10 / span 3`, `span 4` |
| 7 | ProjectsRow | `1 / span 8`, `span 4` |
| 8 | PullquoteBand | `1 / span 12`, `span 2` |
| 9 | AboutRow | `1 / span 12`, `span 5` |
| 10 | Trio | `1 / span 12`, `span 5` |
| 11 | BlogStrip | `1 / span 12`, `span 3` |
| 12 | FooterRow | `1 / span 12`, auto |
| 13 | Copyright | `1 / span 12`, auto |

**480–767px (tablet/nettbrett):**
`grid-template-columns: repeat(2, 1fr)`. Naturlige pairings:
- Megabox, ManifestCut, ProjectsRow, PullquoteBand, AboutRow, Trio, BlogStrip, FooterRow, Copyright: full bredde (`grid-column: 1 / span 2`).
- CornerStamp + IntroNote: 1+1 i én rad.
- StuaPreview + GuestbookGrid: 1+1 i én rad.
- `grid-auto-rows: auto` (hver seksjon høyde-fri).

**< 480px (mobil):**
`grid-template-columns: 1fr`. Alle seksjoner stables i DOM-rekkefølge (1–13).

**DOM-rekkefølgen i `page.tsx` MUST forbli 1–13.** Ingen `order`-CSS-property brukes for å oppnå stabling i annen rekkefølge enn DOM. Per `RESPONSIVE.md`-sjekklisten.

#### Scenario: forsiden rendrer alle 13 seksjoner uavhengig av breakpoint
- **WHEN** `npm run dev` kjøres og GET sendes til `/` ved viewport-bredder 320px, 380px, 600px, 768px, 1280px
- **THEN** responsen returnerer 200 og inneholder bevis på alle 13 seksjoner (karakteristisk copy som "STAY", "Privat·Eid", "Hei. Jeg heter", "Manifest · Akt 1", "Stua → akkurat nå", "Gjestebok", "Prosjekter", "gjestebok med tre", "Hvem skriver dette", "TIL", "Labben", "Endringslogg", "Fra bloggen", "BESØKENDE", "© Geir")

#### Scenario: desktop uendret
- **WHEN** viewport er ≥768px
- **THEN** computed `grid-template-columns` på `.grid` er `repeat(12, 1fr)` (12 like kolonner) og hver seksjon har sin opprinnelige `grid-column`/`grid-row`-plassering fra E1

#### Scenario: tablet pairer Stua+gjestebok og CornerStamp+IntroNote
- **WHEN** viewport er 480–767px
- **THEN** computed `grid-template-columns` er `repeat(2, 1fr)`. StuaPreview og GuestbookGrid har `grid-column: span 1` slik at de står side om side. CornerStamp og IntroNote har `grid-column: span 1` slik at de står side om side.

#### Scenario: mobil stabler i DOM-rekkefølge
- **WHEN** viewport er <480px
- **THEN** computed `grid-template-columns` er `1fr`. Hver seksjon spanner én kolonne. DOM-rekkefølgen 1–13 er bevart i visuell rekkefølge.

#### Scenario: ingen horisontal scroll på smal skjerm
- **WHEN** viewport er 292px (eller bredere) og `/` rendres
- **THEN** `document.documentElement.scrollWidth <= document.documentElement.clientWidth` (ingen horisontal scroll). Verifisert ved 292px (tidligere bug-bredde), 320px, 380px, 600px, 768px, 1280px.

### Requirement: 12 forside-spesifikke seksjonskomponenter under src/components/forside/

Prosjektet SHALL ha 12 seksjonskomponenter under `src/components/forside/`, hver i sin egen mappe med `index.tsx` og en CSS Module. Komponentene er Megabox, CornerStamp, IntroNote, ManifestCut, StuaPreview, GuestbookGrid, ProjectsRow, PullquoteBand, AboutRow, Trio, BlogStrip, FooterRow. (13. seksjon, copyright-linje, er inline i `page.tsx`.)

Hver komponent MUST:
- Eksportere et navngitt TypeScript-interface for props.
- Bruke CSS Modules for styling.
- Hente all copy fra `t()` — ingen hardkodede strenger som vises til bruker.
- Bruke `var(--chaos, 1)` på alle rotasjoner.
- Følge forbudslisten i `01-DESIGN-SYSTEM.md` §8.

**Mega-fontstørrelser SHALL ikke være hardkodede px-verdier.** De MUST være enten:
- En `clamp(min, vw, max)`-uttrykk i komponentens CSS Module (lokal, der max = ønsket desktop-verdi).
- En referanse til en `var(--t-XXX)`-token i tokens.css (når seksjonens størrelse matcher token-skalaen eksakt).

Konkrete krav per seksjon:
- `Megabox` `.h1`: `clamp(40px, 10.5vw, 124px)` (Bungee plakat-headline). Min må holde det lengste ubrytelige ordet ("GROUNDED,") innenfor megabox-content-area på ~196px ved 292px viewport — 40px Bungee er ~180px for ordet.
- `ManifestCut` `.h2`: `clamp(24px, 3.2vw, 36px)`.
- `PullquoteBand` `.q`: `clamp(24px, 3.8vw, 42px)`.
- `AboutRow` `.bio` `.h3`: `clamp(28px, 3.9vw, 44px)`.
- `BlogStrip` `.h3`: `clamp(22px, 2.9vw, 32px)`.
- `ProjectsRow` `.h3`: `clamp(20px, 2.6vw, 30px)`.
- `IntroNote` `.hello`: `var(--t-h3)` (matcher token-skalaen eksakt på 28px max).
- Mindre headings (StuaPreview 22px, GuestbookGrid 18px, Trio 22px) MAY forbli som hardkodede px-verdier — de sprenger ikke på 380px viewport.

**AboutRow** SHALL i tillegg rendre sine egne photo-placeholders (`.photo` + `.tape` + `.box`) inline i stedet for å bruke `<ImagePlaceholder>` for bio-kollasjen. Dette gjøres for å la CSS Module være kilden til alle dimensjons- og posisjons-styling (via CSS-variabler), slik at media queries kan overstyre uten `!important` eller descendant-selektorer inn i shared-komponenter. Resten av AboutRows oppskrift (bio-boks med kicker, h3, lead, tags, links) er uendret.

#### Scenario: AboutRow eier sin egen photo-placeholder-implementasjon
- **WHEN** `src/components/forside/AboutRow/index.tsx` inspiseres
- **THEN** filen importerer ikke `ImagePlaceholder` fra `@/components/shared`; bio-kollasjen rendres via lokale `.photo`/`.tape`/`.box`-elementer i AboutRows egen DOM

#### Scenario: ingen hardkodet mega-fontstørrelse
- **WHEN** `grep -E "font-size:\s*(124px|42px|44px|36px|32px|30px)" src/components/forside/` kjøres på alle `*.module.css`-filer
- **THEN** treff finnes kun som `max`-argumentet inne i `clamp(...)`-uttrykk, ikke som rene px-verdier

#### Scenario: Megabox h1 skalerer
- **WHEN** `<Megabox>` rendres på 380px viewport
- **THEN** computed `font-size` på `.h1` er ≤ 56px og ≥ 40px (mindre enn 124px-max)

#### Scenario: PullquoteBand skalerer
- **WHEN** `<PullquoteBand>` rendres på 480px viewport
- **THEN** computed `font-size` på `.q` er mindre enn 42px og minst clamp `min` (24px)

#### Scenario: desktop matcher E1
- **WHEN** `<Megabox>` rendres på ≥1280px viewport
- **THEN** computed `font-size` på `.h1` er 124px (clamp `max` vinner). Tilsvarende for alle andre konverterte heading-størrelser — desktop pixel-identisk med E1.

### Requirement: AboutRow photo-kollasj fungerer på smal skjerm

`AboutRow` SHALL rendre sine egne photo-placeholders (egen `.photo` + `.tape` + `.box` i AboutRows DOM, ikke via `<ImagePlaceholder>`). Alle dimensjons- og posisjons-felt settes som CSS-variabler på `.photo`-wrapperen via `style`-prop i `index.tsx`; CSS Module (`AboutRow.module.css`) er kilden til styling og leser variablene. Ingen `!important` brukes; ingen descendant-selektor inn i shared-komponenter.

`AboutRow/index.tsx` SHALL sette følgende CSS-variabler per photo:
- `--photo-top`, `--photo-left`, `--photo-right`, `--photo-bottom` — string-verdier (`"4px"`, `"auto"`, osv.).
- `--photo-w`, `--photo-h` — string-verdier (`"180px"`, `"220px"`).
- `--rotation` — tall (grader, multipliseres med `1deg * var(--chaos, 1)` i CSS).

`AboutRow.module.css` SHALL definere:

**≥ 768px (desktop, pixel-identisk med E1):**
- `.photos { position: relative; height: 100%; }`.
- `.photo { position: absolute; top/left/right/bottom: var(--photo-X); width: var(--photo-w); height: var(--photo-h); transform: rotate(calc(var(--rotation, 0) * 1deg * var(--chaos, 1))); }` + border, stripe-bakgrunn, box-shadow.
- `.tape { position: absolute; top: -10px; left: 50%; transform: translateX(-50%) rotate(calc(-3deg * var(--chaos, 1))); width: 50px; height: 14px; }` + semitransparent gul fyll.
- `.box { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }` + mono-font for label.

**< 768px (tablet og smalere):**
- `.photos` SHALL bytte til `display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--sp-3); position: static; height: auto; margin-top: var(--sp-4)`.
- `.photo` SHALL overstyre `position: static; width: 100%; height: 120px` (CSS-Module-regel vinner siden det ikke finnes inline-style for disse property-ene på `.photo` — kun CSS-variabler).

**< 480px (mobil):**
- `.photos { grid-template-columns: 1fr }`.
- `.photo { height: 100px }`.

Rotasjon (via `--rotation`-CSS-variabel og `var(--chaos)`) SHALL bevares ved alle breakpoints — dempes naturlig av `--chaos`-skalering fra Change 1.

#### Scenario: desktop photo-kollasj uendret (pixel-identisk med E1)
- **WHEN** AboutRow rendres på ≥768px viewport
- **THEN** hver `.photo` har computed `position: absolute` med samme `top`/`left`/`right`/`bottom`/`width`/`height` som E1 (verdiene fra `PHOTO_LAYOUT` levert via CSS-variabler i stedet for direkte inline-properties)

#### Scenario: ingen inline-style for posisjon eller dimensjon
- **WHEN** `src/components/forside/AboutRow/index.tsx` inspiseres
- **THEN** `photoStyle`-objektet inneholder kun CSS-variabler (`--photo-*`, `--rotation`) — ingen direkte `position`/`top`/`left`/`right`/`bottom`/`width`/`height`-felt

#### Scenario: tablet bytter til grid-layout
- **WHEN** AboutRow rendres på 600px viewport
- **THEN** `.photos` har computed `display: grid` med `grid-template-columns: repeat(2, 1fr)`. Hver `.photo` har computed `position: static`. Ingen `!important` brukes i CSS-Modulen.

#### Scenario: mobil stabler photos i 1 kolonne
- **WHEN** AboutRow rendres på 380px viewport
- **THEN** `.photos` har `grid-template-columns: 1fr`. Hver photo har computed bredde lik containerens bredde og height: 100px.

#### Scenario: rotasjon bevart men dempet
- **WHEN** AboutRow rendres på 380px viewport
- **THEN** `.photo` har computed transform med `rotate(...)`-verdi som matcher `rotate × --chaos` (0.15 på mobil) — f.eks. -3.5 × 0.15 = -0.525deg for første photo

#### Scenario: AboutRow bruker ikke ImagePlaceholder
- **WHEN** `grep -l "ImagePlaceholder" src/components/forside/AboutRow/index.tsx` kjøres
- **THEN** ingen treff — AboutRow eier sin egen photo-placeholder-implementasjon

### Requirement: Forsiden gjenbruker shared-komponenter fra design-system

Forsiden SHALL bruke følgende shared-komponenter (fra `e1-design-system`):

- `HalftoneBlock` — i Megabox (med `color`-prop) og PullquoteBand (med `color`-prop).
- `Stamp` — i CornerStamp.
- `StatusBadge` — i ProjectsRow (per prosjekt-card) og Trio's Lab-kolonne.
- `VisitorCounter` — i FooterRow.
- `WebringWidget` (`variant="card"`) — i FooterRow.
- `UnderConstructionBanner` — i FooterRow, og som tom-tilstand-fallback i BlogStrip.

`<ImagePlaceholder>` brukes IKKE lenger i forside-seksjonene. AboutRows bio-kollasj rendrer sine egne photo-placeholders inline (per "AboutRow photo-kollasj"-requirementet) for å la CSS Module ha full kontroll over dimensjoner og posisjon på tvers av breakpoints. `<ImagePlaceholder>` består som shared-komponent og brukes fortsatt i `/styleguide` for å demonstrere mønsteret.

Forsiden SHALL ikke installere nye npm-pakker — alt bygger på det `e1-design-system` allerede leverte.

#### Scenario: forside-seksjoner importerer ikke ImagePlaceholder
- **WHEN** `grep -rl "ImagePlaceholder" src/components/forside/` kjøres
- **THEN** ingen treff — ingen forside-komponent bruker ImagePlaceholder

#### Scenario: ImagePlaceholder finnes fortsatt og brukes i styleguide
- **WHEN** `src/components/shared/ImagePlaceholder/index.tsx` og `src/app/styleguide/page.tsx` inspiseres
- **THEN** ImagePlaceholder-filen eksisterer uendret; styleguide importerer og rendrer den i komponent-seksjonen

#### Scenario: ingen nye deps
- **WHEN** `package.json` sammenlignes mellom før og etter dette mandatet
- **THEN** kun `src/`-filer og openspec-filer endrer seg; `dependencies` og `devDependencies` er identiske

### Requirement: Internal grids i seksjoner kollapser ved breakpoints

Følgende seksjoner SHALL ha internal grid-kollaps i sine egne CSS Modules:

- **`ProjectsRow` `.grid5`**:
  - ≥768px: `repeat(5, 1fr)` (5 cards i rad — E1 default).
  - 480–767px: `repeat(3, 1fr)`.
  - <480px: `repeat(2, 1fr)`.
- **`Trio` `.wrap`**:
  - ≥768px: `repeat(3, 1fr)` (TIL | Lab | Changelog — E1 default).
  - 480–767px: `repeat(2, 1fr)` (third column wrapper til neste rad).
  - <480px: `1fr` (alle stablet).
- **`BlogStrip` `.grid3`**:
  - ≥768px: `repeat(3, 1fr)` (E1 default).
  - 480–767px: `repeat(2, 1fr)`.
  - <480px: `1fr`.
- **`AboutRow` `.wrap`** (bio | photos):
  - ≥768px: `1.2fr 1fr` (E1 default).
  - <768px: `1fr` (bio og photos stablet).
- **`FooterRow` `.row`**:
  - ≥768px: `auto 1fr auto` (E1 default).
  - <768px: `1fr` (VisitorCounter, WebringWidget, UnderConstructionBanner stablet vertikalt, sentrert).

#### Scenario: ProjectsRow kollapser internal grid
- **WHEN** ProjectsRow rendres på 600px viewport
- **THEN** `.grid5` har computed `grid-template-columns: repeat(3, 1fr)`

#### Scenario: Trio kollapser til 1 kolonne på mobil
- **WHEN** Trio rendres på 380px viewport
- **THEN** `.wrap` har computed `grid-template-columns: 1fr`. Alle tre kolonner (TIL, Lab, Endringslogg) er stablet vertikalt i DOM-rekkefølge.

#### Scenario: FooterRow stabler vertikalt på narrow
- **WHEN** FooterRow rendres på 600px viewport
- **THEN** `.row` har computed `grid-template-columns: 1fr` og elementene er stablet vertikalt
