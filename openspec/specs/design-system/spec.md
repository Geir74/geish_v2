# design-system Specification

## Purpose
TBD - created by archiving change e1-design-system. Update Purpose after archive.
## Requirements
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

### Requirement: 5 fonter via next/font/google

`src/app/layout.tsx` SHALL laste følgende fonter via `next/font/google`:

| Font | Vekter | CSS-variabel |
|------|--------|--------------|
| Archivo Black | 400 | `--font-display` |
| Bungee | 400 | `--font-poster` |
| Special Elite | 400 | `--font-typewriter` |
| JetBrains Mono | 400, 500, 700 | `--font-mono` |
| Newsreader | 400, 600 (normal + italic) | `--font-serif` |

Variabel-navnene MUST matche tokens.css. Fonter MUST self-hostes via Next.js sin build-time fetch (ingen runtime-request til googleapis.com). `<html>`-elementet i layout MUST motta alle 5 fontvariabler som className.

#### Scenario: fontene self-hostes
- **WHEN** produksjonsbuild kjøres (`npm run build`)
- **THEN** ingen network-request til `fonts.googleapis.com` eller `fonts.gstatic.com` skjer i runtime; font-filene serveres fra `.next/static/media/`

#### Scenario: font-variabler er satt på <html>
- **WHEN** styleguide-ruten rendres
- **THEN** computed style på `<html>` viser at `--font-display`, `--font-poster`, `--font-typewriter`, `--font-mono`, `--font-serif` peker på next/font-genererte font-family-stringer (ikke kun fallback)

#### Scenario: komponenter rendrer i riktig font
- **WHEN** styleguide-ruten rendres og en `<h1>` med `font-family: var(--font-display)` inspiseres
- **THEN** computed `font-family` inkluderer "Archivo Black" (eller next/fonts genererte navn for det)

### Requirement: 8 shared-komponenter portet til React + CSS Modules

Prosjektet SHALL ha følgende komponenter under `src/components/shared/`, hver i sin egen mappe med `index.tsx` (TypeScript) og `*.module.css`:

1. **`VisitorCounter`** — props: `count: string`, `label?: string`, `size?: "sm" | "md" | "lg"`. Sort boks, oransje LED-siffer i mono-font.
2. **`UnderConstructionBanner`** — props: `compact?: boolean`, `text?: string`. Blinkende banner med gul/cream-stripemønster.
3. **`WebringWidget`** — props: `variant?: "bar" | "card" | "stamp"`, samt eksplisitte tekstprops (ingen `window.t()`). Tre varianter via `data-variant`-attributt.
4. **`GuestbookSnippet`** — props: `items: Array<{ who: string; when: string; msg: string }>`, `style?: "list" | "cards"`. Default-items er 3 dummy-innlegg.
5. **`StatusBadge`** — props: `status: "live" | "wip" | "idea"`. Tekst-label (`LIVE` / `WIP` / `IDÉ`), aldri emoji.
6. **`Stamp`** — props: `rotate?: number` (grader), `size?: number` (font-size px), `children: ReactNode`. Rødt gummistempel-look.
7. **`ImagePlaceholder`** — props: `label?: string`, `w?: string | number`, `h?: number`, `tape?: boolean`, `rotate?: number`. Stripet placeholder med klammeparentes-label.
8. **`HalftoneBlock`** — props: `w?: number`, `h?: number`, `density?: number` (0..1), `color?: string` (CSS-fargestreng for prikkene; default `var(--ink)`). SVG-prikkmønster som dekor.
9. **`Pullquote`** — props: `children: ReactNode`, `variant?: "quiet" | "loud"` (default `"quiet"`). Archivo Black sitat med to varianter:
   - **`quiet`** (default, blog-bruk): sentrert, ink-farget, symmetrisk double-border top/bottom, `clamp(20px, 3vw, 26px)`-skala, `max-width: 600px`.
   - **`loud`** (manifest-bruk): venstrejustert, stempel-rød tekst (`color: var(--stamp)`), italic (`font-style: italic`), hard venstre-blokk (`border-left: 10px solid var(--stamp)`), `clamp(30px, 5vw, 44px)`-skala, `max-width: 680px`. Sitatene skal rope — ikke hviske. **Italic er et bevisst design-avvik fra `01-DESIGN-SYSTEM.md` §6** ("Pullquotes er Archivo Black, ikke italic") for å gi manifest-tonen framlent-energi-i-rop. Dokumentert i CSS-kommentar for å unngå at en framtidig pass "retter" det.
   Flyttet fra `src/lib/blog/Pullquote/` i `e2-manifest` siden to ruter konsumerer den, og samtidig utvidet med variant-prop.

Alle komponenter MUST:
- Eksportere et navngitt TypeScript-interface for props.
- Bruke CSS Modules for all styling (ingen inline `style`-attributt utenom å sette CSS-variabler som `--rotation`, `--halftone-fill`).
- Bruke `var(--chaos, 1)` for rotasjons-multiplikatorer.
- Følge forbudslisten i `01-DESIGN-SYSTEM.md` §8.

En barrel-eksport `src/components/shared/index.ts` MUST re-eksportere alle 9 komponenter.

#### Scenario: alle 9 komponenter eksisterer
- **WHEN** `ls src/components/shared/` kjøres
- **THEN** mappene `VisitorCounter`, `UnderConstructionBanner`, `WebringWidget`, `GuestbookSnippet`, `StatusBadge`, `Stamp`, `ImagePlaceholder`, `HalftoneBlock`, `Pullquote` finnes, hver med en `index.tsx` og en `*.module.css`

#### Scenario: barrel-eksport fungerer for Pullquote
- **WHEN** en fil importerer `import { Pullquote } from "@/components/shared"`
- **THEN** TypeScript kompilerer uten feil og komponenten er tilgjengelig

#### Scenario: quiet er default-varianten
- **WHEN** `<Pullquote>tekst</Pullquote>` rendres uten variant-prop
- **THEN** elementet får CSS-klassen som matcher quiet (symmetrisk double-border, sentrert, ink-farget)

#### Scenario: loud overstyrer
- **WHEN** `<Pullquote variant="loud">tekst</Pullquote>` rendres
- **THEN** elementet får CSS-klassen som matcher loud (venstrejustert, stempel-rød, border-left)

#### Scenario: Pullquote eksisterer ikke lenger i lib/blog/
- **WHEN** `ls src/lib/blog/` kjøres
- **THEN** ingen `Pullquote/`-mappe finnes; komponenten er flyttet til shared

#### Scenario: HalftoneBlock med color-prop overstyrer default-fill
- **WHEN** `<HalftoneBlock color="oklch(85% 0.08 80)" />` rendres
- **THEN** SVG-prikkene har `fill` lik den oppgitte fargen, ikke `var(--ink)`

#### Scenario: HalftoneBlock uten color-prop bruker default
- **WHEN** `<HalftoneBlock />` rendres uten `color`
- **THEN** SVG-prikkene har `fill: var(--ink)` (default fra modulen)

#### Scenario: ingen Tailwind-utility-klasser i komponentene
- **WHEN** `grep -r "className=\"[a-z]*-[a-z]*-[a-z]*\"" src/components/shared/` kjøres
- **THEN** treff er kun på CSS Modules-genererte klassenavn, ikke Tailwind-utilities som `bg-gray-500` eller `text-sm`

### Requirement: --chaos rotasjons-multiplikator

`src/app/globals.css` SHALL definere `--chaos: 1` på `:root`. Komponenter som roterer (Stamp, GuestbookSnippet i cards-modus, ImagePlaceholder med `rotate`-prop) MUST multiplisere sin rotasjon med `var(--chaos, 1)` slik at rotasjonsnivået kan justeres globalt fra én variabel.

#### Scenario: chaos satt til 0 fjerner alle rotasjoner
- **WHEN** `:root { --chaos: 0; }` overstyres i devtools og `/styleguide` rendres
- **THEN** alle Stamp/GuestbookSnippet-cards/ImagePlaceholder-rotasjoner går til 0 grader (rette)

#### Scenario: chaos default er 1
- **WHEN** styleguide rendres uten devtools-overstyring
- **THEN** computed style på `:root` viser `--chaos: 1`

### Requirement: styleguide-rute viser hele systemet

Prosjektet SHALL ha en `src/app/styleguide/page.tsx` (URL `/styleguide`) som rendrer:

1. **Tokens**: paletter (paper-svømmer, ink-svømmer, stamp-aksent, status-farger), type-skala-prøver (en `<p>` i hver type-rolle), spacing-stige (`--sp-1` til `--sp-16` visualisert som vertikale streker).
2. **Komponenter**: hver av de 8 shared-komponentene rendret i alle sine varianter, med en `<h2>` med navnet og en kort beskrivelse.
3. **Mønstre**: photo-tape, flat sort skygge, stripet placeholder-bakgrunn, gul marker-highlight — én demo-boks per mønster.

Ruten SHALL være permanent (ikke gated bak `NODE_ENV=development`), men ulinket fra forsiden — den finnes via direkte URL.

#### Scenario: styleguide laster
- **WHEN** `npm run dev` kjøres og HTTP-request sendes til `/styleguide`
- **THEN** ruten returnerer 200, ingen kompileringsfeil, og responsen inneholder seksjoner for tokens, komponenter og mønstre

#### Scenario: styleguide rendrer alle 8 komponenter
- **WHEN** `/styleguide` lastes
- **THEN** responsen inneholder synlig representasjon av VisitorCounter, UnderConstructionBanner (compact + full), WebringWidget (bar + card + stamp), GuestbookSnippet (list + cards), StatusBadge (live + wip + idea), Stamp, ImagePlaceholder, HalftoneBlock

#### Scenario: styleguide er ulinket
- **WHEN** forsiden `/` rendres
- **THEN** den inneholder en henvisning til `/styleguide` (anker eller meta-tekst), men forsiden er ikke selv linket fra styleguide-bunnen

### Requirement: forbudsliste håndheves

Implementeringen SHALL ikke introdusere:

- **Gradient-bakgrunner** (`linear-gradient(...)` med fargestopps, `radial-gradient(...)`). Unntak: stripet-mønster via `repeating-linear-gradient(...)` med solid fargestopps er et eksplisitt designmønster (UC-banner, ImagePlaceholder) og er tillatt.
- **Rounded corners** (`border-radius` > 0) utenfor browser-defaults for form-elementer.
- **Drop-shadow med blur** (`box-shadow` med blur-radius > 0). Bruk flat offset: `box-shadow: Npx Npx 0 var(--ink)`.
- **Emoji som ikoner** i komponenter. Karakter-glyfer (`▲`, `⚠`, `·`, `→`) er tillatt; bilde-emoji (🟢, 🔗, 📌) er ikke.
- **Sans-serif system-font for brødtekst**. Default body-font MUST være `var(--font-typewriter)`.

#### Scenario: ingen rounded-corners i komponent-CSS
- **WHEN** `grep -rE "border-radius:\s*[1-9]" src/components/shared/ src/app/` kjøres
- **THEN** ingen treff utover eventuelle 0-verdier eller form-element-resets

#### Scenario: ingen blur-skygger
- **WHEN** `grep -rE "box-shadow:.*[1-9]px [0-9]+px [1-9]" src/components/shared/ src/app/` kjøres
- **THEN** ingen treff (alle box-shadow-verdier har 0 i tredje posisjon — blur-radius)

#### Scenario: ingen emoji-ikoner
- **WHEN** `src/components/shared/` og `src/app/` gjennomgås
- **THEN** komponentene inneholder ingen emoji-glyfer som visuelle ikoner (kun karakter-glyfer som `▲`, `⚠`, `→`)

### Requirement: Tailwind og shadcn er fullstendig fjernet

Etter E1 SHALL repoet ikke inneholde noen referanser til Tailwind eller shadcn:

- `package.json` SHALL ikke ha `tailwindcss`, `@tailwindcss/postcss`, `shadcn`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `lucide-react`, eller `@base-ui/react` som deps eller devDeps.
- `postcss.config.mjs` SHALL ikke eksistere (med mindre den brukes til noe ikke-Tailwind).
- `components.json` SHALL ikke eksistere.
- `src/components/ui/` SHALL ikke eksistere.
- `src/lib/utils.ts` SHALL ikke eksistere.
- `src/app/globals.css` SHALL ikke inneholde `@import "tailwindcss"`, `@theme inline`, eller andre Tailwind-direktiver.

#### Scenario: ingen Tailwind-deps
- **WHEN** `npm ls tailwindcss shadcn class-variance-authority` kjøres
- **THEN** ingen treff (alle er fjernet)

#### Scenario: ingen Tailwind-konfig
- **WHEN** repo-rot listes
- **THEN** verken `postcss.config.mjs`, `components.json`, eller `tailwind.config.*` eksisterer

#### Scenario: globals.css er Tailwind-fri
- **WHEN** `src/app/globals.css` leses
- **THEN** filen inneholder ikke strengen `tailwindcss` eller `@theme`

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

`UnderConstructionBanner` `.full` SHALL bruke `flex-wrap: wrap` for samme grunn — banneret er en flex-rad med tre elementer (`▲` + lang uppercase tekst + `▲`) som blir ~430px+ wide og sprengte horisontal scroll på viewports under ~310px før denne fixen.

Andre shared-komponenter er allerede fleksible (padding-basert, flex/grid med auto-fit) og krever ingen endring.

#### Scenario: WebringWidget bar wrapper
- **WHEN** `<WebringWidget variant="bar">` rendres på 380px viewport
- **THEN** komponenten forårsaker ikke horisontal scroll; innholdet wrapper til ny linje hvis nødvendig

#### Scenario: UnderConstructionBanner full wrapper
- **WHEN** `<UnderConstructionBanner />` (full variant) rendres på 292px viewport
- **THEN** komponenten forårsaker ikke horisontal scroll; tekst og glyfer wrapper til ny linje

#### Scenario: ingen shared-komponent forårsaker scroll
- **WHEN** `/styleguide` eller `/` rendres på 292px viewport (Chrome DevTools device-emulering)
- **THEN** body har ikke horisontal scroll

