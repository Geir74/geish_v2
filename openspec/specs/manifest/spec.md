# manifest Specification

## Purpose
TBD - created by archiving change e2-manifest. Update Purpose after archive.
## Requirements
### Requirement: Manifest-teksten bor i én MDX-fil med frontmatter

Manifestet SHALL bo i `src/content/manifest.mdx`. Filen MUST inneholde YAML-frontmatter med `lastUpdated`-felt (ISO date `YYYY-MM-DD` eller YAML date som normaliseres til samme format) og MDX-brødtekst som tilsvarer 6 prosa-seksjoner fra den autoritative kilden (`manifestet-stay-grounded.md` i GRIM), delt med `---` for visuelle seksjons-pauser.

MDX-body MUST IKKE inneholde:
- "Noen sannheter vi har glemt"-listen (rendres som TL;DR-komponent i `page.tsx`).
- "Stay Grounded, and Create Shit"-end-overskriften, sign-off-prosaen, eller webring-linja (rendres som end-blokk-komponent i `page.tsx`).

MDX-body MUST inneholde:
- De 6 prosa-seksjonene fra kilden, ordrett tekst-port.
- `<Pullquote>...</Pullquote>` JSX-tags for de 4 pullquote-sitatene i teksten (konvertert fra markdown `> ...`-syntaks).
- `---` mellom seksjoner (rendres til `<hr/>`).

Teksten redigeres direkte i denne filen — ingen prosa hardkodes i React-komponenter.

#### Scenario: manifest.mdx finnes med frontmatter
- **WHEN** `src/content/manifest.mdx` leses
- **THEN** filen har en `--- ... ---`-blokk øverst med `lastUpdated`, etterfulgt av prosa-tekst

#### Scenario: pullquotes bruker JSX-syntaks
- **WHEN** `grep -E "<Pullquote>" src/content/manifest.mdx` kjøres
- **THEN** minst 4 treff (én per pullquote i den autoritative teksten)

#### Scenario: ingen TL;DR-liste i body
- **WHEN** `grep "Noen sannheter vi har glemt" src/content/manifest.mdx` kjøres
- **THEN** ingen treff — listen lever i page.tsx-komponenten

### Requirement: Manifest content-API

`src/lib/manifest/content.ts` SHALL eksportere `getManifest(): Promise<ManifestData>` som leser `src/content/manifest.mdx`, validerer frontmatter med zod, utleder `readTimeMin` fra `deriveReadTime()` (gjenbruk fra blog-pipelinen), og returnerer:

```ts
interface ManifestData {
  lastUpdated: string;  // ISO date "YYYY-MM-DD"
  readTimeMin: number;
  mdxSource: string;
}
```

Ugyldig frontmatter MUST kaste en feilmelding som identifiserer filen og det problematiske feltet — samme mønster som blog-content-API.

#### Scenario: getManifest returnerer parsed data
- **WHEN** `getManifest()` kalles med gyldig manifest.mdx
- **THEN** returnerer `{ lastUpdated, readTimeMin, mdxSource }` med korrekte typer

#### Scenario: getManifest kaster ved ugyldig frontmatter
- **WHEN** `manifest.mdx` mangler `lastUpdated`-feltet
- **THEN** `getManifest()` kaster en `Error` med melding som inkluderer `manifest.mdx` og `lastUpdated`

### Requirement: /manifest-rute rendrer splash, TL;DR, brødtekst, end-blokk

`src/app/manifest/page.tsx` SHALL være en static (`force-static`) async server component som rendrer i denne rekkefølgen:

1. **Brødsmule-strip:** `geish.no / MANIFESTET`. Høyre: `{readTimeMin} MIN LESETID · SIST ENDRET {lastUpdated}` (formatert til norsk dato).
2. **Splash-seksjon** (sentrert, double-line border under):
   - Kicker: `— Et manifest fra geish.no —` (mono, stempel-rød).
   - Mega-headline: `Stay Grounded, / and Create Shit` (Archivo Black, siste to ord i `--stamp`-farge, `clamp(40px, 8vw, 92px)`).
   - Deck: `Eller: hvorfor jeg droppet Facebook og lagde min egen hjemmeside i 2026.` (Newsreader italic 22px, ink-soft).
   - Stempelrad: 3 `<Stamp>`-komponenter med rotasjoner `-4°`, `+3°`, `-2°`: "Punk·standup", "Anti·plattform", "Pro·eierskap". `flex-wrap: wrap` for mobil.
3. **TL;DR-boks** (innenfor body-bredde):
   - Beige (`--paper-warm`) boks med ink-border.
   - Label: `TL;DR — i tilfelle du bare scroller` (mono, stempel-rød).
   - 6 punkter fra manifestets "Noen sannheter vi har glemt"-liste, ordrett, som `<ul>` med typewriter-font.
4. **MDX-brødtekst** (innenfor body, `max-width: 760px`):
   - Rendres via `<MDXRemote source={mdxSource} components={manifestMdxComponents} />`.
   - Wrappet i div med manifest-prose-klasse (Newsreader 19px, drop-cap på første `p`).
   - Manifest-MDX-komponentmappen (`src/lib/manifest/mdx-components.tsx`) MUST overstyre `Pullquote` til å bruke `variant="loud"` som default — slik at Geir kan skrive vanlig `<Pullquote>...</Pullquote>` i `manifest.mdx` uten variant-prop per sitat, og alle 4 sitater roper.
5. **End-blokk** (sentrert, double-line border over):
   - Credo: `Stay Grounded, / and Create Shit.` (Archivo Black, samme aksent som splash, `clamp(28px, 5vw, 48px)`).
   - CTA-rad: 3 lenker i mono — `/starter-kit`, `/ring/join`, `/manifest.pdf` (alle 404-er inntil senere mandater).
   - Sign-off-prosa (italic, ink-fade): "Skrevet av en fyr..." / "Publisert på min egen server..." / "🚧 Denne siden er under construction. Alltid."
   - Webring-widget: `<WebringWidget variant="bar">`.

`/manifest` SHALL være statisk (`export const dynamic = "force-static"`). `generateMetadata` returnerer post-spesifikk title + description.

#### Scenario: /manifest returnerer 200 med riktig innhold
- **WHEN** `npm run dev` kjøres og GET sendes til `/manifest`
- **THEN** responsen er 200 og inneholder bevis på alle 4 strukturelle blokker: splash ("Punk·standup", "Anti·plattform", "Pro·eierskap"), TL;DR ("TL;DR — i tilfelle du bare scroller"), brødtekst ("Åpne Facebook. Gå videre. Jeg venter."), end-blokk ("Stay Grounded, and Create Shit.")

#### Scenario: pullquotes rendres med loud-variant
- **WHEN** /manifest rendres
- **THEN** HTML-responsen inneholder `Pullquote-module__*__loud`-klassen (ikke `__pullquote` quiet-default) for hvert av de 4 pullquote-sitatene. Manifest-MDX-komponentmappen har overstyrt default-varianten.

#### Scenario: blog-pullquotes upåvirket av manifest-variant
- **WHEN** `/blogg/[slug]` rendres etter at manifest-routen er live
- **THEN** blog-postens pullquote har fortsatt quiet-klassen (`__pullquote`), ikke `__loud` — blog-MDX-komponentmappen sender ikke variant-prop, og default-varianten er quiet.

#### Scenario: stempler har varierte rotasjoner
- **WHEN** /manifest rendres
- **THEN** de 3 stemplene i splash har `style="--rotation:-4"`, `style="--rotation:3"`, `style="--rotation:-2"` (eller tilsvarende computed transforms)

#### Scenario: drop-cap på første paragraf
- **WHEN** /manifest rendres
- **THEN** første `<p>` i body har CSS `::first-letter` med stempel-rød Archivo Black (verifiserbart via class-selektor i computed style)

#### Scenario: meta-linje uten akt-tall
- **WHEN** /manifest brødsmule rendres
- **THEN** høyre-siden viser bare `X MIN LESETID · SIST ENDRET YYYY-MM-DD`-mønster — ingen "AKTER"-tekst

### Requirement: Eksisterende manifest-lenker treffer 200

Lenker som peker på `/manifest` SHALL gi 200 etter at denne change lander:
- Forsidens `ManifestCut`-seksjon ("→ Hele manifestet, syv akter"-lenke).
- Forsidens `IntroNote`-seksjon ("→ Les manifestet"-lenke).
- Blogg-posters lenker til `/manifest` (om noen seed-poster har eksplisitt manifest-lenke).

#### Scenario: forside-lenker treffer manifest
- **WHEN** GET sendes til `/` og lenken "Les manifestet" eller "Hele manifestet" klikkes (eller fetches direkte)
- **THEN** målruten `/manifest` returnerer 200, ikke 404

### Requirement: Responsiv /manifest per RESPONSIVE.md

`/manifest`-ruten SHALL være lesbar og ikke sprenge horisontal scroll ved 320px viewport. Konkret:
- Splash h1: `clamp(40px, 8vw, 92px)`.
- End-blokk credo: `clamp(28px, 5vw, 48px)`.
- Stempelrad bruker `flex-wrap: wrap; justify-content: center`.
- Body-kolonne har `max-width: 760px` desktop, krymper med viewport-padding på smal skjerm.
- Padding kollapser: `48px 24px` (desktop) → `32px var(--sp-4)` (<768px) → `24px var(--sp-3)` (<480px).
- CTA-rad i end-blokk: `flex-wrap: wrap` så lenkene wrapper på smal skjerm.

`--chaos`-skalering fra E1.5 forplanter seg automatisk til `<Stamp>`-rotasjoner.

#### Scenario: /manifest leser på 320px
- **WHEN** GET sendes til `/manifest` ved 320px viewport
- **THEN** ingen horisontal scroll; stempler wrapper; brødtekst-kolonne fyller container med padding

#### Scenario: /manifest desktop er avis-estetikk
- **WHEN** GET sendes ved ≥1280px viewport
- **THEN** splash h1 er 92px Archivo Black, brødtekst 19px Newsreader, double-line ink-borders under splash og over end-blokk, body sentrert med max-width 760px

