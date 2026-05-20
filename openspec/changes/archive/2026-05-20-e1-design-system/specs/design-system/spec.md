## ADDED Requirements

### Requirement: tokens.css kopieres ordrett fra handoffen

`src/styles/tokens.css` SHALL være en ordrett kopi av `design_handoff_geish/references/tokens.css`. Variabelnavn, kommentarer og verdier MUST være identiske, slik at Geir kan redigere én fil og se endringen på tvers. Filen MUST inneholde:

- Papir/blekk-paletten: `--paper`, `--paper-warm`, `--paper-edge`, `--paper-dark`, `--ink`, `--ink-soft`, `--ink-fade` (alle i `oklch()`).
- Aksent-paletten: `--stamp`, `--stamp-fade`, `--highlight`.
- Font-rolle-variabler: `--font-display`, `--font-poster`, `--font-typewriter`, `--font-mono`, `--font-serif` med fallback-stacker.
- Type-skala: `--t-meta` til `--t-mega`.
- Spacing: `--sp-1` til `--sp-16`.
- Border-shorthands: `--border`, `--border-soft`, `--border-dashed`.
- Hjelpeklasser: `.paper` (grain-bakgrunn), `.stamp`, `.torn-bottom`, `.blink`.
- Globale resets: box-sizing, body-margin, button/a-defaults.

#### Scenario: tokens.css matcher handoff-kilden
- **WHEN** `diff design_handoff_geish/references/tokens.css src/styles/tokens.css` kjøres
- **THEN** kun whitespace/line-ending-forskjeller forekommer (ingen variabel- eller verdi-endringer)

#### Scenario: tokens.css importeres globalt
- **WHEN** dev-server kjører og en hvilken som helst side rendres
- **THEN** alle `--paper`, `--ink`, `--font-*`, `--sp-*` og `--t-*` variabler er tilgjengelige via `getComputedStyle(document.documentElement)` i nettleser

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
8. **`HalftoneBlock`** — props: `w?: number`, `h?: number`, `density?: number` (0..1). SVG-prikkmønster som dekor.

Alle komponenter MUST:
- Eksportere et navngitt TypeScript-interface for props.
- Bruke CSS Modules for all styling (ingen inline `style`-attributt utenom å sette CSS-variabler som `--rotation`).
- Bruke `var(--chaos, 1)` for rotasjons-multiplikatorer.
- Følge forbudslisten i `01-DESIGN-SYSTEM.md` §8: ingen gradient-bakgrunner, rounded corners, blur-skygger, emoji som ikoner, sans-serif system-font for brødtekst.

En barrel-eksport `src/components/shared/index.ts` MUST re-eksportere alle 8 komponenter.

#### Scenario: alle 8 komponenter eksisterer
- **WHEN** `ls src/components/shared/` kjøres
- **THEN** mappene `VisitorCounter`, `UnderConstructionBanner`, `WebringWidget`, `GuestbookSnippet`, `StatusBadge`, `Stamp`, `ImagePlaceholder`, `HalftoneBlock` finnes, hver med en `index.tsx` og en `*.module.css`

#### Scenario: barrel-eksport fungerer
- **WHEN** en fil importerer `import { Stamp, StatusBadge } from "@/components/shared"`
- **THEN** TypeScript kompilerer uten feil og begge komponenter er tilgjengelige

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
