## Context

E0 etterlot et fungerende Next.js 16 + Drizzle + Supabase-fundament med Tailwind v4 + shadcn/ui som engangs-stylinglag. Designhandoffen (`C:\Users\geirh\OneDrive\GRIM\03 Projects\geish 2.0\design_handoff_geish\`) er autoritativ: `01-DESIGN-SYSTEM.md` definerer tokens og prinsipper, `tokens.css` er produksjonsklar (kopieres ordrett), og `references/shared.jsx` er designreferanser som skal *oversettes* til React + CSS Modules — ikke kopieres rått.

**Hardkodede premisser fra mandatet:**
- Ingen Tailwind, ingen CSS-i-JS. CSS-variabler + CSS Modules per komponent. Punktum.
- `tokens.css` variabelnavn er låst (Geir eier dem).
- Forbudsliste §8 i `01-DESIGN-SYSTEM.md`: ingen gradient-bakgrunner, rounded corners (utenfor browser-defaults), blur-skygger, emoji som ikoner, eller sans-serif system-font for brødtekst.
- Behold E0-stack: `src/`, `@/`-alias, npm, Supabase, Drizzle. Avvik bevisst fra handoffens `03-IMPLEMENTATION.md` (pnpm, Vercel Postgres, NextAuth).
- Rause norske kommentarer i tokens og komponenter.

**Stakeholders:** Geir er solo-dev, ikke utvikler av yrke. Lesbarhet og forklarende kommentarer veier tyngre enn "smart" kode.

## Goals / Non-Goals

**Goals:**
- Fjerne Tailwind/shadcn fullstendig — ingen rester i deps, konfig, eller importer.
- Etablere en enkel, gjenkjennelig mappestruktur (`src/styles/`, `src/components/shared/`) som matcher Drizzle + Supabase best practice for 2026 og er åpenbar for framtidig kode.
- Få fontene riktig: 5 stk via `next/font/google`, self-hosted, eksponert som CSS-variabler som matcher tokens.
- Porte 8 komponenter til React + CSS Modules med samme visuelle resultat som mockup-en, men typesikker, typescript-vennlig, og uten `window.t()`-globals.
- Gi en visuell review-flate (`/styleguide`) som dekker alt — så det går an å verifisere at fundamentet stemmer før forsiden bygges.
- Bevare alt E0 leverte: DB, Supabase, smoke, governance, drizzle-kit.

**Non-Goals:**
- Forsiden (kommer i `e1-forside`).
- Undersider (manifest, Stua, blogg).
- Innhold/i18n: styleguiden bruker hardkodet dummy-tekst, ikke en `content.js`/typed module.
- Backend for webring eller gjestebok — komponentene rendres med dummy-props.
- Full responsivitet: handoffen er 1280px desktop-only. Vi bruker beste skjønn, ikke et fullt breakpoint-system.
- Mørk modus, theme-bytting, eller animasjoner utover `.blink` i UC-banner.
- Erstatte governance-kommentarer eller annen E0-prosa.

## Decisions

### D1. Mappestruktur

**Valg:**
```
src/
  styles/
    tokens.css          // kopi av handoff, variabelnavn låst
  app/
    globals.css         // små globale resets/bakgrunn — tokens importeres her
    layout.tsx          // next/font på <html>, lenker globals.css
    page.tsx            // minimal placeholder
    smoke/page.tsx      // beholder import/wired-sjekkene, dropper Button
    styleguide/page.tsx // ny review-flate
  components/
    shared/
      VisitorCounter/{index.tsx, VisitorCounter.module.css}
      UnderConstructionBanner/{index.tsx, UnderConstructionBanner.module.css}
      WebringWidget/{index.tsx, WebringWidget.module.css}
      GuestbookSnippet/{index.tsx, GuestbookSnippet.module.css}
      StatusBadge/{index.tsx, StatusBadge.module.css}
      Stamp/{index.tsx, Stamp.module.css}
      ImagePlaceholder/{index.tsx, ImagePlaceholder.module.css}
      HalftoneBlock/{index.tsx, HalftoneBlock.module.css}
      index.ts          // barrel-eksport: re-eksporterer alle 8
```

**Hvorfor:** Én mappe per komponent (folder-as-component) holder presentasjon og styling samlet — du finner alt om `Stamp` på ett sted. CSS Modules per komponent gir scoped klassenavn uten å havne i CSS-i-JS-land. Én `index.tsx` per komponent gjør imports korte: `import { Stamp } from "@/components/shared/Stamp"`. Barrel-fila (`src/components/shared/index.ts`) gir et ekstra alias: `import { Stamp, StatusBadge } from "@/components/shared"` — nyttig i styleguiden og forsiden senere.

**Alternativer vurdert:**
- Flat `src/components/shared/Stamp.tsx` + `Stamp.module.css`: Skalerer dårligere når komponenter får sub-filer (assets, hooks). Avvist.
- `src/lib/ui/` (matcher shadcn-konvensjonen): Vil forvirre — vi har akkurat fjernet shadcn. Avvist.

### D2. Tokens-laget: én fil, ordrett kopi

**Valg:** `src/styles/tokens.css` er en ordrett kopi av `design_handoff_geish/references/tokens.css`. Ingen omstrukturering, ingen omdøping. Filen importeres øverst i `src/app/globals.css` med `@import "../styles/tokens.css";` slik at den havner i den globale kaskaden uten å være på `import`-vei via TS.

**Hvorfor:** Mandatets eksplisitte regel ("kopieres ordrett — variabelnavn endres ikke"). Geir eier denne fila og kommer til å redigere den direkte. Hvis vi splitter den eller renamer variabler, må Geir oppdatere to steder hver gang. CSS-`@import` istedenfor TS-import betyr at PostCSS/Turbopack håndterer det som en stylesheet, ikke en modul.

**Alternativer vurdert:**
- Importere `tokens.css` i `layout.tsx` direkte: Funker, men gjør `globals.css` til "stedet hvor styling starter" mens tokens skjules. Vi vil at `tokens.css` er den synlige inngangen — `globals.css` skal være tynn.
- Splitte tokens i `colors.css`, `type.css`, `space.css`: Bryter mandatet. Avvist.

### D3. Font-strategi: `next/font/google` med variabel-navn som matcher tokens

**Valg:** `src/app/layout.tsx` importerer alle 5 fontene fra `next/font/google` med `variable`-opsjonen satt til navnet i `tokens.css`:

```tsx
import { Archivo_Black, Bungee, Special_Elite, JetBrains_Mono, Newsreader } from "next/font/google";

const display = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const poster = Bungee({ subsets: ["latin"], weight: "400", variable: "--font-poster" });
const typewriter = Special_Elite({ subsets: ["latin"], weight: "400", variable: "--font-typewriter" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400","500","700"], variable: "--font-mono" });
const serif = Newsreader({ subsets: ["latin"], weight: ["400","600"], style: ["normal","italic"], variable: "--font-serif" });
```

Disse legges som className på `<html>`: `className={`${display.variable} ${poster.variable} ${typewriter.variable} ${mono.variable} ${serif.variable}`}`. next/font setter da `--font-display` på `<html>` til en CSS-string typ `__Archivo_Black_xxx, __Archivo_Black_Fallback_xxx` — som overstyrer `tokens.css`-fallbacken (`'Archivo Black', Impact, sans-serif`) i kaskaden.

**Hvorfor:** Self-hosted (build-time download), ingen runtime-request til Google = matcher "ingen tracking"-etos. Variabel-navnene matcher tokens, så komponenter som bruker `var(--font-display)` får riktig font automatisk. Vi mister tokens-fallbacken (Impact, Courier New osv.), men next/font har egen fallback-metrikk-matching som gir bedre CLS uansett.

**Alternativer vurdert:**
- `<link>` mot Google Fonts CDN i `<head>`: Bryter "ingen tracking"-etos, gir runtime-request til Google.
- Mappe next/font-variabler til *andre* navn (f.eks. `--font-display-loaded`) og referere fra tokens: Mer indirekte, og bryter mandatets "variabelnavn endres ikke" (tokens.css ville da måtte endres). Avvist.

**Verifisert:** Alle 5 fonter finnes i `next/font/google` per Google Fonts-katalogen (jeg sjekker dette i task 2). `Special_Elite` kjøres uten vekt-array (kun 400 finnes).

### D4. Komponent-port: React + TypeScript + CSS Modules

**Valg:** Hver komponent får et `props`-interface i `index.tsx` (eksplisitte typer, ingen `any`), en `*.module.css` som inneholder all styling fra mockup-en omsatt til CSS-klasser, og null inline-stiler i den faktiske JSX-en. Inline-stiler erstattes med klassenavn fra modulen.

For dynamiske verdier som rotasjon/størrelse:
- Hvis en *prop* styrer noe pixel-aktig (f.eks. `rotate={4}` på `<Stamp>`), settes verdien via inline `style={{ "--rotation": `${rotate}deg` } as React.CSSProperties}` og CSS-modulen bruker `transform: rotate(var(--rotation, -4deg))`.
- Variantbasert styling (f.eks. `WebringWidget variant="card"`) styres via et `data-variant`-attributt og selektorer i CSS-modulen (`[data-variant="card"]`).

`window.t()`-kallene fra `shared.jsx` erstattes med eksplisitte props med fornuftige defaults:
- `WebringWidget` får `prevLabel`, `nextLabel`, `title`, `subtitle`, `members`, `joinLabel` — alle med Geir-aktige norske defaults (`"← FORRIGE"`, `"NESTE →"`, `"NORDIC RING"`, `"smågjenger som lager noe rart sammen"`).
- `GuestbookSnippet` får `items: Array<{ who: string; when: string; msg: string }>` — defaulter til 3 dummy-innlegg.
- `UnderConstructionBanner` får `text` med default `"UNDER KONSTRUKSJON — KOMMER SNART"`.

**Hvorfor:** TypeScript + CSS Modules er low-magic, godt støttet av Next.js 16, og matcher "lesbar struktur fremfor smart kode". CSS-variabler for dynamiske verdier holder modulen statisk (ingen runtime-genererte stiler), som gir bedre devtools-erfaring og raskere builds. Eksplisitte props gjør komponentene gjenbrukbare uten en globale i18n-modul som ikke finnes ennå.

**Alternativer vurdert:**
- Beholde inline-stilene fra `shared.jsx`: Bryter mandatet ("CSS-variabler + CSS Modules per komponent. Punktum."). Avvist.
- Tailwind: Bryter mandatet. Avvist.
- styled-components / vanilla-extract / panda: CSS-i-JS, bryter mandatet. Avvist.
- En enkelt `shared.module.css` for alle 8 komponenter: Skalerer dårlig, gjør refaktorering risikabelt. Avvist.

### D5. `--chaos`-multiplikatoren

**Valg:** Settes som global CSS-variabel på `:root` i `globals.css` (etter `@import tokens.css`) med default `1`. Komponentene bruker den i `transform`-uttrykk: `transform: rotate(calc(var(--rotation, -4deg) * var(--chaos, 1)))`.

**Hvorfor:** Mandat-eksplisitt. Holder kaos-nivået justerbart ett sted senere (tweaks-panel kommer i et eget mandat). Hvis vi setter `--chaos: 0` blir alt rett — nyttig for skjermbilder eller hvis Geir vil dempe.

### D6. Styleguide-rute: permanent, ulinket, exhaustive

**Valg:** `src/app/styleguide/page.tsx` er en server component som rendrer:
1. **Tokens-seksjon**: paletter (paper-svømmer, ink-svømmer, stamp-svømmer, status-farger) med oklch-verdier og brukshenvisning; type-skala-prøver (en `<p>` i hver type-rolle med hver størrelse); spacing-stige (ruler-aktig visualisering med `--sp-1` til `--sp-16`).
2. **Komponent-seksjon**: hver av de 8 komponentene rendret i sine varianter, med en `<h2>` over hver, en kort beskrivelse, og en boks som viser komponenten på et `.paper`-bakteppe.
3. **Mønstre-seksjon**: photo-tape, flat skygge, stripet placeholder-bakgrunn, marker-highlight — én demo-boks per mønster.

Permanent (ikke dev-only), men ulinket fra forsiden. Du må vite om `/styleguide` for å finne den.

**Hvorfor:** Mandatet krever én verifiserbar review-flate. En permanent rute er enklere enn `process.env.NODE_ENV`-guards og blir også referanseflate når Geir bygger nye komponenter senere ("hvordan så `<Stamp>` ut igjen?"). Ulinket fra forsiden = ingen public discovery, men kan deles direkte (`/styleguide`) når kollega skal review.

**Alternativer vurdert:**
- Dev-only via `NODE_ENV`: Vanskeligere å vise frem, og legg-godt-til-rette-svekkelse.
- Storybook: Tung infra for 8 komponenter, ekstra build-pipeline. Avvist.
- En seksjon i `/smoke`: blander helsesjekk med design-katalog. Avvist.

### D7. `globals.css`-strategien

**Valg:** `src/app/globals.css` blir tynn (~15 linjer):

```css
@import "../styles/tokens.css";

:root {
  --chaos: 1;
}

html {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-typewriter);
  font-size: var(--t-body);
  line-height: 1.5;
}

body {
  min-height: 100vh;
}
```

Ingen Tailwind, ingen `@theme inline`, ingen ekstra resets (de er allerede i `tokens.css`).

**Hvorfor:** Holder tokens som "stedet hvor design begynner" og `globals.css` som "stedet hvor vi binder tokens til side-bakgrunn og default-tekststil". Hver komponent håndterer sin egen styling via CSS Modules — globals skal ikke bli en kjede.

### D8. Hva som skjer med `src/lib/utils.ts`

**Valg:** Slettes. Den eneste eksporten er shadcn-`cn`-helperen (`clsx` + `tailwind-merge`), som ingen bruker når Tailwind er borte.

**Hvorfor:** Død kode etter Tailwind-fjerning. Vi får ingen ny tilsvarende — CSS Modules genererer klassenavn deterministisk, og hvis vi senere trenger å kombinere klasser, brukes vanlig template-string eller en `classnames`-alternativ uten tailwind-merge.

## Risks / Trade-offs

- **[Risk] Tailwind-fjerning bryter shadcn `Button`-importer som ligger i `app/page.tsx` og `/smoke`** → Mitigation: Begge filer endres i samme PR. Type-sjekk (`npx tsc --noEmit`) og lokal `npm run dev` fanger glemte importer.
- **[Risk] next/font/google catalog-mismatch — en av fontene finnes ikke som forventet** → Mitigation: Verifiseres i task 2.1 før komponentporten begynner. Hvis en font mangler, fall tilbake til `next/font/local` med .woff2-filer fra Google Fonts archive.
- **[Risk] `font-family: var(--font-display)` virker ikke når next/font setter variabler på `<html>` mens tokens.css setter dem på `:root`** → Mitigation: `:root` === `<html>` i HTML-dokumenter, så samme target. Verifiseres ved at styleguide-prøvene faktisk rendres i riktig font.
- **[Risk] CSS Modules-konvertering kan miste subtile detaljer fra inline-stilene (z-index, opacity, filter blur på Stamp)** → Mitigation: Hver komponent har en visuell sjekk på styleguiden mot screenshot fra handoffen. Avvik dokumenteres i kommentar.
- **[Risk] Stamp har `filter: 'contrast(0.92) blur(0.2px)'` — blur er på forbudslisten** → Mitigation: 0.2px blur er ikke en drop-shadow blur (som er forbudt), det er en mikro-uskarphet for å gjøre stempel-glyfen "trykt"-aktig. Beholder dette med kommentar som forklarer at det er en mikroteknikk for autentisitet, ikke en effekt-blur.
- **[Risk] `--chaos` multiplikator på `calc()` med `deg`-enheter krever at rotasjonsverdien er en faktor (en `<number>`), ikke en angle, før multiplikasjon** → Mitigation: Bruk `transform: rotate(calc(var(--rotation, -4) * 1deg * var(--chaos, 1)))` — `--rotation` lagres som tall, ikke vinkel.
- **[Risk] `.module.css`-filer kan ikke bruke `:root`-selektorer for å eksponere variabler globalt** → Mitigation: Komponent-spesifikke CSS-variabler scopes til komponentens rotselector. Globale variabler (`--chaos`, alle tokens) ligger i `globals.css`/`tokens.css`.
- **[Risk] Tweaks-panel-funksjonalitet (bytt aksent eller font-pairing) finnes i mockup-en men ikke i mandatet** → Mitigation: Eksplisitt non-goal. Default-rod og default-Archivo-Black+Special-Elite-pairing er det vi leverer.

## Migration Plan

Brownfield mot E0. Roll-back er `git revert` av implementeringscommit — DB- og Supabase-laget er urørt, så ingen data å håndtere. Sekvens:

1. Fjern Tailwind/shadcn-deps og filer i samme commit som tokens.css legges inn — kortvarig broken build inntil layout.tsx oppdateres.
2. Oppdater `layout.tsx` med next/font, `globals.css` med `@import tokens.css`, og `page.tsx`/`smoke/page.tsx` uten Button — alt i samme commit.
3. Port komponenter en for en, hver med en seksjon på styleguide-siden — flere commits.
4. Final pass: type-sjekk, lokal dev-server, visuell sjekk mot screenshots.

## Open Questions

- **`<a href="#ring">🔗 ring</a>` og `🔗` i `WebringWidget`** — emoji som ikon, bryter forbudslisten. Forslag: erstatt med tekst-glyf (`⌬` eller `◉`) eller bare droppe det. Sjekker med Geir under apply.
- **Styleguide-seksjon for "Mønstre"** (photo-tape, flat skygge, etc.) — disse er ikke komponenter, men teknikker. Skal vi vise dem i styleguiden eller bare dokumentere dem i en kommentar i tokens.css? Forslag: vis dem på styleguiden så de er gjenkjennelige.
- **`globals.css` lokasjon**: under `src/app/globals.css` (Next-konvensjon) eller `src/styles/globals.css` (tematisk samlet med tokens). Forslag: behold `src/app/globals.css` — Next-konvensjon, og layout.tsx forventer den der.
