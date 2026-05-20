---
project: geish.no v2
feature: e1-design-system
date: 2026-05-20
type: brownfield
status: draft
---

# Mandat: E1 — Cut & Paste Zine designsystem

## Mål

Erstatte E0s Tailwind/shadcn-stylinglag med "Cut & Paste Zine"-designsystemet fra design-handoffen, og etablere det gjenbrukbare fundamentet alt videre UI bygger på: tokens, fonter, globale stiler og komponentbiblioteket. Leveres verifiserbart via en styleguide-side som rendrer hele systemet. Dette er første halvdel av epic E1 (andre halvdel er `e1-forside`).

## Scope

### Inn

- **Fjern** Tailwind v4 og shadcn/ui som ble installert i E0: dependencies i `package.json`, PostCSS/Tailwind-konfig, `src/components/ui/`, og Tailwind-direktiver i `globals.css`.
- **Port `tokens.css` ordrett** fra handoffen til repoet (f.eks. `src/styles/tokens.css`). Den inneholder tokens, resets og hjelpeklasser (`.paper`, `.stamp`, `.torn-bottom`, `.blink`) — ikke dupliser disse i en egen `globals.css`.
- **Last de 5 fontene** (Archivo Black, Bungee, Special Elite, JetBrains Mono, Newsreader) via `next/font/google` i root layout, eksponert som CSS-variabler (`--font-display` osv.) som matcher navnene i `tokens.css`.
- **Port komponentbiblioteket** fra `references/shared.jsx` til React + CSS Modules: `VisitorCounter`, `UnderConstructionBanner`, `WebringWidget` (variants bar/card/stamp), `GuestbookSnippet`, `StatusBadge`, `Stamp`, `ImagePlaceholder`, `HalftoneBlock`.
- **Styleguide-rute** (`/styleguide`) som rendrer alle tokens (farger, type-skala, spacing) og hver komponent i sine varianter — review-flaten for dette mandatet.
- Strip shadcn-`Button` ut av `app/page.tsx` og `/smoke`. `page.tsx` blir en minimal placeholder igjen (forsiden bygges i `e1-forside`). `/smoke` beholder import/wired-sjekkene for Drizzle og Supabase, bare uten shadcn-komponenten.

### Ut

- **Forsiden** (13 seksjoner) — det er `e1-forside`, eget mandat.
- **Undersider** (manifest, Stua, blogg) — senere epics (E2, E4).
- **Innhold/i18n** (`content.js` → typed module) — følger med innholdsarbeidet, ikke designsystemet. Styleguiden bruker hardkodet dummy-tekst.
- **Auth, DB-tabeller, MDX, webring-API** — andre epics. Webring-/gjestebok-komponentene portes som *presentasjon* med dummy-data, ikke koblet til backend.
- **Full responsiv/mobil** utover beste skjønn — handoffen er desktop-only (1280px) med vilje.
- **Drizzle/Supabase-wiringen fra E0** røres ikke. Den står.

## Delta-type

**Type:** brownfield

Berører E0 (`project-init`): fjerner styling-laget (Tailwind/shadcn), beholder DB-/Supabase-wiring, prosjektstruktur (`src/`, `@/`-alias) og smoke-ruten.

## Suksesskriterier

- [ ] Tailwind og shadcn er fjernet — ingen rester i `package.json`, konfig eller `src/components/ui/`.
- [ ] `tokens.css` ligger i repoet, kopiert ordrett fra handoffen, med uendrede variabelnavn.
- [ ] De 5 fontene lastes via `next/font/google` og rendres korrekt.
- [ ] Alle 8 shared-komponenter er portet og fungerer i React.
- [ ] `/styleguide` rendrer alle tokens + komponenter uten feil og matcher zine-estetikken (flat offset-skygge, lette rotasjoner, sort-på-cream, ingen rounded corners / gradienter / blur).
- [ ] `npm run dev` starter rent; `npx tsc --noEmit` rent.
- [ ] `app/page.tsx` og `/smoke` fungerer uten shadcn; DB-wiringen intakt.

## Constraints

- **Ingen Tailwind, ingen CSS-i-JS.** CSS-variabler (`tokens.css`) + CSS Modules per komponent. Punktum. (Handoff §12.)
- `tokens.css` kopieres ordrett — variabelnavn endres ikke (Geir redigerer dem).
- **Forbudslisten** i `01-DESIGN-SYSTEM.md` §8 gjelder: ingen gradient-bakgrunner, rounded corners, blur-skygger, emoji som ikoner, eller sans-serif system-font for brødtekst.
- Behold E0s oppsett: `src/`-struktur, `@/`-alias, npm. **Avvik bevisst** fra handoffens `03-IMPLEMENTATION.md` der den sier pnpm / `--no-src-dir` / Vercel Postgres / NextAuth — de seksjonene er fra en eldre, parallell utforskning og er overstyrt av prosjektets låste stack (Supabase, npm, src/).
- Rause norske kommentarer, særlig i tokens og komponenter — dette er også et læringsprosjekt (handoffens eier-kontekst).
- Hold tokens og innhold samlet og synlig i egne filer, ikke spredt utover kodebasen.

## Kontekst for Code

- **Repo:** `C:\kode\geish_v2`. E0 (`project-init`) er ferdig: Next.js (App Router), `src/`-struktur, Drizzle → Supabase wired, `/smoke`-rute. Live DB-verifisering er deferert til første schema-mandat (se [[supabase-drizzle-connection-gotchas]]).
- **Autoritativ designkilde:** `C:\Users\geirh\OneDrive\GRIM\03 Projects\geish 2.0\design_handoff_geish\`. Les `README.md`, `01-DESIGN-SYSTEM.md`, og `references/` (særlig `tokens.css` og `shared.jsx`). `tokens.css` er produksjonsklar og kopieres ordrett; `.jsx`-filene er *designreferanser* som oversettes til React + CSS Modules (ikke kopier dem rått).
- Kopier `tokens.css` inn i repoet så den er versjonskontrollert.
- `--chaos`-rotasjonsmultiplikatoren (handoff §7) beholdes som global CSS-variabel (default `1`) slik at kaos-nivået kan justeres ett sted senere.

## Åpne spørsmål

<!-- Code avklarer disse i proposal/design. -->

- Font-lasting: `next/font/google` (self-hosted, ingen ekstern request — passer "ingen tracking"-etos) vs. Google Fonts `<link>`. Anbefaling: `next/font/google`, men Code bekrefter at alle 5 fontvektene er tilgjengelige der.
- `/styleguide`: permanent rute eller dev-only? Forslag: permanent men ulinket — nyttig referanse senere.
- Eksakt mappestruktur for `src/styles/` og `src/components/shared/` — Code velger, så lenge tokens + komponenter er samlet og synlige.
