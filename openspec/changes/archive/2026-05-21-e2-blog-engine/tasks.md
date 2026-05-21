## 1. Dependencies + MDX-verifisering (decision gate)

- [x] 1.1 Installer deps: `npm i next-mdx-remote gray-matter zod` + `npm i -D @types/mdx` (oppdaget under verifisering — `mdx/types` trengs for `MDXComponents`-typen).
- [x] 1.2 **Decision gate passed.** Minimal test (`src/app/mdx-test/page.tsx` + `__mdx-test.mdx`) verifiserte at next-mdx-remote/rsc + gray-matter rendrer en `<Stamp>FERDIG</Stamp>` fra MDX under Turbopack i Next 16. HTTP 200, Stamp-module CSS-klasser tilstede, frontmatter parses. Funn: gray-matter auto-konverterer YAML-datoer til JS `Date` — schema håndterer både string og Date.
- [x] 1.3 Test-filer slettet etter verifisering.

## 2. Frontmatter-skjema og helpers

- [x] 2.1 `src/lib/blog/schema.ts` med zod-schema. `published` aksepterer `string | Date` og normaliserer til `"YYYY-MM-DD"` (gray-matter-quirk).
- [x] 2.2 `src/lib/blog/reading-time.ts` med `deriveReadTime(content)` — 200 wpm, Math.ceil, minst 1.
- [x] 2.3 `src/lib/blog/aggregate.ts` med `aggregateTags(posts)` og `aggregateMonths(posts)` for sidebar.

## 3. Content-API

- [x] 3.1 `src/content/posts.ts` med `getAllPosts()`, `getPostBySlug(slug)`, `getAllSlugs()`. Frontmatter-validering kaster med fil + felt ved feil.
- [x] 3.2 Validert at ugyldig seed-post ville kaste — ingen ugyldige poster i scope.

## 4. MDX-komponenter

- [x] 4.1 `src/lib/blog/Pullquote/index.tsx` + `.module.css` — Archivo Black clamp(20, 3vw, 26), stempel-rød double-border, sentrert.
- [x] 4.2 `src/lib/blog/prose.module.css` — Newsreader 18px, mono code, dashed blockquote, drop-cap på `:first-of-type p`.
- [x] 4.3 `src/lib/blog/mdx-components.tsx` med Stamp + HalftoneBlock + Pullquote. HTML-mapping skjer via `.prose`-klassen på wrapperen i [slug]-page (CSS Module = kilden).

## 5. /blogg-liste

- [x] 5.1 `src/app/blogg/page.tsx` — async server, force-static, henter posts + aggregerer tags/måneder.
- [x] 5.2 `src/app/blogg/page.module.css` — masthead med double-line border, hero-post 1.4fr/1fr, archive 2-kol, sidebar. Responsiv kollaps per RESPONSIVE.md.
- [x] 5.3 Tom-tilstand: UC-banner i feed-området hvis ingen poster.
- [x] 5.4 RSS-boks bruker tekst "RSS · ATOM · JSON" — ingen 📡-emoji (forbudslisten).

## 6. /blogg/[slug]-enkeltpost

- [x] 6.1 `src/app/blogg/[slug]/page.tsx` med `generateStaticParams` + `generateMetadata`.
- [x] 6.2 `MDXRemote` rendres med `mdxComponents`, wrappet i `.prose`-klassen.
- [x] 6.3 Stua-lenke bruker `post.stua_thread` med fallback til `/stua`.
- [x] 6.4 `src/app/blogg/[slug]/page.module.css` — sentrert kolonne (`max-width: 760px`), header med double-line bottom-border, stua-bunn-blokk med stempel-rød lenke. Responsiv padding.

## 7. Seed-poster

- [x] 7.1 `hvorfor-jeg-sluttet-aa-scrolle.mdx` — manifest-tag, har `stua_thread: "manifest-snakk"`, inneholder `<Pullquote>`.
- [x] 7.2 `subdomener-uten-aa-miste-forstanden.mdx` — tech-tag, kodeblokk + `<HalftoneBlock>` i brødtekst.
- [x] 7.3 `broed-nummer-47.mdx` — liv-tag, inneholder `<Stamp>BRØD 47</Stamp>`.
- [x] 7.4 Ingen seed-post har `coverImage` — alle bruker HalftoneBlock-fallback. Én har `stua_thread` (post 1).

## 8. Koble forsidens BlogStrip + rydd content-modulet

- [x] 8.1 `BlogStrip` async, henter fra `getAllPosts()`, lenker per `/blogg/[slug]`, viser `readTimeMin`. Tom-fallback intakt.
- [x] 8.2 `blog_posts`-feltet fjernet fra `src/content/locales/no.ts` (erstattet med kommentar som peker mot MDX-pipelinen).
- [x] 8.3 TS-feil ville fanget eventuelle gjenværende konsumenter — TSC rent.

## 9. Verifisering

- [x] 9.1 `npx tsc --noEmit` rent.
- [x] 9.2 `npm run dev` rent.
- [x] 9.3 `/blogg` 200, masthead/hero/arkiv/sidebar rendres, tags og måneder aggregeres.
- [x] 9.4 `/blogg/hvorfor-jeg-sluttet-aa-scrolle` 200, Pullquote-module rendret, "Diskuter i Stua"-lenke peker til `/stua/manifest-snakk`.
- [x] 9.5 `/blogg/subdomener-uten-aa-miste-forstanden` 200, kodeblokk + HalftoneBlock rendres.
- [x] 9.6 `/blogg/broed-nummer-47` 200, `<Stamp>BRØD 47</Stamp>` rendret med Stamp-module CSS.
- [x] 9.7 `/blogg/finnes-ikke` 404.
- [x] 9.8 `/` 200, BlogStrip viser de 3 seed-postene med korrekte titler + datoer + slug-lenker.
- [x] 9.9 BlogStrip-clip lenker til `/blogg/<slug>` (verifisert via HTML-grep).
- [ ] 9.10 Visuell sammenligning på flere bredder — utføres av Geir i nettleser.

## 10. Forbudsliste + sanity

- [x] 10.1 Ingen `border-radius > 0` i blog-CSS.
- [x] 10.2 Ingen blur-skygger.
- [x] 10.3 Ingen `linear-gradient` (kun pre-eksisterende `repeating-linear-gradient` i shared, urørt).
- [x] 10.4 Ingen Tailwind/shadcn-referanser.
- [x] 10.5 Ingen emoji-ikoner (📡 erstattet med tekst).
- [x] 10.6 Ingen `blog_posts`-referanser i src/ utover archive.
- [x] 10.7 Ingen Drizzle/Supabase-imports i blog-koden (bekreftet databasefri).
