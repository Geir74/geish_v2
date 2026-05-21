---
project: geish.no v2
feature: e2-manifest
date: 2026-05-21
type: brownfield
status: draft
---

# Mandat: E2 — Manifest-siden (/manifest)

## Mål

Bygg `/manifest` — den fulle manifest-siden "Stay Grounded, and Create Shit" i punk-standup-tone. Manifestet er en egen sidetype (ikke en bloggpost): splash-åpning, TL;DR-boks, selve teksten i seksjoner med drop-caps og pullquotes som "roper", og en end-blokk med webring. Dette er Change 2 og siste del av epic E2. Når den lander er bloggens lenker til `/manifest` (fra forsiden, fra blogg-poster) ekte, og E2 er ferdig.

## Bakgrunn

E2 blog-engine ga MDX-pipelinen, `/blogg` og enkeltposter. Manifestet er nevnt overalt — forsidens ManifestCut og IntroNote lenker til `/manifest`, blogg-posten `hvorfor-jeg-sluttet-aa-scrolle` har tag "manifest" — men siden finnes ikke ennå. Manifestet er prosjektets ideologiske kjerne: argumentet for hvorfor noen skulle bygge sin egen side i stedet for å bo på en plattform. Tonen er punk-standup — den skal treffe hardt og overbevise.

**Innholdskilde (autoritativ):** `manifestet-stay-grounded.md` i GRIM (`03 Projects/geish-no/`). Det er den ferdige teksten. Den har 6 seksjoner delt med `---`, en avsluttende "Stay Grounded, and Create Shit"-blokk, og en webring-linje. Teksten er kilden — ikke 02-PAGES' antakelse om "7 akter" (handoffen ble skrevet før teksten var ferdig; følg teksten, ikke tallet).

## Scope

### Inn

- **Manifest-tekst som MDX-fil.** Port `manifestet-stay-grounded.md` til `src/content/manifest.mdx` (eller tilsvarende plassering Code velger). Teksten redigeres der av Geir, ikke i komponentkode — samme prinsipp som blogg-poster og content-modulet. Bruk MDX-pipelinen fra `e2-blog-engine` (`next-mdx-remote/rsc`) til å rendre brødteksten.
- **`/manifest`-rute** (`src/app/manifest/page.tsx`), static (`force-static`) server component, per `02-PAGES.md` Side 2:
  - **Brødsmule-strip:** `geish.no / MANIFESTET`. Høyre: meta ("6 MIN LESETID · SIST ENDRET [dato]" — akt-tall droppes eller settes til faktisk seksjonsantall).
  - **Splash:** sentrert. Kicker → mega-headline ("Stay Grounded, and Create Shit") → deck → 3 røde stempler (`<Stamp>`: "Punk·standup", "Anti·plattform", "Pro·eierskap") med varierte rotasjoner (-4°, +3°, -2°). Double-line border under.
  - **TL;DR-boks:** beige boks med rødt label. Punktene fra manifestets "Noen sannheter vi har glemt"-liste (eller en kondensert essens — Code velger den beste kilden i teksten).
  - **Manifest-brødtekst:** MDX rendret med Newsreader 19px. Drop-cap på første paragraf i stempel-farge. Pullquotes (manifestets `>`-sitater) rendres i Archivo Black ~26px — de skal rope, ikke hviske (ikke italic). Seksjons-skiller (`---` i teksten) blir visuelle pauser.
  - **End-blokk:** sentrert. Stor headline "Stay Grounded, and Create Shit." Lenker til starter-kit / webring / PDF-zine (404-er inntil de finnes — ingen stub-ruter). Sign-off i italic. Webring-widget (`<WebringWidget variant="bar">`) i bunnen.
- **Gjenbruk shared-komponenter:** `Stamp` (splash + evt. inline), `WebringWidget` (end-blokk), `HalftoneBlock` (dekor hvis ønsket). MDX-komponent-mappingen fra `e2-blog-engine` (`mdxComponents`) gjenbrukes der det passer, evt. utvidet for manifest-spesifikke behov.
- **Responsiv fra start** per `RESPONSIVE.md`: splash mega-headline via `clamp()`, lesbar brødtekst-kolonne som krymper pent, stempler som wrapper på smal skjerm, `--chaos` arves. Lesbar 320px+.
- **Verifiser at eksisterende lenker treffer:** forsidens ManifestCut + IntroNote og blogg-postens manifest-relaterte lenker peker til `/manifest` og gir nå 200, ikke 404.

### Ut

- **Manifest som blogg-post** — droppes bevisst. Blogg-posten `hvorfor-jeg-sluttet-aa-scrolle` dekker allerede temaet; en egen post om manifestet ville duplisere stemmen. Manifestet *er* innholdet.
- **PDF-zine-generering** (`/manifest.pdf`) — egen senere vurdering. End-blokk-lenken 404-er inntil da.
- **Starter-kit + webring-sider** (`/ring/join`, `/webring`) — E5. Lenkene 404-er inntil da, ingen stub-ruter.
- **Endring av blogg-pipelinen, tokens, shared-komponenter** utover å konsumere dem.
- **Engelsk locale.**
- **Stua, auth, DB.**

## Delta-type

**Type:** brownfield

Ny `manifest`-capability (ADDED). Bygger på `blog`-capability (MDX-pipeline) + E1-design-system + E1.5. Berører ikke `homepage` strukturelt — men verifiserer at forsidens manifest-lenker nå treffer en ekte side.

## Suksesskriterier

- [ ] `/manifest` returnerer 200 og rendrer splash, TL;DR, brødtekst, end-blokk per 02-PAGES Side 2.
- [ ] Manifestteksten bor i en `.mdx`/innholdsfil Geir kan redigere uten å åpne komponentkode.
- [ ] Brødteksten matcher den autoritative teksten i `manifestet-stay-grounded.md` (innholdsmessig — formatering tilpasses sidestrukturen).
- [ ] Pullquotes rendres i Archivo Black og "roper" (ikke italic). Drop-cap på første paragraf i stempel-farge.
- [ ] Splash har 3 stempler med varierte rotasjoner; end-blokk har webring-widget.
- [ ] Forsidens ManifestCut/IntroNote-lenker til `/manifest` gir nå 200.
- [ ] Responsiv 320px+ per RESPONSIVE.md; desktop matcher 02-PAGES-estetikken.
- [ ] `npx tsc --noEmit` rent; `npm run dev` rent.
- [ ] Ingen DB, ingen stub-ruter for ennå-ikke-eksisterende lenker (PDF/webring 404-er).

## Constraints

- **Teksten er autoritativ, ikke handoffens akt-tall.** `manifestet-stay-grounded.md` har 6 `---`-delte seksjoner, ikke 7 akter. Følg teksten. Ikke finn opp innhold for å fylle et tall.
- **Tonen er punk-standup.** Pullquotes roper (Archivo Black, ikke italic). Drop-cap er det eneste røde i selve teksten ellers. Ikke demp manifestet til noe pent og glatt — det skal ha kant.
- Bygg på `e2-blog-engine` sin MDX-pipeline og `e1-design-system`. Ingen Tailwind/shadcn, CSS-variabler + CSS Modules. Følg `RESPONSIVE.md`.
- Forbudslisten §8 gjelder. Manifestteksten har emojier (🚧, 🔗) i webring-linja og sign-off — disse er *innhold i teksten*, men i en komponent-kontekst (end-blokk webring) bruk tekst-glyf/komponent, ikke emoji-ikon, konsistent med hvordan forsiden håndterte det. Code bruker skjønn: behold 🚧 hvis det er en bevisst del av sign-off-prosaen, men ikke som funksjonelt ikon.
- Lesbar tekst-kolonne (manifest er langt) — ikke full bredde, sentrert lesekolonne som blogg-enkeltposten.
- Rause norske kommentarer.

## Kontekst for Code

- **Repo:** `C:\kode\geish_v2`. E2 blog-engine levert: MDX-pipeline (`next-mdx-remote/rsc`, `gray-matter`, `zod`), `src/lib/blog/mdx-components.tsx`, `/blogg`-ruter, `Pullquote`-komponent i `src/lib/blog/`. Manifestet kan gjenbruke `Pullquote` og prose-stylingen derfra.
- **Innholdskilde:** `C:\Users\geirh\OneDrive\GRIM\03 Projects\geish-no\manifestet-stay-grounded.md` — autoritativ tekst. Kopier inn i repoet (æøå i prosa er greit; det er innhold, ikke filnavn).
- **Design:** `C:\Users\geirh\OneDrive\GRIM\03 Projects\geish 2.0\design_handoff_geish\` — `02-PAGES.md` Side 2 (Manifestet: splash, TL;DR, akter, end-blokk, designnotater), `references/pages.jsx` `PageManifest`. Oversett inline-stiler til CSS Modules.
- **Pullquote-plassering:** `Pullquote` ligger i `src/lib/blog/` (fra e2-blog-engine). Hvis manifestet trenger den, vurder om den bør flyttes til `src/components/shared/` nå som to ruter bruker den — Code avgjør (det var et åpent spørsmål i e2-blog-engine D-notatene).
- **Avvik fra `03-IMPLEMENTATION.md` står fast:** npm, `src/`, Supabase, filbasert innhold (ikke NextAuth/Vercel Postgres).

## Åpne spørsmål

<!-- Code avklarer i proposal/design. -->

- **Manifest som ren `.mdx` vs. seksjonert struktur:** Skal hele teksten ligge i én `manifest.mdx` rendret som brødtekst, eller skal splash/TL;DR/end-blokk være egne komponenter med kun midt-teksten som MDX? Forslag: splash + TL;DR + end-blokk som komponenter i `page.tsx`, midt-teksten som MDX — gir designkontroll på rammen og redigerbarhet på prosaen.
- **TL;DR-kilde:** manifestets "Noen sannheter vi har glemt"-liste er den naturlige TL;DR. Bruk den, eller kondenser? Forslag: bruk den listen direkte.
- **Pullquote flyttes til shared?** To ruter bruker den nå. Forslag: flytt til `src/components/shared/`, oppdater begge importer (liten brownfield-touch på blog-capability).
- **Meta-linje akt-tall:** "7 AKTER" i 02-PAGES stemmer ikke med teksten. Forslag: drop akt-tall, behold "X MIN LESETID · SIST ENDRET [dato]".
- **PDF-zine:** end-blokk lenker til `/manifest.pdf`. Forslag: lenk til `#` eller utelat knappen til PDF-generering er en egen change.
