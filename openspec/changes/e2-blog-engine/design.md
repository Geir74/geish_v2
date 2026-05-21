## Context

E1 + E1.5 leverte forsiden, designsystemet, og responsiv-mønsteret. `BlogStrip` på forsiden bruker `t().blog_posts` — hardkodet seed-data fra content-modulet. Det finnes ingen `/blogg`-rute. Drizzle/Supabase er wired men ubrukt; live DB-verifisering er deferert til E4 (Stua) der det testes mot ekte tabeller.

**Autoritativ design:**
- `02-PAGES.md` Side 4: avis-estetikk — double-line border under masthead, "UTGAVE №", Newsreader 17–19px brødtekst, tags i stempel-farge, hero-post med cover-placeholder eller halftone.
- `references/pages.jsx` `PageBlogg`: layout-referanse for masthead/hero/arkiv/sidebar. Inline-stilene oversettes til CSS Modules — kopieres ikke rått.

**Arkitekturvalg (låst av mandatet):** Filbasert MDX, ikke Postgres. Git er publiseringsmekanismen. Ingen kommentarer — samtale lenkes til Stua.

**Tekniske premisser:**
- Next.js 16 med App Router + Turbopack. App Router støtter Server Components — vi rendrer alt server-side.
- Turbopack har begrensninger mot vilkårlige bundler-plugins. `next-mdx-remote/rsc` er en ren Node-pakke som kompilerer MDX ved request/build-time — ingen loader-magi, ingen Turbopack-friksjon. `@next/mdx` ville krevd at vi konfigurerer en MDX-loader i `next.config.ts` og bruker `pageExtensions`-utvidelser — fungerer per Next 16-docs men er mer indirekte for vår fil-først tilnærming.

## Goals / Non-Goals

**Goals:**
- En `.mdx`-fil på disk publiseres ved git-commit.
- Frontmatter er typesikkert og valideres ved første read → build-time fail med tydelig melding ved feil.
- `/blogg` og `/blogg/[slug]` rendres som statiske server-routes (SSG via `generateStaticParams`).
- Hver post kan bruke et lite, kuratert sett av designsystem-komponenter i MDX-brødtekst.
- Forsidens `BlogStrip` henter ekte poster — én kilde til sannhet for "hva er publisert".
- Responsivt fra start, ikke en E2.5-runde.

**Non-Goals:**
- Postgres-tabell for poster.
- Kommentarer/innsending/moderering.
- Tag-/arkiv-ruter (`/blogg/tag/[tag]`).
- RSS-feed-generering.
- Ekte cover-bilder, syntax-highlighting, GFM-tabeller.
- Live-redaktørverktøy eller admin-UI.
- Engelsk locale på blogg (`stua_thread` osv. forblir norsk).

## Decisions

### D1. MDX-pipeline: `next-mdx-remote/rsc` over `@next/mdx`

**Valg:** `next-mdx-remote/rsc` (MDX-kompilator brukbar fra Server Components) + `gray-matter` (frontmatter-parser) + `zod` (schema-validering).

```ts
// src/content/posts.ts
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { postFrontmatterSchema } from "@/lib/blog/schema";

const POSTS_DIR = path.join(process.cwd(), "src/content/posts");

export async function getAllPosts(): Promise<Post[]> {
  const files = await fs.readdir(POSTS_DIR);
  const posts = await Promise.all(
    files.filter(f => f.endsWith(".mdx")).map(async f => {
      const raw = await fs.readFile(path.join(POSTS_DIR, f), "utf-8");
      const { data, content } = matter(raw);
      const result = postFrontmatterSchema.safeParse(data);
      if (!result.success) {
        throw new Error(`Invalid frontmatter in ${f}: ${result.error.message}`);
      }
      return buildPost(f, result.data, content);
    }),
  );
  return posts
    .filter(p => !p.draft || process.env.NODE_ENV !== "production")
    .sort((a, b) => b.published.localeCompare(a.published));
}
```

```tsx
// src/app/blogg/[slug]/page.tsx (rendrer MDX)
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/lib/blog/mdx-components";

export default async function PostPage({ params }) {
  const { slug } = await params;
  const result = await getPostBySlug(slug);
  if (!result) notFound();
  return <MDXRemote source={result.mdxSource} components={mdxComponents} />;
}
```

**Hvorfor next-mdx-remote/rsc:**
- Ren Node-pakke — ingen Turbopack-bundler-konfig kreves.
- `gray-matter` håndterer frontmatter eksplisitt; vi kontrollerer parsing-laget.
- Frontmatter-validering er en zod-`safeParse`-kall i vår egen kode — full kontroll over feilmeldingen.
- Type-inferens fra zod gir oss `Post`-typen gratis.

**Alternativer vurdert:**
- `@next/mdx` med `pageExtensions: ["ts", "tsx", "mdx"]` og frontmatter via `remark-frontmatter`+`remark-mdx-frontmatter`: Funker, men eksponerer MDX-loader-konfig + flere bundler-pluginavhengigheter. Frontmatter-validering blir spredd mellom remark-plugin og runtime-typer. Turbopack tvinger plugin-strenger.
- `contentlayer`: Modent verktøy for typed MDX, men ikke aktivt vedlikeholdt (siste oppdatering 2023). Avvist.
- `velite` / `mdsvex`-aktige: Per-feature build-time content; overkill for én blog med få poster.
- `@next/mdx` med `export const metadata = {...}` inni MDX (uten YAML): Bryter Jekyll/Hugo-konvensjonen. Frontmatter som "denne tekstens" felt — ikke kode. Avvist.

### D2. Slug-strategi: ASCII-filnavn, slug = filnavn uten `.mdx`

**Valg:** Filnavn må være URL-safe ASCII (`hvorfor-jeg-sluttet-aa-scrolle.mdx`). Norsk æøå konverteres ved filnavngivning: `æ → ae`, `ø → oe`, `å → aa`. Slug utledes direkte: `path.basename(file, ".mdx")`. Ingen `slug`-felt i frontmatter.

**Hvorfor:**
- Én sannhet for slug — filnavnet. Ingen "mismatched filename vs slug"-feil mulig.
- URL-safe uten URL-encoding av æøå (`%C3%A6` osv. er stygt).
- Konvensjonen `aa/oe/ae` matcher hvordan nordiske domener historisk har taklet æøå.
- Geir vet hva han kaller filer — det er hans copy uansett.

**Alternativer vurdert:**
- Frontmatter `slug`-felt: Risikerer mismatch mot filnavn, fritt formede slugs som kanskje kolliderer. Avvist.
- Norsk i filnavn + slugify-bibliotek: Legger til en avhengighet for én konvensjon Geir kan følge selv. Avvist.

### D3. readTimeMin: utled fra ordtelling, frontmatter override mulig

**Valg:** Hvis `readTimeMin` ikke er i frontmatter, utledes det fra `content.split(/\s+/).length / 200` (200 ord/min, rundet opp). Frontmatter-verdi vinner.

```ts
function deriveReadTime(content: string): number {
  const words = content.replace(/[#*_`>\-\[\]\(\)]/g, "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
```

**Hvorfor:** Mandatet sier "utled fra ordtelling automatisk, med frontmatter-override". 200 wpm er en standard antagelse. Manuelt felt finnes for poster der Geir vil overstyre (f.eks. en kort post med mange bilder/kode).

### D4. MDX-komponenter eksponert til posts

**Valg:** Et lite kuratert sett, definert i `src/lib/blog/mdx-components.tsx`:

- `Stamp` (re-eksport fra `@/components/shared`)
- `HalftoneBlock` (re-eksport fra `@/components/shared`)
- `Pullquote` (lokal definert) — Archivo Black 26px sitat, sentrert, stempel-rød double-border. Mønstret etter Manifest-pullquotes i `02-PAGES.md` Side 2 designnote.
- Standard HTML-mapping for `h2/h3/p/a/blockquote/code/pre/ul/ol/li` med blog-spesifikk styling (Newsreader 17–19px brødtekst, mono for `code`, dashed border på `blockquote`).

```tsx
// src/lib/blog/mdx-components.tsx
import { Stamp, HalftoneBlock } from "@/components/shared";
import { Pullquote } from "./pullquote";
import styles from "./prose.module.css";

export const mdxComponents = {
  Stamp,
  HalftoneBlock,
  Pullquote,
  h2: (props) => <h2 className={styles.h2} {...props} />,
  // ... resten av prose-styling
};
```

**Hvorfor:**
- Lite sett = mindre å vedlikeholde. Geir kan utvide senere når en spesifikk post krever det.
- Stamp + Pullquote dekker visuelle "trykt"-elementer i en post.
- HalftoneBlock for dekor mellom seksjoner.

**Alternativer vurdert:**
- Eksponere hele `@/components/shared`: For mye, og roterte/kollasje-orienterte komponenter (`GuestbookSnippet`, `WebringWidget`) hører ikke hjemme i brødtekst.
- Ingen ekstra komponenter, bare ren markdown: Bryter mandatet ("MDX-brødtekst kan bruke designsystem-komponenter").

### D5. Frontmatter-skjema med zod

**Valg:**

```ts
// src/lib/blog/schema.ts
import { z } from "zod";

export const postFrontmatterSchema = z.object({
  title: z.string().min(1),
  tag: z.string().min(1),
  excerpt: z.string().min(1),
  published: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  draft: z.boolean().optional().default(false),
  readTimeMin: z.number().int().positive().optional(),
  coverImage: z.string().optional(),
  stua_thread: z.string().optional(),
});

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

export interface Post extends PostFrontmatter {
  slug: string;
  readTimeMin: number; // alltid satt etter prosessering
  content: string; // MDX-kilde
}
```

**Hvorfor zod:**
- TS-typer fra schema = én kilde til sannhet.
- `safeParse` gir oss `result.error.message` med felt-navn — gjør "tydelig melding ved build-feil" trivielt.
- Liten dep (~50KB), bredt brukt, Next.js-kompatibel.

**Alternativer vurdert:**
- Manuell sjekk: Mer kode, mindre presis feilmelding.
- `valibot`/`arktype`: Mer eksotiske, mindre kjent. Zod er industri-default.

### D6. Tag-cloud og arkiv-måneder: aggregert fra poster, lenker til `#`

**Valg:** Sidebar-komponenter aggregerer:
- **Tags:** `Map<string, number>` fra alle posts' `.tag`-felt. Sortert alfabetisk eller etter count (count desc valgt — viser populære tags først).
- **Arkiv-måneder:** `Map<string, number>` med nøkkel `"YYYY-MM"`, formatert til `"mai 2026"` ved visning. Sortert nyeste først.

Lenker peker til `#` for nå. Filtrering implementeres ikke i denne change. Dokumentert som "vis, ikke filtrer".

**Hvorfor:**
- Egen filtrering = egne ruter (`/blogg/tag/[tag]`) eller klient-state-håndtering. Begge er separate beslutninger som fortjener egen mandat.
- Sidebar-elementene har designverdi som "se hvor mye som er skrevet" uavhengig av interaktivitet.

**Implementasjon:** En enkel helper-funksjon `aggregate(posts)` returnerer `{ tags: TagCount[], months: MonthCount[] }`.

### D7. RSS-boks: visning, lenker til `#`

**Valg:** Sidebar har en `<div class="rss">`-boks med tekst "RSS · ATOM · JSON" og en lenke `geish.no/feed`. Lenken peker til `#`. Faktisk feed-endepunkt = senere change.

**Hvorfor:** RSS-feed-generering er ikke trivielt:
- Velge feed-format (RSS 2.0 vs. Atom 1.0 vs. JSON Feed).
- Generere XML/JSON server-side fra MDX-poster.
- Static (build-time) vs. dynamic (request-time) generering.
- Cache-policy.

Fortjener egen vurdering. RSS-boks som visning bevarer avis-estetikken uten å forplikte til feed-implementasjonen.

**Anmerkning:** "📡"-emoji i mockup-en (`references/pages.jsx`) bryter forbudslisten — erstattes med tekst-glyf (`◊` eller bare "RSS / ATOM / JSON" uten ikon).

### D8. Responsive grids per RESPONSIVE.md

**Valg:**

| Grid | ≥768px | 480–767px | <480px |
|------|--------|-----------|--------|
| `.body` (feed/sidebar) | `1fr 280px` | `1fr` (sidebar stacker under feed) | `1fr` |
| `.hero-post` (cover/text) | `1.4fr 1fr` | `1fr` (cover over text) | `1fr` |
| `.archive` (poster) | `1fr 1fr` | `1fr 1fr` (behold 2-kol) | `1fr` |
| `.masthead` (h1/issue) | `1fr auto` | `1fr` (issue under h1) | `1fr` |

Mega-headings via clamp:
- `.masthead h1`: `clamp(40px, 8vw, 92px)` — bevarer mockup-92px på desktop.
- `.hero-post h2`: `clamp(28px, 4.2vw, 48px)`.
- Single-post `.post h1`: `clamp(36px, 6vw, 64px)` — mindre enn hero på liste-siden (vi har allerede kommet til posten).
- Brødtekst-tier (`--font-serif` 17–19px) holdes faste — minstemålet per `02-PAGES.md` "Newsreader 17–19px er kanonisk lesestørrelse. Ikke gå mindre."

`--chaos`-dempingen fra E1.5 forplanter seg automatisk hvis vi roterer noe i blog-sidene (forventet: minimalt — bloggen er roligere enn forsiden per avis-estetikken).

### D9. Hero-cover-strategi: `<HalftoneBlock>`-fallback

**Valg:** Hero-postens cover er `ImagePlaceholder`-aktig stripepattern hvis `coverImage` ikke er satt i frontmatter — eller helst `<HalftoneBlock>` per `02-PAGES.md`-designnote:

> "Hvis ikke noe bilde finnes, bruk HalftoneBlock som dekorativ erstatning, ikke et generisk ikon."

Implementering: hvis `post.coverImage` undefined → render `<HalftoneBlock w={N} h={260} density={0.5} />` som hero-art. Hvis satt → render `<img src={coverImage}>` (eller `next/image` hvis vi vil ha optimalisering — kan vurderes hvis Geir legger til ekte bilder).

**Hvorfor halftone framfor ImagePlaceholder:** designnoten er eksplisitt. ImagePlaceholder med klammeparentes-label (`[HUND.JPG]`) er forside-stil; bloggen er roligere/avis-aktig.

### D10. `stua_thread`-lenke: spesifikk eller `/stua`

**Valg:** Single-post-siden har en "Diskuter i Stua →"-blokk i bunnen. Hvis `post.stua_thread` er satt, lenker den til `/stua/${stua_thread}`. Ellers `/stua`. Begge ruter 404-er inntil E4 lander Stua — samme mønster som andre ennå-ikke-eksisterende ruter i forsiden.

**Hvorfor:** `stua_thread` lar Geir lenke en post til en spesifikk tråd når han vil ha diskusjon på et bestemt sted. Default `/stua` er en sane fallback.

### D11. Cleanup: fjern `t().blog_posts` fra content-modulet

**Valg:** Etter at `BlogStrip` leser fra `getAllPosts()`, er `blog_posts`-feltet i `src/content/locales/no.ts` ubrukt. Fjernes for å unngå "to sannheter for hvilke poster finnes".

**Hvorfor:** Døde felt råtner. Bedre å fjerne nå enn å la det stå og forvirre senere lesere ("oppdater jeg her eller i .mdx?").

**Følgekrav:** `Dictionary`-typen i `i18n.ts` blir oppdatert siden `as const` på no.ts genererer typen dynamisk — ingen separat type-fil å vedlikeholde.

### D12. SSG vs. dynamic — `force-static`

**Valg:** Begge blogg-rutene erklærer `export const dynamic = "force-static"`. `generateStaticParams` for [slug] returnerer alle (non-draft) slugs. Posts er statiske assets — git-commit publiserer, neste build inkluderer dem.

**Hvorfor:** Ingen DB, ingen request-tid-state, ingen autentisering på blogg. Static er rett mønster. Gir også best ytelse + edge-caching ved deploy.

## Risks / Trade-offs

- **[Risk] `next-mdx-remote` er mindre vedlikeholdt enn `@next/mdx`** → Mitigation: Pakken er aktivt vedlikeholdt med RSC-støtte (`/rsc`-subpath). Hvis det dør senere kan vi migrere til `@next/mdx` eller `contentlayer-style` build-step. API-overflaten vi bruker (`MDXRemote source={...} components={...}`) er stabil.
- **[Risk] Compile-på-request kan være tregt for mange poster** → Mitigation: `force-static` + `generateStaticParams` betyr compile skjer build-time, ikke per-request. Ingen runtime-cost. For mange (50+) poster kan vi cache MDX-output i `.next/cache/` automatisk.
- **[Risk] zod-validering kaster ved første ugyldig post → hele blogg-bygg crasher** → Mitigation: Det er ønsket oppførsel ("build-time fail med tydelig melding"). En typo i en frontmatter-felt skal fanges før deploy, ikke i prod.
- **[Risk] Forsidens `BlogStrip` blir async (det er den allerede) men avhenger nå av disk-IO** → Mitigation: `BlogStrip` er allerede server component (async). Disk-IO er rask på build-time. Ingen merkbar effekt.
- **[Risk] `t().blog_posts`-fjerning kan brekke andre konsumenter** → Mitigation: Grep verifiserer at kun `BlogStrip` bruker det. Hvis et annet sted finnes, må det også oppdateres.
- **[Risk] `next-mdx-remote/rsc` kan ha edge-case-feil med Turbopack i Next 16** → Mitigation: Verifiseres tidlig i implementeringen (task 1.3). Hvis det feiler, fall tilbake til `@next/mdx` med en plan B (krever konfig-endring i `next.config.ts`, ikke kode-refaktorering).
- **[Risk] Drop-cap på første paragraf er CSS-only og kan se rart ut hvis post starter med `<Stamp>` eller `<Pullquote>` i stedet for vanlig p** → Mitigation: Drop-cap-CSS bruker `:first-of-type` på `.prose > p`, ikke `:first-child`. Hvis post starter med en komponent, hopper drop-cap til første vanlige paragraf. Akseptert oppførsel.
- **[Risk] Frontmatter-fail ved en seed-post stopper hele dev-server** → Mitigation: Vi skriver seed-posts forsiktig med valid frontmatter. Hvis det skjer, feilmeldingen sier hvilken fil og felt — enkelt å fikse.

## Migration Plan

Brownfield. Roll-back: `git revert` av implementeringscommit. Ingen DB-skjema-endringer, ingen data å håndtere. Sekvens:

1. Installer deps (`next-mdx-remote`, `gray-matter`, `zod`).
2. Verifiser at MDX rendres via `next-mdx-remote/rsc` med en minimal test-post.
3. Skriv `schema.ts`, `posts.ts`, `mdx-components.tsx`, `reading-time.ts`.
4. Skriv `/blogg/page.tsx` + `.module.css`.
5. Skriv `/blogg/[slug]/page.tsx` + `.module.css`.
6. Skriv 2-3 seed-poster.
7. Modifiser `BlogStrip` + fjern `t().blog_posts`.
8. Verifisering: `npx tsc --noEmit`, `npm run dev`, hit `/blogg`, hit `/blogg/[slug]` for hver seed-post, hit `/` for å sjekke BlogStrip.

## Open Questions

- **Cover-bilder med `next/image`-optimalisering eller `<img>`?** — Forslag: vanlig `<img>` for nå siden vi ikke har ekte cover-bilder. Senere change kan oppgradere hvis Geir vil ha optimalisering.
- **Drop-cap aktiveres automatisk eller via MDX-komponent?** — Forslag: automatisk via CSS (`.prose > p:first-of-type::first-letter`) for å holde det estetisk konsistent. Geir kan skru av per-post hvis det blir påtrengende (men det er det ikke for nå).
- **Skal `Pullquote`-komponenten ligge i `src/components/shared/` (gjenbrukbar) eller `src/lib/blog/`?** — Forslag: `src/lib/blog/` for nå (kun blog bruker den). Hvis manifest-page eller en annen rute trenger det senere, flyttes den.
- **`stua_thread`-felt: bruke slug eller full URL?** — Forslag: slug (`elgjakta-2025`), bygges til `/stua/${slug}` i template. Konsistent med post-slug-konvensjonen.
- **Skal vi parse YAML-datoer som `Date`-objekter eller beholde som strings?** — Forslag: zod parser dem som strings (regex-validert ISO-format), formatering til menneskelesbar tekst skjer i templatet. Strings sorterer korrekt ved `localeCompare` siden ISO YYYY-MM-DD er leksikografisk = kronologisk.
