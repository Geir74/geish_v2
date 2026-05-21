# blog Specification

## Purpose
TBD - created by archiving change e2-blog-engine. Update Purpose after archive.
## Requirements
### Requirement: MDX-pipeline via next-mdx-remote/rsc

Prosjektet SHALL ha en filbasert MDX-pipeline der hver blog-post er en `.mdx`-fil under `src/content/posts/`. Pipelinen MUST bruke `next-mdx-remote/rsc` for kompilering, `gray-matter` for YAML-frontmatter-parsing, og `zod` for skjema-validering. Ingen DB-tilkobling involveres.

Filer i `src/content/posts/` SHALL:
- Ha `.mdx`-utvidelse.
- Inneholde YAML-frontmatter på toppen (`--- ... ---`).
- Ha resten som Markdown/MDX-brødtekst.

Pipelinen SHALL ikke registrere `.mdx` som `pageExtensions` i `next.config.ts` (det er @next/mdx-mønsteret som vi *ikke* bruker). MDX-filene er rene innholdsfiler, ikke ruter.

#### Scenario: MDX-fil rendres på /blogg/[slug]
- **WHEN** en gyldig `.mdx`-fil legges i `src/content/posts/` og dev-server kjører
- **THEN** den blir tilgjengelig på `/blogg/<filnavn-uten-mdx>` og rendres med Newsreader-typografi

#### Scenario: MDX kan bruke designsystem-komponenter
- **WHEN** en `.mdx`-fil inkluderer `<Stamp>FERDIG</Stamp>` i brødteksten
- **THEN** den rendrer en `<Stamp>`-komponent fra `@/components/shared` med korrekt styling

### Requirement: Frontmatter-skjema og build-time validering

Hver post SHALL ha YAML-frontmatter som matcher schema:

| Felt | Type | Påkrevd | Beskrivelse |
|------|------|---------|-------------|
| `title` | string | ja | Postens tittel |
| `tag` | string | ja | Én tag (f.eks. `"manifest"`, `"tech"`, `"liv"`) |
| `excerpt` | string | ja | Kort sammendrag, vises i liste og meta |
| `published` | string | ja | ISO date `YYYY-MM-DD` |
| `draft` | boolean | nei (default `false`) | Hvis `true`, skjules i prod-lista |
| `readTimeMin` | number | nei (auto-utledes) | Lese-tid i minutter; default = `ceil(ord / 200)` |
| `coverImage` | string | nei | Relativ sti til cover-bilde; fall til HalftoneBlock-dekor |
| `stua_thread` | string | nei | Slug for spesifikk Stua-tråd; fall til `/stua` |

Validering MUST utføres ved første read av posten (typisk build-time via `getAllPosts()` eller `getPostBySlug()`). Ugyldig eller manglende påkrevd felt MUST kaste en feil med tydelig melding som identifiserer filnavnet og det problematiske feltet. Feilen SHALL ikke bli stille (returnere `null` eller hoppe over posten) — vi vil at slike feil oppdages før deploy.

Slug utledes fra filnavnet (`hvorfor-jeg-sluttet-aa-scrolle.mdx` → `hvorfor-jeg-sluttet-aa-scrolle`). Filnavn MUST være ASCII-only (konvensjon: `æ → ae`, `ø → oe`, `å → aa`). Ingen `slug`-felt i frontmatter.

#### Scenario: gyldig frontmatter passerer validering
- **WHEN** en `.mdx`-fil med komplett frontmatter (`title`, `tag`, `excerpt`, `published`) leses
- **THEN** `getAllPosts()` returnerer en `Post`-instans med korrekt typede felt

#### Scenario: ugyldig frontmatter feiler build-time
- **WHEN** en `.mdx`-fil mangler `tag`-feltet eller har `published: "ikke-en-dato"`
- **THEN** `getAllPosts()` kaster en `Error` med melding som inkluderer filnavnet og hvilket felt som er ugyldig

#### Scenario: slug utledes fra filnavn
- **WHEN** fila `src/content/posts/elgjakta-2025.mdx` parses
- **THEN** `post.slug === "elgjakta-2025"`

#### Scenario: draft-poster skjules i produksjon
- **WHEN** en post har `draft: true` og `NODE_ENV === "production"`
- **THEN** `getAllPosts()` inkluderer ikke posten i resultatet

#### Scenario: draft-poster vises i dev
- **WHEN** en post har `draft: true` og `NODE_ENV !== "production"`
- **THEN** `getAllPosts()` inkluderer posten (slik at Geir kan preview)

### Requirement: Content-API med getAllPosts, getPostBySlug, getAllSlugs

`src/content/posts.ts` SHALL eksportere tre typesikre, server-side funksjoner:

- `getAllPosts(): Promise<Post[]>` — leser alle `.mdx`-filer, validerer frontmatter, sorterer etter `published` (nyeste først), ekskluderer drafts i prod.
- `getPostBySlug(slug: string): Promise<{ post: Post; mdxSource: string } | null>` — returnerer post + rå MDX-content for kompilering, eller `null` hvis ikke funnet.
- `getAllSlugs(): Promise<string[]>` — returnerer alle non-draft slugs, brukes av `generateStaticParams`.

`Post`-typen MUST eksporteres og inneholde alle frontmatter-felt + utledet `slug` + alltid-satt `readTimeMin`.

#### Scenario: getAllPosts returnerer sortert
- **WHEN** flere `.mdx`-filer finnes med ulike `published`-datoer
- **THEN** `getAllPosts()` returnerer arrayet sortert nyeste-først

#### Scenario: getPostBySlug returnerer null for ukjent slug
- **WHEN** `getPostBySlug("finnes-ikke")` kalles
- **THEN** returneres `null` (ikke kaster)

#### Scenario: getAllSlugs returnerer slugs for static generation
- **WHEN** `getAllSlugs()` kalles
- **THEN** returneres en `string[]` med alle non-draft post-slugs

### Requirement: /blogg-liste rendrer masthead, hero, arkiv, sidebar

`src/app/blogg/page.tsx` SHALL være en static (`force-static`) server component som rendrer:

1. **Brødsmule-strip**: `geish.no / BLOGGEN`. Høyre: count av poster + drafts + "OPPDATERT [dato]".
2. **Masthead**: h1 "Bloggen.\nLange tanker." (siste linje i stempel-rød `--stamp`), deck i Newsreader italic, "UTGAVE №N · [dato]" i mono høyrejustert. Double-line ink-border under.
3. **Hero-post** (først i `getAllPosts()`): 1.4fr/1fr grid med cover (`<img>` fra `post.coverImage` eller `<HalftoneBlock>` fallback) til venstre, meta + h2 (`post.title`) + excerpt + "Les hele (Nmin)"-lenke til høyre. Lenker til `/blogg/[slug]`.
4. **Arkiv-grid**: 2-kol med resten av postene. Hver: meta-linje (dato · readtime + tag i stempel-rød), h3 (`post.title` i Newsreader), excerpt (`post.excerpt` i typewriter). Dashed border-bunn mellom rader. Hver h3 lenker til `/blogg/[slug]`.
5. **Sidebar** (280px desktop, stables under feed ved <768px):
   - "Om Geir"-boks (kort tekst hentet fra `t().about.lead`).
   - Tag-cloud: alle unike tags fra alle poster, vist som `#tag<count>` i mono-bokser. Lenker til `#` (filtrering = senere).
   - Arkiv-måneder: aggregert fra `post.published` (`YYYY-MM` → "mnd ÅÅÅÅ"), sortert nyeste-først, hver med count.
   - RSS-boks: tekst "RSS · ATOM · JSON" + lenke `geish.no/feed` til `#`.

Layout-grid og media queries følger `RESPONSIVE.md`: `.body` (1fr/280px) → 1fr stablet ved <768px; `.hero-post` (1.4fr/1fr) → 1fr ved <768px; `.archive` (1fr/1fr) → 1fr ved <480px. Mega-headings via `clamp()` med max = desktop-verdi.

Tom-tilstand: hvis `getAllPosts().length === 0`, vis en stor `<UnderConstructionBanner>` i stedet for hero+arkiv (per `02-PAGES.md`-mønsteret), behold masthead + sidebar.

#### Scenario: /blogg returnerer 200 med seed-poster
- **WHEN** `npm run dev` kjøres og GET sendes til `/blogg`
- **THEN** responsen er 200, masthead viser h1 og UTGAVE-meta, hero-post viser første post (`getAllPosts()[0]`), arkiv-grid viser resten

#### Scenario: tag-cloud aggregerer fra poster
- **WHEN** tre poster har `tag: "tech"` og to har `tag: "liv"`
- **THEN** tag-cloud viser `#tech<3>` og `#liv<2>` (eller tilsvarende rendering)

#### Scenario: arkiv-måneder aggregerer
- **WHEN** to poster har `published: 2026-05-...` og en har `published: 2026-04-...`
- **THEN** arkiv-listen viser "mai 2026 · 2" og "apr 2026 · 1"

#### Scenario: tom blogg viser UC-banner
- **WHEN** ingen `.mdx`-filer finnes i `src/content/posts/` (eller alle er drafts i prod)
- **THEN** `/blogg` rendrer masthead + sidebar + `<UnderConstructionBanner>` i feed-området

### Requirement: /blogg/[slug]-enkeltpost rendrer MDX-brødtekst

`src/app/blogg/[slug]/page.tsx` SHALL være en static server component med `generateStaticParams` fra `getAllSlugs()` og `generateMetadata` for OpenGraph. Rendrer:

1. **Brødsmule-strip**: `geish.no / BLOGGEN / [slug]`.
2. **Post-header**: meta-linje (publisert-dato · readtime · tag i stempel-rød), h1 (`post.title`, Newsreader/Display, clamp(36px, 6vw, 64px)), excerpt-deck (Newsreader italic 19px).
3. **MDX-brødtekst**: rendres via `<MDXRemote source={mdxSource} components={mdxComponents} />`. Newsreader 18px line-height 1.6. Drop-cap på første paragraf (`.prose > p:first-of-type::first-letter`). Designsystem-komponenter (`Stamp`, `HalftoneBlock`, `Pullquote`) er tilgjengelige.
4. **Bunn-blokk**: "Diskuter i Stua →"-lenke. Hvis `post.stua_thread` satt, lenker til `/stua/${post.stua_thread}`; ellers `/stua`. (Begge ruter 404-er inntil E4 lander Stua.)

Ugyldig slug → `notFound()`.

Layout: enkel sentrert kolonne (`max-width: 720px`, `margin: 0 auto`). Responsivt fra start — padding krymper ved <480px.

#### Scenario: /blogg/[slug] returnerer 200 for gyldig slug
- **WHEN** en seed-post `elgjakta-2025.mdx` finnes og GET sendes til `/blogg/elgjakta-2025`
- **THEN** responsen er 200, post-header viser title + dato + tag, MDX-brødtekst rendres

#### Scenario: ugyldig slug returnerer 404
- **WHEN** GET sendes til `/blogg/finnes-ikke`
- **THEN** Next.js returnerer 404 via `notFound()`

#### Scenario: stua-lenke med stua_thread
- **WHEN** posten har `stua_thread: "elgjakta-2025-tradd"` i frontmatter
- **THEN** bunn-blokken har en lenke til `/stua/elgjakta-2025-tradd`

#### Scenario: stua-lenke uten stua_thread defaultes
- **WHEN** posten ikke har `stua_thread` i frontmatter
- **THEN** bunn-blokken har en lenke til `/stua`

#### Scenario: generateStaticParams genererer alle non-draft slugs
- **WHEN** Next.js bygger appen
- **THEN** `generateStaticParams` returnerer `Array<{ slug: string }>` for hver non-draft post

### Requirement: MDX-komponenter eksponert til posts

`src/lib/blog/mdx-components.tsx` SHALL eksportere et `mdxComponents`-objekt som passes til `<MDXRemote components={...}>`. Det MUST inneholde:

- `Stamp` (re-eksport fra `@/components/shared`).
- `HalftoneBlock` (re-eksport fra `@/components/shared`).
- `Pullquote` (re-eksport fra `@/components/shared`). Var opprinnelig i `src/lib/blog/Pullquote/`, flyttet til shared i `e2-manifest` siden to ruter (blog enkeltposter + manifest) bruker den.

Prose-styling for HTML-elementer (`h2`, `h3`, `h4`, `p`, `a`, `blockquote`, `code`, `pre`, `ul`, `ol`, `li`) skjer via `.prose`-klassen på MDXRemote-wrapperen i [slug]-page, ikke via direkte komponentmapping i `mdxComponents`. CSS Module-en `src/lib/blog/prose.module.css` er kilden.

Andre shared-komponenter (`GuestbookSnippet`, `WebringWidget`, `VisitorCounter`, `UnderConstructionBanner`, `ImagePlaceholder`, `StatusBadge`) eksponeres IKKE til MDX — de hører ikke hjemme i brødtekst.

#### Scenario: Pullquote importeres fra shared
- **WHEN** `src/lib/blog/mdx-components.tsx` inspiseres
- **THEN** Pullquote-importen kommer fra `@/components/shared`, ikke fra `./Pullquote`

#### Scenario: Stamp brukbar i MDX
- **WHEN** en post inneholder `<Stamp>Ferdig</Stamp>`
- **THEN** elementet rendres som en rød double-border stempel

#### Scenario: Pullquote brukbar i MDX
- **WHEN** en post inneholder `<Pullquote>Sitat-tekst</Pullquote>`
- **THEN** elementet rendres som et sentrert Archivo Black sitat med stempel-rød kant

#### Scenario: blockquote stylet med dashed border
- **WHEN** en post inneholder vanlig Markdown blockquote (`> tekst`)
- **THEN** elementet rendres med venstre dashed border og Newsreader italic (via `.prose`-stylingen i `prose.module.css`)

### Requirement: readTime utledes fra ordtelling med override-mulighet

Hvis frontmatter ikke har `readTimeMin`, MUST det utledes fra brødteksten: `Math.max(1, Math.ceil(words / 200))` der `words` er antall whitespace-separerte tokens i MDX-content (etter å ha strippet enkelt Markdown-syntaks `# * _ \` > - [ ] ( )`).

Hvis frontmatter har `readTimeMin`, vinner det over utledet verdi.

#### Scenario: readTime utledes for kort post
- **WHEN** en post har ~600 ord i brødteksten og ingen `readTimeMin` i frontmatter
- **THEN** `post.readTimeMin === 3` (600/200 = 3)

#### Scenario: frontmatter-readTime vinner
- **WHEN** en post har `readTimeMin: 10` i frontmatter (overstyrer auto-beregning)
- **THEN** `post.readTimeMin === 10`

### Requirement: Responsive bloggruter per RESPONSIVE.md

Alle bloggruter SHALL være lesbare og ikke sprenge horisontal scroll ved 320px viewport. Følgende grids kollapser:

- `.body` (feed/sidebar) på `/blogg`: `1fr 280px` ≥768 → `1fr` <768.
- `.hero-post` (cover/text): `1.4fr 1fr` ≥768 → `1fr` <768.
- `.archive` (poster i grid): `1fr 1fr` ≥768 → `1fr` <480.
- `.masthead` (h1/issue): `1fr auto` ≥768 → `1fr` <768.

Mega-headings bruker `clamp(min, vw, max)`:
- Masthead h1: `clamp(40px, 8vw, 92px)`.
- Hero-post h2: `clamp(28px, 4.2vw, 48px)`.
- Single-post h1: `clamp(36px, 6vw, 64px)`.

Brødtekst (`--font-serif`) holdes på 17–19px (kanonisk lesestørrelse per `02-PAGES.md`).

#### Scenario: /blogg leser på 320px
- **WHEN** GET sendes til `/blogg` ved 320px viewport
- **THEN** ingen horisontal scroll; feed og sidebar stables vertikalt; arkiv-grid 1 kolonne

#### Scenario: /blogg/[slug] leser på 320px
- **WHEN** GET sendes til `/blogg/[slug]` ved 320px viewport
- **THEN** ingen horisontal scroll; post-h1 skalerer ned via clamp; brødtekst er 18px Newsreader

#### Scenario: desktop er uendret avis-estetikk
- **WHEN** GET sendes ved ≥1280px viewport
- **THEN** masthead h1 er 92px, hero-post er 1.4fr/1fr split, double-line border under masthead, tags i stempel-rød

