## Context

`e1-design-system` er levert og arkivert. Repoet har nå tokens (`src/styles/tokens.css`), 8 shared-komponenter (`src/components/shared/`), 5 fonter, og en /styleguide-rute. `src/app/page.tsx` er en minimal placeholder som denne mandaten eier og bygger ut.

**Autoritative kilder:**
- `02-PAGES.md` Side 1 — seksjonstabell (grid-plassering, datakilder, interaksjoner, tilstander) og designnotater (megabox-halftone som stikker ut, photo-tape, dark trio-kolonne sist).
- `references/forside.jsx` — designreferanse for hver seksjon. Inline-stiler oversettes til CSS Modules, ikke kopieres rått.
- `references/content.js` — seed-copy. Porteres til `src/content/locales/no.ts` ordrett (slice for slice), typer legges på i `i18n.ts`.
- `screenshots/01-forside.png` — visuell fasit for review.
- `03-IMPLEMENTATION.md` §4 — `t()`-mønster (det vi følger).

**Forutsetninger:**
- Ingen Tailwind, ingen shadcn, ingen CSS-i-JS. CSS-variabler + CSS Modules.
- `--chaos`-rotasjonsmultiplikator brukes på alle roterte elementer.
- Forbudslisten i `01-DESIGN-SYSTEM.md` §8 gjelder.
- Norsk tone i alle kommentarer.

## Goals / Non-Goals

**Goals:**
- Forsiden matcher `screenshots/01-forside.png` visuelt og 02-PAGES Side 1 strukturelt.
- All copy hentes fra `t()` — en endring i `src/content/locales/no.ts` reflekteres umiddelbart på forsiden.
- Hver seksjon er en isolert komponent med eksplisitt props-interface, slik at undersider (manifest/stua/blogg) senere kan gjenbruke deler eller portere mønsteret.
- Tom-tilstand-logikk er konsekvent: seksjon returnerer `null` ved manglende data; `BlogStrip` har spesiell UC-fallback.
- Typed `t()` — TypeScript fanger en typo i feltnavn på compile time, ikke i runtime.

**Non-Goals:**
- Forsiden er ikke responsiv utover beste skjønn. 1280px desktop er primær (handoff-premiss).
- Ingen sticky topp-nav. Globalt nav er strødd inn i seksjoner.
- Ingen live data — alt er seed/statisk.
- Ingen ny capability for content (`content`/`i18n`-kapasiteten kommer i en egen senere mandat hvis det blir behov).

## Decisions

### D1. Content-modul: typed `t()`, ett locale per fil

**Valg:**
```
src/content/
  i18n.ts             // eksporterer t, locales, defaultLocale, Locale-typen
  locales/
    no.ts             // hele NO-objektet, eksportert som `no` med `as const`
```

`i18n.ts`:
```ts
import { no } from "./locales/no";

export const locales = { no } as const;
export type Locale = keyof typeof locales;
export const defaultLocale: Locale = "no";

export type Dictionary = typeof no;

export function t(locale: Locale = defaultLocale): Dictionary {
  return locales[locale];
}
```

`locales/no.ts` porteres slice-for-slice fra `references/content.js`. `as const` på objektet gir oss litterale typer (`status: "live"` ikke `status: string`) — viktig for `StatusBadge`-mappingen.

**Hvorfor:** Matcher `03-IMPLEMENTATION.md` §4 nøyaktig. Typed dictionary gir TS-autocomplete og fanger typos på compile time. Én fil per locale gjør det trivielt å legge til engelsk senere uten å redigere `i18n.ts`. Vi unngår en "ny capability for content"-spec-runde nå — modulen er bare et innholdslag, ikke et arkitektur-mønster.

**Alternativer vurdert:**
- `next-intl` eller `i18next`: Overkill for én locale med statisk innhold. Kan bytte til dette senere uten å endre forside-koden hvis vi holder `t()`-mønsteret stabilt.
- JSON-filer: Mister TypeScript-typer. Avvist.
- `t("brand.name")` med dotted keys: Tap av autocomplete + risiko for runtime-feil ved typo. Avvist til fordel for `t().brand.name`-mønster.

### D2. Forside-mappestruktur og barrel

**Valg:**
```
src/components/forside/
  Megabox/{index.tsx, Megabox.module.css}
  CornerStamp/{index.tsx, CornerStamp.module.css}
  IntroNote/{index.tsx, IntroNote.module.css}
  ManifestCut/{index.tsx, ManifestCut.module.css}
  StuaPreview/{index.tsx, StuaPreview.module.css}
  GuestbookGrid/{index.tsx, GuestbookGrid.module.css}
  ProjectsRow/{index.tsx, ProjectsRow.module.css}
  PullquoteBand/{index.tsx, PullquoteBand.module.css}
  AboutRow/{index.tsx, AboutRow.module.css}
  Trio/{index.tsx, Trio.module.css}
  BlogStrip/{index.tsx, BlogStrip.module.css}
  FooterRow/{index.tsx, FooterRow.module.css}
  index.ts            // barrel
```

Samme folder-as-component-mønster som `src/components/shared/`. Barrel-fila lar forside-page importere `import { Megabox, CornerStamp, ... } from "@/components/forside"`.

**Hvorfor:** Konsistent med shared-strukturen. Holder hver seksjon isolert med sin egen styling. Forenkler senere uttrekk (hvis en seksjon skal gjenbrukes på en underside).

### D3. Grid-layout i `page.module.css`, ikke i seksjons-modulene

**Valg:** Den 12-kolonners grid-containeren og hver seksjons `grid-column`/`grid-row`-plassering lever i `src/app/page.module.css`. Seksjonskomponentene vet *ikke* hvor de plasseres — de er bare et bokssett med interne stiler.

**Hvorfor:** "Hvor en seksjon ligger på forsiden" er en layout-bekymring som hører til forsiden, ikke til seksjonen. Det gjør seksjonene gjenbrukbare (samme `Megabox` kan plasseres annerledes på en undertypeside hvis nødvendig). Det matcher også hvordan forside.jsx organiserer det — gridet er definert på `.v3 .grid`, og seksjonene har hver sin `.megabox`/`.corner-stamp`/etc.-regel som setter `grid-column`/`grid-row`.

Implementering: hver seksjon får en stabil CSS-klasse via en wrapper-`<section>` i `page.tsx`, og `page.module.css` bruker child-selektorer:
```css
.grid > .megabox { grid-column: 1 / span 8; grid-row: span 4; }
.grid > .cornerStamp { grid-column: 9 / span 4; grid-row: 1 / span 2; }
...
```

Alternativ: bruk inline `style={{ gridColumn: "1 / span 8" }}` på hver wrapper. Begge funker; CSS Module-varianten er mer testbar og lettere å variere via media queries senere. Velger CSS Module.

**Alternativer vurdert:**
- Hver seksjon vet sin grid-posisjon i sin egen modul: Bryter gjenbruk. Avvist.
- Inline style for grid-posisjon: Funker men sprer layout-data. Avvist.

### D4. CornerStamp og IntroNote — løs overlapp-bug fra mockup

**Valg:** I 02-PAGES sier tabellen at CornerStamp er `9 / span 4` med 2 rader og IntroNote er `9 / span 4` med 2 rader — naturlig sekvensiell, totalt 4 rader. forside.jsx har dem på `row 1 / span 2` og `row 2 / span 2` — de overlapper på rad 2. Det er sannsynligvis en mockup-bug.

Vi bruker sekvensielt: CornerStamp på `grid-row: 1 / span 2`, IntroNote på `grid-row: 3 / span 2`. Sammen fyller de fire rader til høyre for Megabox, parallelt med Megaboxens 4 rader.

**Hvorfor:** Matcher screenshot bedre (de står stablet, ikke overlappende). Matcher 02-PAGES-tabellen som er den autoritative kilden. Unngår z-index-magic for å gjette hvilken som skal være på toppen.

### D5. Megabox: hero-tekst splittes uten "AND"

**Valg:** Megabox-h1 viser "STAY GROUNDED, CREATE SHIT." over tre linjer med "CREATE" i aksentfarge (`oklch(72% 0.18 55)`, den oransje LED-fargen fra mockup), per forside.jsx. `content.no.hero.credo` har strengen "STAY GROUNDED, AND CREATE SHIT" — vi dropper "AND" i display-versjonen fordi mockup-en er den autoritative visuelle kilden. `credo` brukes der hvor full streng er ønsket (alt-tekst, meta-tagger senere); for hero rendrer vi hardkodet linjebrudd-struktur.

For å unngå tvetydighet i content-modulet, legger vi til en `hero.credo_lines` med eksplisitt struktur:
```ts
hero: {
  credo: "STAY GROUNDED, AND CREATE SHIT",
  credo_lines: { l1: "STAY", l2: "GROUNDED,", l3a: "CREATE", l3b: "SHIT." },
  // ...
}
```
Megabox bruker `credo_lines`. Det bevarer copy-på-ett-sted-prinsippet og lar Geir endre hero uten å redigere komponenter.

**Hvorfor:** Mockup-en er pixel-tett autoritativ for visuell stil. Full credo brytes på tre linjer med "CREATE" i aksentfarge — det er en designtypografisk komposisjon, ikke en automatisk word-wrap. Eksplisitt struktur i content er tryggere enn å gjette splitting i komponenten.

**Alternativer vurdert:**
- Hardkode strengene i `Megabox/index.tsx`: Bryter "all copy fra content"-prinsippet. Avvist.
- Bruke `credo` med en `<br>`-parser eller `\n`-split i komponenten: Skjør og uleselig. Avvist.

### D6. Photo-placeholders i AboutRow: flytt labels til content

**Valg:** `references/forside.jsx` hardkoder `[PORTRETT]`, `[HUND.JPG]`, `[VERKSTED]`, `[BRØD N° 47]` som photo-labels. Vi flytter dem til `content.no.about.photos`:
```ts
about: {
  // ... eksisterende felt
  photos: [
    { label: "PORTRETT" },
    { label: "HUND.JPG" },
    { label: "VERKSTED" },
    { label: "BRØD N° 47" },
  ],
}
```
AboutRow itererer over `about.photos` og rendrer en `<ImagePlaceholder>` per element, med tape og rotasjon fra hardkodet liste i komponenten (siden posisjonering er layout-bekymring per D3). Rotasjons-tabellen i AboutRow:
```ts
const PHOTO_LAYOUT = [
  { top: 4,   left: 0,    width: 180, height: 220, rotate: -3.5 },
  { top: 20,  right: 8,   width: 200, height: 140, rotate:  2.2 },
  { bottom: 8, left: 60,  width: 160, height: 110, rotate:  1.5 },
  { bottom: 0, right: 32, width: 130, height: 130, rotate: -2.0 },
];
```
Antall photos må matche tabellen — første N rendres. Hvis Geir legger til en 5. photo i content, faller den ut til den får en posisjon i `PHOTO_LAYOUT`. Vi logger en advarsel i dev hvis lengdene mismatcher.

**Hvorfor:** Content-modul-prinsippet skal være konsekvent — Geir endrer photo-labels uten å åpne kodefiler. Posisjon er designvalg som hører til komponenten.

### D7. StuaPreview-rotasjon og tape

**Valg:** Hele StuaPreview-boksen roteres `-0.8deg * var(--chaos)` per 02-PAGES. På toppen ligger en photo-tape sentrert i `translateX(-50%) rotate(-2deg)`. Indre struktur:
- Tittel "Stua → akkurat nå" i `--font-poster` (Bungee).
- Gul "Ukens spørsmål"-kort (`var(--highlight)` med opacity 0.6).
- 4 tråder (`stua.threads.slice(0, 4)`) med `›`-glyf, tittel, og meta-linje (who · X svar · last).
- Lenke "→ Logg inn" i mono.

Tape-strengen i mockup bruker semitransparent gul (`oklch(94% 0.08 80 / 0.7)`) med subtil border. Definert som lokal `.tape`-klasse i StuaPreview.module.css (gjenbrukbar fra ManifestCut også — eller vi lager en delt photo-tape-CSS-helper i tokens? — droppes for nå, hver seksjon eier sin tape).

**Hvorfor:** Photo-tape er et designmønster, ikke en komponent (per `e1-design-system`-design D6's "mønstre-seksjon i styleguide"). Definert som CSS-snippet per seksjon for nå; hvis vi får 4+ tape-seksjoner kan vi refaktorere til en helper senere.

### D8. ProjectsRow: 5 cards med vekslende rotasjon

**Valg:** ProjectsRow-boksen har `box-shadow: 5px 5px 0 var(--ink)` og inneholder 5 prosjekt-cards i 5-kolonners indre grid (`grid-template-columns: repeat(5, 1fr)`, gap 10px). Hver card roteres `±0.6deg * var(--chaos)` vekslende (odd negativ, even positiv). Cards bruker `<StatusBadge>` fra shared.

`content.no.projects` har 5 prosjekter, alle vil rendres. Hvis content har færre, rendres bare det som finnes. Hvis flere, rendres bare første 5.

**Hvorfor:** Rotation-vekslingen er en mockup-detalj som er pent skalert med `--chaos`. 5-grid er hardkodet siden mockup-en er pixel-tett.

### D9. PullquoteBand: full-bredde gul stripe med halftone-dekor i hjørner

**Valg:** PullquoteBand strekker `grid-column: 1 / span 12`, `grid-row: span 2`. Bakgrunn `oklch(86% 0.16 95 / 0.55)` (highlight med opacity 0.55). 3px solid border top/bottom (ink). Stort sitat i `--font-display` 42px med custom quotes (`«»`). Citat-attribusjon i mono 11px uppercase under.

To `<HalftoneBlock>`-instanser plassert absolute i hjørnene (left/top: -10px, right/bottom: -20px) med opacity 0.5 — stikker bevisst litt ut av kanten (forside.jsx-detalj). `overflow: hidden` på band-en holder dem innenfor.

**Hvorfor:** Mockup-detalj. Halftone-blokken er allerede en shared-komponent — vi bruker den.

### D10. Trio: TIL / Lab / Endringslogg med mørk endringslogg-kolonne sist

**Valg:** 3-kolonners grid (`repeating-1fr`). Hver kolonne er sin egen sub-komponent i Trio-modulen (TilColumn, LabColumn, ChangelogColumn) — eller én Trio-komponent med tre seksjoner og data-variant-attributter for fargen. Velger sistnevnte for enkelthet:
- Trio rendrer tre kolonner basert på en datakilde-prop.
- Hver kolonne er en `<section>` med `data-variant="warm" | "default" | "dark"`.
- CSS Module har regler per variant: bakgrunn, tekstfarge, border-color på rader.

ChangelogColumn er `dark` (cream tekst på ink-bakgrunn), TIL er `warm` (paper-warm), Lab er default (`paper`). Mørke kolonne sist gir visuell vekt før footer per 02-PAGES designnote.

**Hvorfor:** Tre kolonner med veldig like strukturer (kicker + rader + "more"-lenke) — én komponent med varianter er enklere enn tre separate. Variant-CSS er en kjent zine-pattern.

### D11. BlogStrip: sort boks med 3 hvite "klippede" artikler

**Valg:** `grid-column: 1 / span 12; grid-row: span 3`. Bakgrunn `var(--ink)`, tekst `var(--paper)`. Header med "Fra bloggen" (Bungee 32px) + sub i mono. 3 artikler i 3-kolonners grid; hver artikkel er en boks med papir-bakgrunn og dato/tittel/meta. "ALLE POSTER"-lenke høyrejustert.

**Tom-tilstand:** Hvis `t().blog_posts.length === 0`, rendrer BlogStrip en `<UnderConstructionBanner />` i stedet for grid-en. Tittel og "ALLE POSTER" forblir.

**Hvorfor:** Mockup-bilde, men også 02-PAGES "Tom forside" explicit-regel ("Vis et stort UNDER CONSTRUCTION-banner i stedet for blogg-stripa").

### D12. FooterRow + copyright-linje

**Valg:** FooterRow er `grid-column: 1 / span 12`, 3-kolonners inner grid (`auto 1fr auto`): VisitorCounter (venstre, size sm) / WebringWidget variant card (sentrert) / UnderConstructionBanner (høyre). Padding-top 8px, justify-items-center middle.

Copyright-linja er ikke en seksjonskomponent — den ligger inline i `page.tsx` etter FooterRow som et `<div>` med `grid-column: 1 / span 12`, sentrert mono tekst i `var(--ink-fade)`. Innhold: `{C.meta.copyright} · {C.meta.server} · best viewed in any browser`.

**Hvorfor:** Copyright-linja har ingen logikk å snakke om — den er en ren tekstlinje. Å lage en `Copyright`-komponent for det er over-engineering. Inline i `page.tsx` matcher hvordan forside.jsx gjør det.

### D13. Tom-tilstand: hver seksjon returnerer null ved manglende data

**Valg:** Hver seksjonskomponent sjekker sin primære datakilde og returnerer `null` hvis manglende:
- `ManifestCut`: hvis `t().manifest_pullquotes.length === 0` → `null`.
- `StuaPreview`: hvis `t().stua.threads.length === 0 && !t().stua.week_question` → `null`.
- `GuestbookGrid`: hvis `t().guestbook.length === 0` → `null`.
- `ProjectsRow`: hvis `t().projects.length === 0` → `null`.
- `Trio`: hver kolonne returnerer null individuelt hvis tom; hele Trio returnerer null hvis alle tre er tomme.
- `BlogStrip`: hvis tom → render UC-banner (unik fallback).
- `Megabox`/`CornerStamp`/`IntroNote`/`PullquoteBand`/`AboutRow`/`FooterRow`: alltid render (kjernedata er garantert i content).

`page.tsx` legger hver seksjon i en wrapper-`<section>` med klassenavn for grid-plassering. CSS Grid håndterer "hull" elegant — en seksjon som ikke rendres etterlater grid-cellen tom og resten ligger på plass.

**Hvorfor:** 02-PAGES Tilstander krever "skjul seksjoner uten data". Returning null er enklere enn en eksplisitt opt-out fra parent — komponenten kjenner sin egen data best.

### D14. Lenker: peker på riktig URL, 404-er inntil rutene lager

**Valg:** Bruk Next.js `<Link>` fra `next/link` for interne ruter (`/manifest`, `/stua`, etc.). Bruk vanlig `<a href="https://bake.geish.no">` for ekte subdomener. `<Link>` er det Next-idiomatiske valget for App Router og gir client-side navigasjon når rutene faktisk eksisterer — billig å bruke nå selv om ruten 404-er.

**ProjectsRow-spesifikt:** `content.no.projects[*].name` er en blanding — noen er ekte subdomener (`bake.geish.no`, `hund.geish.no`, `reise.geish.no`), andre er prosjekt-IDer uten URL (`readme.riot`, `starter-kit`). Vi kan ikke heuristisk prepende `https://` på alle. Løsningen: legg til et eksplisitt `href?: string | null`-felt på hvert prosjekt i content. ProjectsRow wrapper card med `<a>`/`<Link>` hvis `href` finnes; ellers rendrer card som vanlig `<div>` (ikke klikkbar):

```ts
projects: [
  { name: "bake.geish.no",  href: "https://bake.geish.no",  /* ... */ },
  { name: "hund.geish.no",  href: "https://hund.geish.no",  /* ... */ },
  { name: "reise.geish.no", href: "https://reise.geish.no", /* ... */ },
  { name: "readme.riot",    href: null,                     /* ... */ }, // ingen URL ennå
  { name: "starter-kit",    href: null,                     /* ... */ }, // ingen URL ennå
],
```

Hvis `href` starter med `http`, brukes `<a href>`; ellers (interne paths som `/zine`) brukes `<Link>`. Hvis null/undefined, ingen lenke-wrapper.

**Hvorfor:** Eksplisitt URL i content er konsekvent med "all tekst og lenker fra content"-prinsippet. Lar Geir oppdatere et prosjekts destinasjon uten å åpne kodefiler. Unngår broken lenker (`https://starter-kit` ville gitt DNS-fail).

**Alternativer vurdert:**
- Heuristisk "hvis navn inneholder `.geish.no`, lenk dit": Skjør — `readme.riot` ville fortsatt blitt feil.
- Bare ikke lenke noen project-cards: Mister navigasjons-funksjon for de tre live-prosjektene.
- Bruke `name` som URL direkte: Brakt-på-igjen for IDer som ikke er domener. Avvist.

### D15. Megabox-halftone som stikker ut av kanten

**Valg:** Megabox har `position: relative; overflow: hidden`. Halftone-blokken (`<HalftoneBlock w={220} h={220} density={0.55}>`) ligger absolute i `right: -16px; bottom: -16px` med `opacity: 0.6`. Den blir beskåret av overflow, akkurat som 02-PAGES designnote krever (overflow er hva som bevarer "stikker bevisst ut av kanten"-effekten visuelt — den får vises før clip).

For at halftone-prikkene skal være i lyse farger på sort bakgrunn: trenger CSS-overstyring av `circle { fill: ... }` for å overstyre `--ink`-default fra `HalftoneBlock.module.css`. Vi løser dette ved å la HalftoneBlock akseptere en valgfri `color`-prop som setter en CSS-variabel:
```tsx
<HalftoneBlock w={220} h={220} density={0.55} color="oklch(85% 0.08 80)" />
```
Komponenten settes `style={{ "--halftone-fill": color }}` og modulen bruker `circle { fill: var(--halftone-fill, var(--ink)); }`.

**Hvorfor:** HalftoneBlock må kunne fungere både på cream (default ink-prikker) og på sort (lys prikk-farge). En `color`-prop er minimal API-utvidelse. Hvis vi ikke gjør dette, kan vi heller wrappe halftone i en div med selektor — men det er hackete.

**Følgekrav:** `src/components/shared/HalftoneBlock/index.tsx` og `.module.css` må oppdateres til å støtte `color`-prop. Det er en minimal endring i shared, men teknisk en MODIFICATION på `design-system`-spec. Vi inkluderer det i denne mandatens delta.

### D16. Photo-tape som intern CSS-snippet (ikke shared komponent)

**Valg:** Photo-tape brukes i ManifestCut (to tape-strimler) og StuaPreview (én). Vi definerer en lokal `.tape`-klasse i hver seksjonsmodul. Hver tape får sin egen posisjon (top, left/right, rotate) inline via CSS-variabler.

**Hvorfor:** 3-4 forekomster i forsiden + en demo på styleguide er ikke nok til å rettferdiggjøre en `<PhotoTape>`-komponent. Hvis bruken eksploderer i undersider kan vi refaktorere.

## Risks / Trade-offs

- **[Risk] HalftoneBlock-color-prop endring kan brekke styleguide som bruker default** → Mitigation: Default-prop verdier (color = undefined → fall til CSS-default-`var(--ink)`). Styleguide-kode trenger ingen endring.
- **[Risk] CornerStamp/IntroNote grid-plassering avviker fra forside.jsx (vi bruker rad 1-2 / 3-4 i stedet for 1-2 / 2-3)** → Mitigation: Dokumentert i D4. Geir kan flagge hvis skjermbildet krever overlapp.
- **[Risk] `as const` på 200+ linjer content kan gi treg TS-kompilasjon** → Mitigation: Profilert i E0 — TSC kjørte instant. 200 linjer er ingenting for moderne TS.
- **[Risk] `screenshots/01-forside.png` ble laget mot mockup-en, ikke koden vår — eksakt pixel-match kan være vanskelig (fontmetrikk, baseline-grid)** → Mitigation: Mandatet sier "Visuelt match mot screenshots ... review-sjekkpunkt — Geir i nettleser". Vi sikter på struktur+farge+layout-match, ikke pixel-perfect. Avvik logges i kommentar.
- **[Risk] Subdomene-lenker (`bake.geish.no`) funker ikke i lokal dev og kan se ut som de er brutt** → Mitigation: De er eksterne lenker via `<a href>`. I dev får brukeren DNS-fail; det er forventet og dokumentert i kommentar på ProjectsRow.
- **[Risk] Tom-tilstand-håndtering testes ikke i seed-tilstand** → Mitigation: Akseptert. Seed-data er full og dekker happy path. Hver seksjons null-return er en enkel sjekk som vil bli verifisert når undersider lander og driver content-modulet.
- **[Risk] 12-kolonners grid med rotasjons-komponenter (CornerStamp -7°, IntroNote +1.2°, StuaPreview -0.8°, GuestbookGrid-notes ulike) kan gi visuelle overlapp på 1280px** → Mitigation: Mockup-en bruker eksakt disse verdiene og er pixel-tett mot 1280px. Vi matcher 1:1. Hvis overlapp oppstår er det enten en regn-feil eller en bevisst kollasje-effekt — Geir tester i nettleser.

## Migration Plan

Brownfield mot E0 + e1-design-system. Roll-back er `git revert` av implementeringscommit. `src/app/page.tsx` går fra placeholder til full forside; tidligere placeholder finnes i git-historikk hvis vi noen gang trenger den.

Sekvens:
1. Port content-modulet (`i18n.ts`, `locales/no.ts`).
2. Utvid `HalftoneBlock` med `color`-prop.
3. Skriv 12 seksjonskomponenter en for en, hver med sin egen modul.
4. Skriv `page.module.css` med grid-layout.
5. Skriv om `page.tsx` til full forside.
6. Verifisering: tsc, dev server, alle 13 grid-cellene synlige, lenkene peker rett.

## Open Questions

- **Megabox-headline "STAY GROUNDED, CREATE SHIT." vs `credo: "STAY GROUNDED, AND CREATE SHIT"`** — løst i D5 ved å introdusere `credo_lines` i content. Spør Geir under apply om dette virker rimelig.
- **Photo-labels i AboutRow** — løst i D6 ved å flytte dem til `about.photos`. Hvis Geir foretrekker at de blir hardkodet i komponenten (på samme måte som forside.jsx), kan vi reversere lett.
- **`<HalftoneBlock>`-color-prop** — D15 utvider shared-API minimalt. Hvis Geir foretrekker null endring i shared, kan vi heller wrappe halftone i en `<div>` med CSS-arving — men det er mindre elegant.
- **Trio som én komponent med varianter vs tre separate** — D10 valgte én med varianter. Diskuterbart hvis kolonnene divergerer senere (manifest-akter i en kolonne, et eksperiment-grid i en annen).
- **Stua-tape: lokal CSS-snippet eller delt helper?** — D7/D16 valgte lokal. Hvis bruken vokser kan vi refaktorere.
