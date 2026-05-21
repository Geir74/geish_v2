## Context

E2 blog-engine ga MDX-pipelinen (`next-mdx-remote/rsc` + `gray-matter` + `zod`), `/blogg`-ruter, og en `Pullquote`-komponent i `src/lib/blog/`. Manifestet skal bygge på samme stack. Den autoritative teksten ligger i GRIM (`C:\Users\geirh\OneDrive\GRIM\03 Projects\geish-no\manifestet-stay-grounded.md`) og porteres inn i repoet — æøå i prosa er greit; det er innhold, ikke filnavn.

**Tekstanalyse** (autoritativ, ikke handoffens "7 akter"):
- 6 prosa-seksjoner delt med `---`:
  1. "Åpne Facebook. Gå videre. Jeg venter." (observasjon)
  2. "Det skjedde ikke over natta." (den langsomme kokingen — pullquote 1: "Du er ikke brukeren...")
  3. "Men vent. Spol tilbake." (hjemmesider før plattformer)
  4. "La oss snakke om det absurde." (Zuckerberg-kritikken — pullquote 2: "Du ga bort det mest personlige...")
  5. "Men her er greia." (AI-ironien — pullquote 3: "Det er forskjell på å bli matet AI-generert søppel...")
  6. "Jeg har ikke slettet Facebook." (konklusjonen — pullquote 4: "Trilliardærene bygde gjerder...")
- "Noen sannheter vi har glemt"-liste etter seksjon 5 (6 punkter — perfekt TL;DR-kilde).
- "Stay Grounded, and Create Shit" overskrift + 2 setninger CTA + italic sign-off + webring-linje på slutten.

**Forskjeller fra blog-poster:**
- Manifestet er én lang fil, ikke i `posts/`-mappen.
- Har strukturelle elementer (splash, TL;DR, end-blokk) som ikke er ren prosa — de hører til ruten, ikke teksten.
- Newsreader 19px (per 02-PAGES Side 2) vs. blog's 18px.
- Pullquotes "roper" (Archivo Black ~26px) i stedet for å være italic blockquote — derfor `<Pullquote>` JSX i stedet for `>`-markdown.

## Goals / Non-Goals

**Goals:**
- `/manifest` rendrer hele manifestet med riktig avis-aktig struktur per 02-PAGES Side 2.
- Geir redigerer prosaen i `src/content/manifest.mdx` uten å åpne komponentkode.
- Stempler, drop-cap, pullquotes, webring-widget rendres som spesifisert.
- Eksisterende lenker fra forsiden + blog gir 200, ikke 404.
- Pullquote er i shared (gjenbruk fra blog + manifest).

**Non-Goals:**
- PDF/webring/starter-kit-sider — 404-er er OK.
- Engelsk locale.
- Manifest som blogg-post.
- Endring av blog-pipelinen utover Pullquote-flytting.
- Tokens/shared-komponent-endringer utover Pullquote-flytting.

## Decisions

### D1. Splash/TL;DR/end-blokk som komponenter, midt-teksten som MDX

**Valg:** `src/app/manifest/page.tsx` rendrer splash + TL;DR + end-blokk som JSX-komponenter direkte. Bare midt-teksten (de 6 prosa-seksjonene) bor i `src/content/manifest.mdx` og rendres via `MDXRemote`.

**Hvorfor:**
- Splash/end-blokk har designspesifikke layouts (sentrert, stempler med rotasjoner, webring-widget, dobbel-border) som ikke er prosa. Å presse dem inn i MDX ville krevd egne JSX-tags i hver — mer komplisert å redigere enn vanlig markdown.
- TL;DR er en strukturert liste som vises i en stylet boks — den er innhold, men i en ramme. Greit å ha som array i page.tsx eller en const.
- Midt-teksten (lengste delen) er ren prosa. Den fortjener å være ren markdown med minimal JSX-overhead (kun `<Pullquote>` for de 3 pullquotene + `<hr/>` for `---`).

**Konkret arbeidsdeling:**
- `manifest.mdx`: prosaen fra seksjon 1–6. Hver `---` i kilden blir et `<hr/>` (markdown-standard). Pullquotes konverteres fra `> ...` til `<Pullquote>...</Pullquote>`. Listen "Noen sannheter vi har glemt" *fjernes* fra MDX (blir TL;DR i komponent). "Stay Grounded, and Create Shit"-sluttoverskriften og sign-off-prosaen *fjernes* fra MDX (blir end-blokk-komponent).
- `page.tsx`: rendrer splash → TL;DR → `<MDXRemote source={mdxBody}>` → end-blokk.

**Alternativer vurdert:**
- Hele manifestet i MDX med custom-komponenter: krever at Geir vet om alle JSX-tags. Mer å vedlikeholde.
- Splitte i 6 separate MDX-filer (én per seksjon): unødvendig granularitet, gjør det vanskeligere å lese manifestet som én tekst.

### D2. TL;DR-innhold

**Valg:** Bruk de 6 punktene fra "Noen sannheter vi har glemt"-listen i teksten, ordrett. Listen vises som `<ul>` med mono-font og stempel-rødt label "TL;DR — i tilfelle du bare scroller" (label fra mockup, ikke fra teksten).

Konkret tekst-mapping:
```
- Du trenger ikke 500 venner. Du trenger 15 som faktisk leser det du skriver.
- En gjestebok med tre innlegg er mer verdt enn tusen likes fra folk du aldri har møtt.
- Nettet ble bygd for å koble folk sammen. Ikke for å selge dem ting.
- Det finnes ingen algoritme som vet bedre enn deg hva du vil se.
- AI som du styrer er et verktøy. AI som styrer deg er et produkt. Kjenn forskjellen.
- Under Construction er en livsstil, ikke en feilmelding.
```

Listen lever som en `const TLDR_POINTS = [...]` i `page.tsx`. Hvis Geir vil endre den, redigerer han konstanten — én linje per punkt.

**Alternativer vurdert:**
- Hardkode listen i `manifest.mdx`-frontmatter som array: gir én sannhet, men frontmatter er ikke meningsfullt for så lang prosa. Avvist.
- Behold listen i MDX og styl `ul` som TL;DR-boks: bryter "TL;DR er en strukturert komponent"-mønsteret. Avvist.

### D3. Flytte Pullquote fra blog/ til shared/

**Valg:** Flytt `src/lib/blog/Pullquote/` → `src/components/shared/Pullquote/`. Komponentkoden er uendret. Oppdater:
- `src/components/shared/index.ts` (legg til Pullquote-eksporter).
- `src/lib/blog/mdx-components.tsx` (import fra shared i stedet for `./Pullquote`).
- Slett `src/lib/blog/Pullquote/`-mappen.

**Hvorfor:**
- To ruter bruker den (blog enkeltposter + manifest). Per pattern fra e2-blog-engine D-notater: "Hvis manifest-page eller en annen rute trenger det senere, flyttes den."
- `src/lib/blog/` skal være blog-spesifikt. Komponenter som er gjenbrukbare i andre kontekster (manifest, fremtidige langtekstsider) hører i `src/components/shared/`.

**Spec-konsekvens:** `design-system`-spec lister "8 shared-komponenter" — det øker til 9. MODIFIED på den eksisterende requirementen.

### D4. Akt-tall fjernet fra meta-linje

**Valg:** Brødsmule-meta viser kun `{readTimeMin} MIN LESETID · SIST ENDRET {lastUpdated}`. "7 AKTER"-fra-mockup droppes — teksten har 6 `---`-seksjoner og bruker ikke "akt"-konseptet i prosaen selv.

**Hvorfor:** Mandatets eksplisitte regel: "følg teksten, ikke tallet". Akt-konseptet var en mockup-pålegging som ikke matcher den ferdige teksten. Drop det heller enn å finne på et nytt tall.

### D5. Manifest content-API

**Valg:** `src/lib/manifest/content.ts` med én funksjon:

```ts
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { deriveReadTime } from "@/lib/blog/reading-time";

const manifestFrontmatterSchema = z.object({
  lastUpdated: z.union([z.string(), z.date()]).transform(v =>
    v instanceof Date ? v.toISOString().slice(0, 10) : v
  ),
});

export interface ManifestData {
  lastUpdated: string;
  readTimeMin: number;
  mdxSource: string;
}

export async function getManifest(): Promise<ManifestData> {
  const filePath = path.join(process.cwd(), "src/content/manifest.mdx");
  const raw = await fs.readFile(filePath, "utf-8");
  const { data, content } = matter(raw);
  const result = manifestFrontmatterSchema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Invalid frontmatter in src/content/manifest.mdx: ${result.error.message}`,
    );
  }
  return {
    lastUpdated: result.data.lastUpdated,
    readTimeMin: deriveReadTime(content),
    mdxSource: content,
  };
}
```

**Hvorfor enklere enn blog:**
- Én kjent fil, ikke en glob. Ingen `getAllManifests()`-pattern.
- Bare ett frontmatter-felt (`lastUpdated`). Minimal validering.
- Gjenbruker `deriveReadTime` fra blog.

### D6. MDX-komponenter for manifest

**Valg:** Manifestet bruker samme `mdxComponents` som blog: Stamp, HalftoneBlock, Pullquote. Ingen manifest-spesifikke komponenter trengs i scope.

Manifest-MDX importerer ikke noe ekstra — `<Pullquote>` og `<Stamp>` (hvis brukt inline) er tilgjengelige via komponent-mappen.

For å holde manifest- og blog-MDX-konfigene separate (i tilfelle de divergerer senere), opprett `src/lib/manifest/mdx-components.tsx` som re-eksporterer blog's konfigurasjon (én linje), eller importer blog's `mdxComponents` direkte i manifest's page.tsx. Velger sistnevnte (mindre indirekte).

```tsx
// manifest/page.tsx
import { mdxComponents } from "@/lib/blog/mdx-components";
// ... <MDXRemote source={...} components={mdxComponents} />
```

**Anmerkning:** Hvis det føles rart å importere fra `lib/blog` i manifest, kan vi flytte `mdx-components.tsx` til et nøytralt sted (`src/lib/mdx/`). Vurderes hvis flere langtekstsider kommer. Foreløpig: blog-import er pragmatisk.

### D7. Prose-styling for manifest (19px, drop-cap)

**Valg:** Manifestet bruker sin egen `.prose`-styling i `src/app/manifest/page.module.css` — ikke blog's `prose.module.css`. Forskjeller fra blog-prose:
- `font-size: 19px` (blog: 18px). Per 02-PAGES Side 2 designnote.
- Drop-cap: `font-size: 64px` (blog: 4.2em ≈ 75px). Justering for å ikke dominere helt.
- Blockquote: stylet som *Pullquote* alternative (Archivo Black, double-border) — men siden vi bruker `<Pullquote>` JSX i stedet for `>`-markdown, kommer markdown-blockquotes ikke til å forekomme i praksis. Behold blog-stylet blockquote som fallback.
- `<hr/>`-styling for `---`-seksjonsskillere: tynn ink-linje, sentrert prikk-ornament alternativ. Velger `hr { border: 0; height: 1px; background: var(--ink-fade); margin: var(--sp-8) 0; }` per mockup.

Hvorfor ikke kopiere blog/prose.module.css?
- Småforskjellene (font-size, drop-cap) gjør at en kopi raskt divergerer. Heller eksplisitt manifest-prose i page.module.css = én fil, alt manifest-CSS samlet.

### D8. Stempler i splash med rotasjoner

**Valg:** Splash har en `.stamprow`-flex-row med tre `<Stamp>`-komponenter:

```tsx
<div className={styles.stamprow}>
  <Stamp rotate={-4}>Punk·standup</Stamp>
  <Stamp rotate={3}>Anti·plattform</Stamp>
  <Stamp rotate={-2}>Pro·eierskap</Stamp>
</div>
```

Stamp-komponenten (shared) bruker allerede `var(--chaos)` for rotasjons-skalering. På mobil dempes rotasjonene automatisk via E1.5-mekanismen.

`flex-wrap: wrap` på `.stamprow` så stemplene wrapper på smal skjerm.

### D9. End-blokk: CTA-lenker som 404-er

**Valg:** End-blokk har tre CTA-lenker som peker på faktiske URL-er. Alle 404-er inntil senere mandater lager dem:

- "Klon starter-kitet" → `/starter-kit` (E5).
- "Bli med i webringen" → `/ring/join` (E5).
- "Last ned som zine (PDF)" → `/manifest.pdf` (senere change).

Mandatet aksepterer 404 her. Geir kan se i nettleser hvilke ruter som mangler.

**Alternativ vurdert:** Lenke til `#` for å unngå 404. Avvist — lenken peker dit den *skal*, og 404-en er en explicit todo, ikke en gjemt feil.

### D10. Sign-off-prosa og 🚧

**Valg:** Sign-off-prosaen rendres som-er fra teksten — tre linjer i italic:

> *Skrevet av en fyr som ble lei av å scrolle. Med litt hjelp av en AI som gjør det han ber den om.*
> *Publisert på min egen server. Ingen sporing. Ingen reklame. Ingen algoritme.*
>
> 🚧 Denne siden er under construction. Alltid.

`🚧` beholdes som karakter-glyf i sign-off-prosaen. Det er bevisst zine-flair, ikke et funksjonelt ikon (per mandatets retningslinje). Sign-off-prosaen står som tekst, ikke en `<UnderConstructionBanner>`-komponent — bannerets blinkende oppførsel hører ikke hjemme i en avsluttende sign-off.

Webring-linja fra teksten ("← Forrige | 🔗 geish.no webring | Neste →") rendres IKKE som tekst — den blir en `<WebringWidget variant="bar">`-komponent. Den shared-komponenten bruker allerede ◉-glyf i stedet for 🔗 (fra e1-design-system).

### D11. Pullquote-flytting: import-oppdateringer

**Valg:** Etter flytting:

```ts
// src/components/shared/index.ts (modifisert)
export { Pullquote, type PullquoteProps } from "./Pullquote";
```

```ts
// src/lib/blog/mdx-components.tsx (modifisert import)
import { HalftoneBlock, Pullquote, Stamp } from "@/components/shared";
```

```ts
// src/app/manifest/page.tsx (ny — bruker shared)
import { Stamp, WebringWidget } from "@/components/shared";
// Pullquote brukes inni MDX-body via mdxComponents-map, ikke direkte i splash/TL;DR/end.
```

Sletting:
- `src/lib/blog/Pullquote/index.tsx`
- `src/lib/blog/Pullquote/Pullquote.module.css`

Den nye plasseringen følger folder-as-component-mønsteret fra shared:
- `src/components/shared/Pullquote/index.tsx`
- `src/components/shared/Pullquote/Pullquote.module.css`

### D12. Lesbar kolonne-bredde + responsivt

**Valg:** Manifest-body og end-blokk har `max-width: 760px; margin: 0 auto` for lesbarhet. Splash er full-bredde sentrert. TL;DR er innenfor body-bredde.

Responsive media queries:
- Splash h1: `clamp(40px, 8vw, 92px)`.
- End-blokk credo: `clamp(28px, 5vw, 48px)`.
- Stamprow: `flex-wrap: wrap; justify-content: center`.
- Body padding: `48px 24px` desktop → `32px 16px` <768px → `24px 12px` <480px.
- TL;DR-listens font-size: 15px (mono) er allerede liten — beholdes.

## Risks / Trade-offs

- **[Risk] Manifest-MDX og blog-MDX-konfiger divergerer over tid** → Mitigation: Foreløpig deler de `mdxComponents`-mappen via import. Hvis manifest får manifest-spesifikke MDX-komponenter, lager vi en `src/lib/manifest/mdx-components.tsx` som re-eksporterer + utvider.
- **[Risk] Pullquote-flytting bryter blog-spec (som sier den er i `src/lib/blog/`)** → Mitigation: MODIFIED på blog-spec dekker dette. Verifisert at det er den eneste blog-spec-referansen til Pullquote-plassering.
- **[Risk] 🚧 i sign-off bryter forbudslisten (emoji-ikoner)** → Mitigation: Mandatets retningslinje aksepterer karakter-glyfer som zine-flair i prosa-kontekst — det er ikke et funksjonelt ikon her. Dokumentert i D10.
- **[Risk] Drop-cap på første paragraf forutsetter at MDX-body starter med en `<p>`** → Mitigation: Manifest-MDX starter med "Åpne Facebook. Gå videre. Jeg venter." — én paragraf. Drop-cap fungerer på første "Å".
- **[Risk] Splash mega-headline 92px sprenger ved < 320px** → Mitigation: `clamp(40px, 8vw, 92px)` — på 320px blir det 40px (samme strategi som forside-Megabox). Headline bryter på linjeslutt-mellomrom; ingen ubrytelige superlange ord ("Stay" / "Grounded," / "and Create" / "Shit").
- **[Risk] CTA-lenkene 404-er, kan virke broken** → Mitigation: Akseptert per mandat. Lenkene peker dit ting *skal* være. Senere mandater fyller inn.
- **[Risk] Manifest-MDX-fila har æøå i prosa** → Mitigation: Innhold, ikke filnavn. Filnavnet er `manifest.mdx` (ASCII). gray-matter + UTF-8 håndterer æøå uten problem. Verifisert i blog-postene som har samme.

## Migration Plan

Brownfield. Roll-back er `git revert` av implementeringscommit. Ingen data, ingen DB. Sekvens:

1. Flytt Pullquote: opprett `src/components/shared/Pullquote/`, kopier filer fra blog, oppdater shared barrel, oppdater blog-mdx-components-import, slett gammel plassering.
2. Verifiser at /blogg/[slug] fortsatt rendrer Pullquote (manifest-bruk er ikke der ennå).
3. Skriv `src/content/manifest.mdx` med ordrett tekst-port + frontmatter.
4. Skriv `src/lib/manifest/content.ts`.
5. Skriv `src/app/manifest/page.tsx` (splash, TL;DR, MDX-render, end-blokk).
6. Skriv `src/app/manifest/page.module.css` (full styling, inkl. prose-stilen).
7. Verifisering: `npx tsc --noEmit`, `npm run dev`, `/manifest` returnerer 200, splash + TL;DR + brødtekst + end-blokk vises, `<Pullquote>` rendres, drop-cap på første paragraf, webring-bar i bunnen. Forsidens ManifestCut/IntroNote-lenker treffer manifest, ikke 404. Blog-poster fortsatt OK.

## Open Questions

- **`manifest.mdx`-lokasjon: `src/content/manifest.mdx` (parallell med `posts/`) eller `src/content/manifest/manifest.mdx`?** — Forslag: `src/content/manifest.mdx` direkte. Én fil, ingen behov for mappe.
- **Last-updated-felt: automatisert (mtime/git-log) eller manuelt i frontmatter?** — Forslag: manuelt frontmatter-felt. Mtime svarer ikke til intensjonelle redigeringer (autoformat kan endre den uten at Geir har "oppdatert" manifestet). git-log er en deploy-time-løsning som ikke fungerer i dev. Frontmatter er eksplisitt og enkel.
- **Skal `<hr/>`-styling være en mellom-tekst-ornament (`* * *` eller `◊`) eller ren strek?** — Forslag: ren strek (mockup-mønsteret). Vi kan oppgradere til ornament senere hvis Geir vil ha mer flair.
- **`src/lib/manifest/mdx-components.tsx`-fil eller direkte-import fra blog?** — Forslag: direkte-import. Mindre indirekte. Lager filen hvis manifest får egne komponenter senere.
