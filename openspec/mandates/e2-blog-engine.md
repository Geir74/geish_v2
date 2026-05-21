---
project: geish.no v2
feature: e2-blog-engine
date: 2026-05-21
type: brownfield
status: draft
---

# Mandat: E2 — Blog engine (MDX, filbasert)

## Mål

Bygg bloggens innholdslag og ruting: en filbasert MDX-pipeline der hver post er en `.mdx`-fil på disk, en `/blogg`-liste (masthead + hero-post + arkiv-grid + sidebar), og en `/blogg/[slug]`-enkeltpost. Helt databasefritt — poster er filer, ingen kommentarer (samtale lenkes til Stua). Dette er Change 1 av epic E2; `e2-manifest` (manifestet som egen side + første post) er Change 2.

## Bakgrunn

E1 + E1.5 ga forsiden, designsystemet og responsiv-mønsteret. Forsidens `BlogStrip` leser i dag seed-data fra content-modulet. E2 erstatter det med ekte poster fra disk og bygger de dedikerte blogg-rutene. Bloggen er definert i `02-PAGES.md` Side 4: avis-estetikk (double-line masthead, "UTGAVE №", tags i stempel-farge), Newsreader-brødtekst, minimum 800 ord per post, ingen algoritme.

**Arkitekturvalg (låst):** MDX-filer på disk, ikke Postgres. Holder E2 databasefritt — DB-verifisering forblir deferert til E4 der den testes mot ekte tabeller (Lærdom #0). Git er publiseringsmekanismen: skriv fil → commit → publisert.

## Scope

### Inn

- **MDX-pipeline.** Konfigurer Next.js for MDX (`@next/mdx` + nødvendige plugins). Poster bor i `src/content/posts/*.mdx`. Hver fil har frontmatter + Markdown-brødtekst som kan inneholde designsystem-komponenter (Stamp, HalftoneBlock, PullquoteBand-aktige innslag).
- **Frontmatter-skjema** (typet, validert ved parsing):
  - `title` (string, påkrevd)
  - `slug` (string — eller utledes fra filnavn; Code velger og begrunner)
  - `tag` (string, påkrevd — f.eks. "manifest", "tech", "prosjekt")
  - `excerpt` (string, påkrevd — brukes i liste + meta)
  - `published` (dato, påkrevd)
  - `draft` (boolean, default false — utkast vises ikke i prod-lista)
  - `readTimeMin` (number, valgfritt — utledes fra ordtelling hvis utelatt; Code velger)
  - `coverImage` (string, valgfritt — sti; hvis utelatt brukes HalftoneBlock som dekor per handoff-note)
  - `stua_thread` (string, valgfritt — URL/slug til en spesifikk Stua-tråd for diskusjon)
- **Content-API** (`src/content/posts.ts` el.l.): typesikre funksjoner — `getAllPosts()` (sortert nyeste først, ekskluderer drafts i prod), `getPostBySlug(slug)`, `getAllSlugs()` (for static generation). Frontmatter parses og valideres; en post med ugyldig/manglende påkrevd felt feiler byggetid med en tydelig feilmelding, ikke i runtime.
- **`/blogg`-liste** (`src/app/blogg/page.tsx`), per 02-PAGES Side 4: brødsmule-strip, masthead (headline + deck + "UTGAVE №" + dato + double-line border), hero-post (`posts[0]` — 1.4fr/1fr split, cover/halftone + meta + h2 + excerpt + les-lenke), arkiv-grid (`posts[1..]` — 2-kol, meta + h3 + excerpt, dashed border mellom rader), og sidebar (Om Geir-boks, tag-cloud aggregert fra poster, arkiv-måneder aggregert fra poster, RSS-boks).
- **`/blogg/[slug]`-enkeltpost** (`src/app/blogg/[slug]/page.tsx`): brødsmule, post-header (tag + dato + readtime + h1 + excerpt/deck), MDX-brødtekst rendret med Newsreader-typografi (drop-cap-mulighet, pullquotes), og bunn-blokk med "Diskuter i Stua →"-lenke (spesifikk hvis `stua_thread` satt, ellers `/stua`). `generateStaticParams` fra `getAllSlugs()`. `generateMetadata` for title/description.
- **Koble forsidens `BlogStrip` til ekte poster.** `BlogStrip` leser nå `getAllPosts().slice(0,3)` i stedet for seed fra content-modulet. Tom-fallback (UC-banner) beholdes hvis ingen poster finnes.
- **Seed-poster:** 2–3 ekte/dummy MDX-poster så listen og enkeltposten kan reviewes med innhold. (Manifestet som post kommer i Change 2 — ikke dupliser det her.)
- **Mobil-bevisst fra start:** følg `src/styles/RESPONSIVE.md`. Bloggens grids (hero 1.4fr/1fr, arkiv 2-kol, feed/sidebar 1fr/280px) kollapser per oppskriften (→ 1-kol på mobil). Bruk clamp() for mega-headings (masthead, hero h2), ikke hardkodede px. Demp-rotasjon via `--chaos` arves automatisk.

### Ut

- **Manifestet + `/manifest`-siden** — Change 2 (`e2-manifest`).
- **Postgres / `posts`-tabell** — bevisst ikke brukt; poster er filer.
- **Kommentarer** — finnes ikke; samtale lenkes til Stua.
- **Stua selv** (`/stua`, tråder) — E4. Stua-lenken peker dit og 404-er inntil da.
- **Tag-/arkiv-filtrering som egne ruter** (`/blogg/tag/[tag]`, `/blogg/[år]/[måned]`) — tag-cloud og arkiv-liste *vises* (aggregert fra poster), men klikkbar filtrering til egne ruter er ut av scope for nå. Lenkene kan peke til `#` eller en query-param som filtrerer klientside — Code foreslår enkleste ikke-route-baserte løsning, eller utelater filtrering og viser dem som ren visning.
- **RSS-feed-generering** (`/feed.xml`) — RSS-boksen *vises* i sidebar, men selve feed-endepunktet er en egen senere change (det er ikke trivielt og fortjener egen vurdering). Boksen kan peke til `#` inntil da.
- **Ekte cover-bilder** — placeholder/HalftoneBlock holder; bildehåndtering er senere.
- **Endring av tokens, shared-komponenter, DB/Supabase-laget.**

## Delta-type

**Type:** brownfield

Ny `blog`-capability (ADDED). Berører `homepage`-capability (MODIFIED — `BlogStrip` leser ekte poster i stedet for seed). Bygger på E1-design-system + E1.5 responsiv-mønster.

## Suksesskriterier

- [ ] MDX-pipeline fungerer: en `.mdx`-fil i `src/content/posts/` med gyldig frontmatter rendres på `/blogg/[slug]`.
- [ ] Ugyldig/manglende påkrevd frontmatter feiler ved byggetid med tydelig melding, ikke i runtime.
- [ ] `/blogg` viser masthead, hero-post, arkiv-grid og sidebar per 02-PAGES Side 4.
- [ ] `/blogg/[slug]` viser post med Newsreader-brødtekst og "Diskuter i Stua"-lenke (spesifikk hvis `stua_thread` satt, ellers `/stua`).
- [ ] MDX-brødtekst kan bruke designsystem-komponenter (minst Stamp + ett til verifisert i en seed-post).
- [ ] Forsidens `BlogStrip` viser de 3 nyeste ekte postene; tom-fallback intakt.
- [ ] Drafts (`draft: true`) skjules i prod-lista.
- [ ] Bloggrutene er responsive 320px+ per RESPONSIVE.md; desktop matcher 02-PAGES-estetikken.
- [ ] `npx tsc --noEmit` rent; `npm run dev` rent; `/blogg` og `/blogg/[slug]` returnerer 200.
- [ ] Ingen Postgres-tilkobling introdusert; ingen kommentar-funksjonalitet.

## Constraints

- **Filbasert, ikke DB.** Poster er `.mdx` på disk. Ingen `posts`-tabell, ingen Drizzle-spørringer for blogg. (Avvik fra handoffens §5 som nevner en `posts`-tabell — vi velger fil-strategien handoffen selv tilbyr som alternativ.)
- **Ingen kommentarer.** Samtale lenkes til Stua. Ikke bygg innsending/moderering.
- Bygg på `e1-design-system` (tokens, shared-komponenter) + følg `RESPONSIVE.md`. Ingen Tailwind/shadcn, CSS-variabler + CSS Modules.
- Avis-estetikken i 02-PAGES er autoritativ: double-line masthead, "UTGAVE №", Newsreader 17–19px brødtekst (ikke mindre), tags i stempel-farge. `references/pages.jsx` `PageBlogg` er designreferanse — oversettes til React + CSS Modules, kopieres ikke rått.
- Forbudslisten §8 gjelder.
- Mobil-bevisst fra start (RESPONSIVE.md) — ikke en desktop-only-runde som må fikses i en E2.5.
- Rause norske kommentarer.

## Kontekst for Code

- **Repo:** `C:\kode\geish_v2`. E1 + E1.5 levert: tokens, 8 shared-komponenter, forside (responsiv 320px+), `RESPONSIVE.md`, content-modul (`src/content/i18n.ts` + `locales/no.ts`). Drizzle/Supabase wired men ubrukt av blogg.
- **Autoritativ design:** `C:\Users\geirh\OneDrive\GRIM\03 Projects\geish 2.0\design_handoff_geish\` — `02-PAGES.md` Side 4 (Bloggen: layout, datakilder, interaksjoner, designnotater), `references/pages.jsx` `PageBlogg`. `03-IMPLEMENTATION.md` §4 (MDX-strategi) og §5 (frontmatter-felt — men VI bruker fil-strategien, ikke posts-tabellen).
- **MDX i Next.js:** følg offisiell `@next/mdx`-oppsett. Verifiser at det fungerer med Turbopack i Next 16 (samme forbehold som PostCSS-vurderingen i E1.5 — sjekk og begrunn valg av plugin-oppsett).
- **`stua_thread`-lenker** 404-er inntil E4 lager Stua — samme mønster som forsidens ennå-ikke-eksisterende ruter. Ingen stub-ruter.
- **Avvik fra `03-IMPLEMENTATION.md` står fast:** npm, `src/`, Supabase (ikke pnpm/Vercel Postgres/NextAuth), og blogg er filbasert (ikke posts-tabell).

## Åpne spørsmål

<!-- Code avklarer i proposal/design. -->

- **Slug-strategi:** utled fra filnavn (`hvorfor-jeg-sluttet-aa-scrolle.mdx` → slug) eller eksplisitt `slug`-felt i frontmatter? Code anbefaler, med tanke på æøå-håndtering.
- **MDX-komponenter i scope:** hvilke designsystem-komponenter eksponeres til MDX (via `mdx-components.tsx`)? Forslag: Stamp, HalftoneBlock, og en enkel pullquote — Code foreslår settet.
- **`readTimeMin`:** utledes fra ordtelling automatisk, eller frontmatter-felt? Forslag: utled (ord / 200), med frontmatter-override.
- **Tag-cloud/arkiv-filtrering:** ren visning nå (ikke klikkbar), klientside-filtrering, eller utelat til en senere filtrering-change? Forslag: ren visning, lenker til `#`, filtrering som egen senere change.
- **`@next/mdx` vs. `next-mdx-remote`:** filbaserte poster passer `@next/mdx` (import) eller `next-mdx-remote` (les fil → kompiler). Code velger basert på hva som gir best frontmatter-validering ved byggetid.
