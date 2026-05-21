## Why

E1 + E1.5 ga forsiden, designsystemet og responsiv-mønsteret. Forsidens `BlogStrip` viser hardkodet seed-data fra content-modulet; det finnes ingen `/blogg`-rute og ingen enkeltpost-rute. E2 bygger bloggens innholdslag og ruting: filbaserte `.mdx`-poster, en avis-aktig `/blogg`-liste, og `/blogg/[slug]`-enkeltposter med Newsreader-typografi.

Arkitekturen er **databasefri**: poster er filer på disk, git er publiseringsmekanismen. Det avviker bevisst fra handoffens §5 (`posts`-tabell) til fordel for fil-strategien handoffen selv tilbyr som alternativ. Holder DB-verifisering deferert til E4 der den testes mot ekte tabeller (Stua-tråder), og forenkler dette mandatet — ingen Drizzle-queries, ingen Supabase-tilkobling, ingen runtime-DB-feil-stier. Endringer: skriv `.mdx`-fil → commit → publisert.

Dette er Change 1 av epic E2. Change 2 (`e2-manifest`) bygger manifestet som egen side + en første post om/på manifestet — bygger på blog-pipelinen denne mandaten leverer.

## What Changes

- **MDX-pipeline** via `next-mdx-remote/rsc` + `gray-matter` (frontmatter-parser) + `zod` (frontmatter-validering). Poster bor i `src/content/posts/*.mdx` med YAML-frontmatter + Markdown/MDX-brødtekst. Valgt over `@next/mdx`-loader fordi det gir tydeligere build-time validering og bedre kontroll over read-from-disk-pipelinen — Turbopack-kompatibelt siden det er rene Node-pakker, ingen bundler-magi.
- **Frontmatter-skjema** (zod-validert ved parsing):
  - `title: string` (påkrevd)
  - `tag: string` (påkrevd — én tag per post)
  - `excerpt: string` (påkrevd — liste + meta)
  - `published: string` (påkrevd — ISO date `YYYY-MM-DD`, parses til `Date`)
  - `draft: boolean` (default `false`)
  - `readTimeMin: number` (valgfritt — utledes fra ordtelling i `content` hvis utelatt, ~200 wpm)
  - `coverImage: string` (valgfritt — relativ sti; fall til HalftoneBlock-dekor hvis utelatt)
  - `stua_thread: string` (valgfritt — slug for spesifikk Stua-tråd; fall til `/stua` ved utelatelse)
  - `slug` utledes fra filnavnet (`hvorfor-jeg-sluttet-aa-scrolle.mdx` → `hvorfor-jeg-sluttet-aa-scrolle`); ASCII-only filnavn er en konvensjon (æ → ae, ø → oe, å → aa) for å holde URL-er rene.
- **Content-API** `src/content/posts.ts`: typesikre, server-side funksjoner
  - `getAllPosts(): Promise<Post[]>` — sortert nyeste først, ekskluderer drafts.
  - `getPostBySlug(slug: string): Promise<{ post: Post; mdxSource: string } | null>` — for [slug]-ruten.
  - `getAllSlugs(): Promise<string[]>` — for `generateStaticParams`.
  - Frontmatter-validering: en post med ugyldig/manglende felt feiler ved første kall (build-time SSG) med en tydelig melding som identifiserer filnavn + felt.
- **`/blogg`-liste** (`src/app/blogg/page.tsx`) per `02-PAGES.md` Side 4: brødsmule-strip, masthead (h1 + deck + UTGAVE-meta + double-line border), hero-post (1.4fr/1fr split med cover/halftone + meta + h2 + excerpt + read-link), arkiv-grid (2-kol med eldre poster), og sidebar (Om Geir-boks, tag-cloud aggregert fra alle poster, arkiv-måneder aggregert, RSS-boks). Static (`force-static`) — ingen DB-kall, fil-read kjørt build-time.
- **`/blogg/[slug]`-enkeltpost** (`src/app/blogg/[slug]/page.tsx`): brødsmule, post-header (tag + dato + readTime + h1 + excerpt-deck), MDX-brødtekst rendret via `MDXRemote` med Newsreader-typografi (drop-cap-mulighet på første paragraf), og bunn-blokk med "Diskuter i Stua →"-lenke. `generateStaticParams` fra `getAllSlugs()`. `generateMetadata` for OpenGraph/SEO. Ugyldig slug → `notFound()`.
- **MDX-komponenter** som er tilgjengelige i posters brødtekst (eksponert til `MDXRemote` via en komponent-map): `Stamp`, `HalftoneBlock`, og en lokal `Pullquote`-helper (Archivo Black 26px, sentrert, stempel-rød kant). Verifiseres ved at minst én seed-post bruker `<Stamp>` og en annen `<Pullquote>`.
- **Koble forsidens `BlogStrip` til ekte poster**: leser nå `await getAllPosts()`-resultatet (slice 0..3) i stedet for `t().blog_posts`. Tom-fallback til `<UnderConstructionBanner>` beholdes. Hver clip lenker til `/blogg/[slug]`. `t().blog_posts`-feltet fjernes fra `src/content/locales/no.ts` siden ingen andre bruker det.
- **Seed-poster (2-3)** for å verifisere pipelinen: "Hvorfor jeg sluttet å scrolle" (tag manifest, koblet til `stua_thread`), "Subdomener uten å miste forstanden" (tag tech), "Brød nummer 47" (tag liv, bruker `<Stamp>` og `<Pullquote>` i MDX-brødtekst). Manifestet som post kommer i Change 2 — *ikke* dupliser her.
- **Tag-cloud + arkiv-måneder** aggregeres fra alle poster og vises i sidebar. Lenkene peker til `#` for nå — klikkbar filtrering er ut av scope (egen senere change). Dokumenteres som forventet "vis, ikke filtrer".
- **RSS-boks** vises i sidebar med lenker til `#`. Faktisk feed-endepunkt (`/feed.xml`) er egen senere change — RSS-generering fortjener egen vurdering.
- **Responsivt fra start** per `src/styles/RESPONSIVE.md`:
  - `/blogg .body` (1fr/280px) → 1fr stablet ved <768px.
  - `.hero-post` (1.4fr/1fr) → 1fr ved <768px.
  - `.archive` (1fr/1fr) → 1fr ved <480px.
  - Mega-headings (masthead 92px, hero-h2 48px, single-post h1 ~64px) → `clamp()` med max = desktop-verdi.
  - `--chaos`-dempingen arves automatisk for evt. roterte elementer.

## Capabilities

### New Capabilities
- `blog`: Filbasert MDX-blogg — content-API, `/blogg`-liste, `/blogg/[slug]`-enkeltpost, frontmatter-skjema med build-time validering, MDX-komponenter (Stamp/HalftoneBlock/Pullquote), aggregerte tag-cloud + arkiv-måneder, "Diskuter i Stua"-lenke per post, ingen DB.

### Modified Capabilities
- `homepage`: `BlogStrip` leser nå ekte poster fra `getAllPosts()` i stedet for `t().blog_posts`. `t().blog_posts`-feltet fjernes fra content-modulet. Lenkene per clip går nå til `/blogg/[slug]`, ikke `/blogg`.

## Impact

- **Avhengigheter (nye)**:
  - `next-mdx-remote` (RSC-kompatibel MDX-kompilator).
  - `gray-matter` (YAML-frontmatter-parser).
  - `zod` (runtime schema-validering med TS-type-inferens).
  - Ingen remark/rehype-plugins denne runden (GFM-tabeller, syntax-highlighting osv. utenfor scope; kan legges til senere).
- **Filsystem (nytt)**:
  - `src/content/posts/*.mdx` (2-3 seed-poster).
  - `src/content/posts.ts` (content-API).
  - `src/lib/blog/schema.ts` (zod-schema + Post-type).
  - `src/lib/blog/reading-time.ts` (ordtelling-helper).
  - `src/lib/blog/mdx-components.tsx` (komponent-map for MDXRemote + lokal Pullquote-komponent).
  - `src/app/blogg/page.tsx` + `src/app/blogg/page.module.css`.
  - `src/app/blogg/[slug]/page.tsx` + `src/app/blogg/[slug]/page.module.css`.
- **Filsystem (modifisert)**:
  - `src/components/forside/BlogStrip/index.tsx` (kobles til `getAllPosts()` — blir async).
  - `src/content/locales/no.ts` (fjerner `blog_posts`-feltet).
- **Røres ikke**: tokens, shared-komponenter, andre forside-seksjoner, DB/Supabase-laget, smoke-ruten, styleguide-ruten, RESPONSIVE.md.
- **Eksterne systemer**: ingen — alt er fil-IO server-side.
- **Ut av scope**:
  - Manifestet + `/manifest`-siden — Change 2 (`e2-manifest`).
  - Postgres `posts`-tabell — bevisst ikke brukt.
  - Kommentar-system — eksisterer ikke; samtale → Stua.
  - `/stua` selv — E4. `stua_thread`-lenker 404-er inntil da.
  - Tag-/arkiv-filtrering som egne ruter (`/blogg/tag/[tag]`, `/blogg/[år]/[måned]`) — visning kun.
  - `/feed.xml`-generering — egen senere change.
  - Ekte cover-bilder — HalftoneBlock-fallback holder.
  - GFM-tabeller, syntax-highlighting, drop-cap som automatisk (kan tillegges via custom CSS hvis Geir vil).
