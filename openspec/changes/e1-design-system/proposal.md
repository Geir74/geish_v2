## Why

E0 (`project-init`) ga oss et fungerende fundament med Tailwind v4 + shadcn/ui som plassholder-styling — men det var aldri en del av sluttmålet. Designhandoffen (`design_handoff_geish/`) definerer "Cut & Paste Zine"-systemet: beige zine-papir, sort blekk, ett rødt stempel-aksent, mikset typografi, lette rotasjoner, flat offset-skygge. Det er det visuelle vokabularet alt videre UI bygges av — og det er fundamentalt uforenelig med Tailwind/shadcn-konvensjoner.

Vi bytter ut styling-laget nå, før første ekte feature, slik at hele kodebasen bygges på riktig system fra start. E1 er splittet i to halvdeler: dette mandatet (`e1-design-system`) leverer fundamentet — tokens, fonter, komponentbibliotek, styleguide-rute. Andre halvdel (`e1-forside`) bygger den faktiske forsiden på dette grunnlaget.

## What Changes

- **Fjern Tailwind v4 og shadcn/ui** fra E0: `tailwindcss`, `@tailwindcss/postcss`, `shadcn`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `lucide-react`, `@base-ui/react`, `postcss.config.mjs`, `components.json`, `src/components/ui/`, `src/lib/utils.ts`, og Tailwind-direktivene i `src/app/globals.css`.
- **Kopier `tokens.css` ordrett** fra `design_handoff_geish/references/tokens.css` til `src/styles/tokens.css` (variabelnavn er låst — Geir eier dem). Inneholder farger (oklch), font-variabel-navn, type-skala, spacing, kanter, `.paper`-grain-bakgrunn, `.stamp`-hjelpeklasse, `.torn-bottom`-mask, og `.blink`-animasjon.
- **Erstatt `src/app/globals.css`**: fjern Tailwind-imports, ikke dupliser tokens — ny `globals.css` importerer kun `./styles/tokens.css` (eller via layout) og inneholder kun det som ikke hører hjemme i tokens (f.eks. `html { background: var(--paper); }` for fullbredde-bakgrunn).
- **Last 5 fonter via `next/font/google`** i `src/app/layout.tsx`: Archivo Black, Bungee, Special Elite, JetBrains Mono, Newsreader. Eksponert som `--font-display`, `--font-poster`, `--font-typewriter`, `--font-mono`, `--font-serif` — variabelnavnene matcher `tokens.css` slik at next/font sin verdi vinner over tokens-fallbacken på `<html>`.
- **Port 8 komponenter** fra `references/shared.jsx` til React + TypeScript + CSS Modules under `src/components/shared/`: `VisitorCounter`, `UnderConstructionBanner`, `WebringWidget` (variants bar/card/stamp), `GuestbookSnippet` (style list/cards), `StatusBadge` (live/wip/idea), `Stamp`, `ImagePlaceholder`, `HalftoneBlock`. Erstatt `window.t()`-globals med eksplisitte props (dummy-tekst kommer fra props/defaults, ikke fra en i18n-modul som ikke finnes ennå).
- **Styleguide-rute `/styleguide`** som rendrer alle tokens (paletter, type-skala-prøver, spacing-stige) og hver komponent i sine varianter. Permanent men ulinket fra forsiden.
- **Strip shadcn-`Button` fra `app/page.tsx`** — blir minimal placeholder igjen ("geish v2" + bullet om at `/styleguide` viser systemet). Selve forsiden bygges i `e1-forside`.
- **Strip shadcn-`Button` fra `/smoke`** — beholder import/wired-sjekkene for Drizzle og Supabase, men ingen UI-komponent fra et bibliotek vi ikke har lenger.
- **Global `--chaos: 1`** CSS-variabel på `:root` — rotasjonsmultiplikatoren brukes i komponenter via `rotate(calc(Xdeg * var(--chaos, 1)))` slik at kaos-nivået kan justeres ett sted senere.
- **Rause norske kommentarer** i tokens og komponenter, særlig de subtile valgene (hvorfor `oklch`, hvorfor `--chaos`, hvorfor `prepare: false`-stil "én regel én sted").

## Capabilities

### New Capabilities
- `design-system`: "Cut & Paste Zine"-designfundamentet — tokens (farger, fonter, type-skala, spacing), 5 Google-fonter via next/font, komponentbibliotek (8 shared-komponenter med varianter), styleguide-rute, kollasje-mønstre (photo-tape, flat skygge, stripet placeholder, halftone), forbudsliste (ingen gradients/rounded/blur/emoji-icons/system-font-body), `--chaos`-rotasjons-multiplikator.

### Modified Capabilities
- `project-foundation`: Fjerner shadcn/ui-kravet (REMOVED), tar `src/components/ui/` ut av mappestrukturen, og oppdaterer scenarier for `/` og `/smoke` slik at de ikke lenger forventer en shadcn `<Button>`. DB- og Supabase-wiringen, drizzle-kit-konfig, governance-rule, gitignore-krav og deferred live-verifisering står urørt.

## Impact

- **Avhengigheter (fjernes)**: `tailwindcss`, `@tailwindcss/postcss`, `shadcn`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `lucide-react`, `@base-ui/react`. Lockfile oppdateres.
- **Filsystem (slettes)**: `postcss.config.mjs`, `components.json`, `src/components/ui/`, `src/lib/utils.ts`.
- **Filsystem (nytt)**: `src/styles/tokens.css` (kopi av handoff), `src/styles/globals.css` (eller fortsatt `src/app/globals.css` — uten Tailwind), `src/components/shared/{VisitorCounter,UnderConstructionBanner,WebringWidget,GuestbookSnippet,StatusBadge,Stamp,ImagePlaceholder,HalftoneBlock}/{index.tsx,*.module.css}`, `src/app/styleguide/page.tsx`.
- **Filsystem (modifisert)**: `src/app/layout.tsx` (next/font-imports, font-variabler på `<html>`), `src/app/page.tsx` (placeholder uten shadcn Button), `src/app/smoke/page.tsx` (uten Button), `src/app/globals.css` (uten Tailwind-direktiver), `package.json` + lockfile.
- **Eksterne systemer**: Google Fonts — next/font self-hoster fontene ved build, så ingen runtime-request til google.com (matcher "ingen tracking"-etos).
- **Røres ikke (intakt fra E0)**: `src/db/`, `src/lib/supabase/`, `drizzle.config.ts`, `drizzle/`, `.env.local`-wiringen, `/smoke`-rutens import/instantiation-sjekker, governance-rule-kommentarer.
- **Ut av scope**: forsiden (E1 forside-mandat), undersider (E2/E4), `content.js` i18n-modul, auth, MDX, webring-/gjestebok-backend, full mobil-responsivitet utover beste skjønn.
