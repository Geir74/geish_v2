## 1. Flytt Pullquote til shared

- [x] 1.1 `src/components/shared/Pullquote/index.tsx` opprettet (kopi av blog-versjon med oppdatert header-kommentar).
- [x] 1.2 `src/components/shared/Pullquote/Pullquote.module.css` opprettet.
- [x] 1.3 `src/components/shared/index.ts` oppdatert — `Pullquote` + `PullquoteProps` re-eksportert.
- [x] 1.4 `src/lib/blog/mdx-components.tsx` oppdatert — Pullquote-importen konsolidert med øvrige shared-imports.
- [x] 1.5 `src/lib/blog/Pullquote/`-mappen slettet.
- [x] 1.6 `npx tsc --noEmit` rent. `/blogg/hvorfor-jeg-sluttet-aa-scrolle` verifisert — Pullquote-module CSS-klassen rendres fortsatt (samme klassesignatur som før flytting).

## 2. Manifest content-fil

- [x] 2.1 `src/content/manifest.mdx` skrevet — frontmatter `lastUpdated: 2026-05-19`, alle 6 prosa-seksjoner ordrett fra kilden, 4 `<Pullquote>`-tags, ingen TL;DR-liste eller end-blokk i body.

## 3. Manifest content-API

- [x] 3.1 `src/lib/manifest/content.ts` opprettet med `getManifest()`, zod-validert frontmatter, gjenbruker `deriveReadTime` fra blog.
- [x] 3.2 Verifisert at validering kaster ved feilformatert dato (samme zod-pattern som blog-schema).

## 4. /manifest-rute: page.tsx

- [x] 4.1 `src/app/manifest/page.tsx` opprettet — async server component, force-static, generateMetadata.
- [x] 4.2 Splash-seksjon: kicker, h1 med to linjer ("Stay Grounded," / "and Create Shit" med `--stamp`-aksent), deck, stamprow med 3 stempler (-4°/+3°/-2°).
- [x] 4.3 TL;DR-boks: `TLDR_POINTS`-konstant med 6 punkter, label + ul.
- [x] 4.4 MDX-body wrappet i `.prose`-div.
- [x] 4.5 End-blokk: credo h2, endLead, CTA-rad (3 lenker som 404-er), sign-off-prosa (inkl. `🚧`), `<WebringWidget variant="bar">`.

## 5. /manifest-rute: page.module.css

- [x] 5.1 `src/app/manifest/page.module.css` skrevet — alle 4 strukturelle blokker (crumb, splash, body med tldr + prose, end) inkl. double-line borders, drop-cap, prose-styling.
- [x] 5.2 Media queries for `<768px` og `<480px` — padding krymper, drop-cap skaleres, prose 18px på smal mobil.

## 6. Verifisering

- [x] 6.1 `npx tsc --noEmit` rent.
- [x] 6.2 `npm run dev` rent.
- [x] 6.3 `/manifest` returnerer 200.
- [x] 6.4 Innholdsverifisering via grep:
  - Splash: kicker + h1 med "Stay Grounded,"/"Create Shit" + deck + alle 3 stempler ✓
  - TL;DR: label + "500 venner", "tre innlegg er mer verdt", "Under Construction er en livsstil", "AI som du styrer" ✓
  - MDX-body: "Åpne Facebook. Gå videre. Jeg venter." (drop-cap-paragraf) ✓
  - 4 Pullquote-module CSS-klasser + alle 4 sitat-strenger ✓
  - End-blokk: alle 3 CTA-lenker, "Skrevet av en fyr", "under construction. Alltid" ✓
  - Webring-bar med "NORDIC RING" rendret ✓
- [x] 6.5 Forside-lenker treffer manifest (verifisert ved at `/manifest` eksisterer som 200 — ManifestCut/IntroNote sine `<Link href="/manifest">` peker dit).
- [x] 6.6 Blog Pullquote OK: `/blogg/hvorfor-jeg-sluttet-aa-scrolle` rendrer "Du er ikke brukeren..." med Pullquote-module-klassen (samme klasse-signatur som før flytting).
- [ ] 6.7 Responsivt — utføres av Geir i nettleser (320/380/600/768/1280px viewport).

## 7. Forbudsliste + sanity

- [x] 7.1 Ingen `border-radius > 0` i manifest-CSS.
- [x] 7.2 Ingen blur-skygger.
- [x] 7.3 Ingen `linear-gradient` (verken faktiske eller repeating).
- [x] 7.4 Ingen Tailwind/shadcn-referanser.
- [x] 7.5 Ingen emoji-ikoner i komponenter (`🚧` i sign-off-prosa er bevisst zine-flair, dokumentert i design D10).
- [x] 7.6 Ingen Drizzle/Supabase-imports (databasefri).
- [x] 7.7 Ingen referanser til `lib/blog/Pullquote/` (gammel plassering fjernet; treff i grep er på forside `PullquoteBand` (annen komponent) og legitime shared-imports).
