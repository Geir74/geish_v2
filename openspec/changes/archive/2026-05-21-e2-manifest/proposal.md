## Why

Manifestet er prosjektets ideologiske kjerne — argumentet for hvorfor noen skulle bygge sin egen side i stedet for å bo på en plattform. Forsiden lenker dit (ManifestCut + IntroNote), blogg-posten `hvorfor-jeg-sluttet-aa-scrolle` lenker dit, men `/manifest`-ruten finnes ikke ennå. Når denne change lander treffer alle eksisterende lenker en ekte side, og epic E2 er ferdig.

Manifestet er en *egen sidetype* — ikke en bloggpost. Den har en spesifikk avis-aktig struktur: splash-åpning med stempler, TL;DR-boks for de som scroller, selve teksten med drop-caps og "ropende" pullquotes, og en end-blokk med webring-widget. Punk-standup-tonen er bevisst — den skal treffe hardt.

Den autoritative teksten ligger i GRIM (`manifestet-stay-grounded.md`) og har **6 `---`-delte seksjoner**, ikke "7 akter" som 02-PAGES feilaktig antyder (handoffen ble skrevet før teksten var ferdig). Vi følger den ferdige teksten.

## What Changes

- **Manifest-tekst som MDX-fil** (`src/content/manifest.mdx`): hele teksten fra GRIM portert ordrett, med følgende strukturelle tilpasninger:
  - Frontmatter (`lastUpdated: "2026-05-19"`) som brødsmule-meta og end-blokk leser.
  - Pullquotes (3 stk i teksten) konverteres fra markdown `> ...`-syntaks til `<Pullquote>...</Pullquote>` JSX-tags — slik at de "roper" via shared Pullquote-komponent i stedet for å bli styled som standard italic blockquote.
  - "Noen sannheter vi har glemt"-listen blir TL;DR-boks (rendres som komponent i `page.tsx`, ikke MDX) — derfor *fjernet* fra MDX-body for å unngå duplikasjon.
  - "Stay Grounded, and Create Shit"-overskriften, sign-off-prosaen og webring-linja blir end-blokk (komponent i `page.tsx`). Også *fjernet* fra MDX-body.
  - Resten av prosaen — de 6 seksjonene delt av `---` — bor i MDX og er det Geir redigerer fritt.
- **`/manifest`-rute** (`src/app/manifest/page.tsx`), static (`force-static`) per `02-PAGES.md` Side 2:
  - **Brødsmule:** `geish.no / MANIFESTET`. Høyre: `{readTimeMin} MIN LESETID · SIST ENDRET {lastUpdated}`. Akt-tall fjernet (teksten har 6 `---`-seksjoner, ikke akter).
  - **Splash** (komponent): sentrert, kicker "— Et manifest fra geish.no —", mega-headline "Stay Grounded, / and Create Shit" (siste 2 ord i stempel-rød), deck "Eller: hvorfor jeg droppet Facebook og lagde min egen hjemmeside i 2026.", 3 stempler via `<Stamp>` med rotasjoner -4°/+3°/-2°: "Punk·standup", "Anti·plattform", "Pro·eierskap". Double-line ink-border under.
  - **TL;DR-boks** (komponent): beige (paper-warm) boks med rødt label "TL;DR — i tilfelle du bare scroller". 6 punkter fra manifestets "Noen sannheter vi har glemt"-liste, ordrett.
  - **Manifest-brødtekst** (MDX): rendres via `MDXRemote` med manifest-spesifikk prose-styling — Newsreader 19px (per 02-PAGES Side 2 designnote, slightly larger enn blog's 18px), drop-cap på første paragraf i stempel-rød Archivo Black, `<Pullquote>`-komponenter rendrer "ropende" i Archivo Black ~26px. `<hr/>` (fra `---`-seksjons-skiller) blir en visuell pause (sentrert ornament eller tynn linje).
  - **End-blokk** (komponent): sentrert, mega-headline "Stay Grounded, / and Create Shit." (samme aksent som splash), CTA-rad med 3 lenker (`/starter-kit`, `/ring/join`, `/manifest.pdf` — alle 404-er inntil de finnes, ingen stub-ruter), sign-off-prosa i italic (`Skrevet av en fyr...` + `Publisert på min egen server...` + `🚧 Denne siden er under construction. Alltid.`), `<WebringWidget variant="bar">` i bunnen. Double-line ink-border over end-blokken.
- **Flytt `Pullquote` fra `src/lib/blog/Pullquote/` til `src/components/shared/Pullquote/`.** Begrunnelse: to ruter bruker den nå (blog enkeltposter + manifest). Oppdater barrel-eksport, blog-mdx-components-import, og slett gammel plassering. Komponenten selv (TS + CSS Module) er uendret.
- **Manifest content-API** (`src/lib/manifest/content.ts`): `getManifest()` server-side funksjon som leser `src/content/manifest.mdx`, parser frontmatter med `gray-matter`, utleder readTime via blog's `deriveReadTime`, returnerer `{ frontmatter, mdxSource }`. Mindre overflate enn blog-API (én kjent fil, ingen liste).
- **MDX-komponentene** Stamp + HalftoneBlock + Pullquote (alle nå fra shared) er tilgjengelige i manifest-MDX via samme mønster som blog. Manifest-MDX bruker `<Pullquote>` eksplisitt for de 3 sitatene.
- **Responsivt fra start** per `RESPONSIVE.md`: splash mega-headline `clamp(40px, 8vw, 92px)`, stempler i `flex-wrap` så de wrapper på mobil, brødtekst-kolonne med max-width som krymper, end-blokk credo `clamp(28px, 5vw, 48px)`. `--chaos`-dempingen for Stamp-rotasjoner arves.
- **Verifisering at eksisterende lenker treffer:** forsidens ManifestCut + IntroNote og blogg-postens manifest-tag-lenker peker fortsatt til `/manifest` og gir nå 200.

## Capabilities

### New Capabilities
- `manifest`: `/manifest`-ruten med splash + TL;DR + MDX-brødtekst + end-blokk. Filbasert tekst i `src/content/manifest.mdx`, redigerbar uten å åpne komponentkode. Punk-standup-tone med drop-cap, "ropende" pullquotes, og avis-strukturelle elementer.

### Modified Capabilities
- `design-system`: `Pullquote` legges til shared-komponentlisten (var introdusert i blog, men flyttes nå hit siden to ruter bruker den). Antall shared-komponenter går fra 8 til 9.
- `blog`: `Pullquote`-importen i `src/lib/blog/mdx-components.tsx` peker nå mot `@/components/shared` i stedet for `./Pullquote`. Ingen funksjonell endring — bare flytning.

## Impact

- **Avhengigheter (ingen nye)**: bruker `next-mdx-remote/rsc` + `gray-matter` + `zod` fra e2-blog-engine.
- **Filsystem (nytt)**:
  - `src/content/manifest.mdx` (full tekst + frontmatter).
  - `src/lib/manifest/content.ts` (content-API).
  - `src/lib/manifest/mdx-components.tsx` (komponent-map for MDXRemote — kan re-eksportere blog's hvis identisk; vurderes i design).
  - `src/app/manifest/page.tsx`.
  - `src/app/manifest/page.module.css`.
  - `src/components/shared/Pullquote/index.tsx`.
  - `src/components/shared/Pullquote/Pullquote.module.css`.
- **Filsystem (modifisert)**:
  - `src/components/shared/index.ts` (eksporter `Pullquote`).
  - `src/lib/blog/mdx-components.tsx` (import fra shared).
- **Filsystem (slettet)**:
  - `src/lib/blog/Pullquote/index.tsx`.
  - `src/lib/blog/Pullquote/Pullquote.module.css`.
- **Røres ikke**: tokens, andre shared-komponenter, andre forside-seksjoner, blog-ruter (utover Pullquote-import), DB/Supabase, smoke/styleguide.
- **Eksterne systemer**: ingen — fil-IO server-side.
- **Ut av scope**:
  - PDF-zine-generering (`/manifest.pdf`) — egen senere change. Lenken 404-er inntil da.
  - Starter-kit + webring-sider (`/ring/join`, `/webring`, `/starter-kit`) — E5. Lenkene 404-er.
  - Engelsk locale.
  - Manifest som blogg-post (bevisst droppet — `hvorfor-jeg-sluttet-aa-scrolle` dekker temaet).
