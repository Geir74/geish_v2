## 1. Copy: nav-slice i no.ts

- [x] 1.1 Ny `nav`-slice i `src/content/locales/no.ts` (Geir-godkjent copy): `links[]` (hver med `href` + `label`) for Hjem/Blogg/Manifest, samt `login`/`konto`/`logout`-etiketter.
- [x] 1.2 Kun rom som finnes (D2) — ingen Stua/Gjestebok-lenker ennå.

## 2. SiteNav-komponent

- [x] 2.1 `src/components/shared/SiteNav/index.tsx` (`"use client"`): rendrer rom-lenker fra `t().nav.links` + auth-cluster.
- [x] 2.2 Auth absorbert fra AuthNav (D1): `useUser()` → utlogget viser `login`, innlogget viser `Min side`-lenke (`/konto`) + logg ut-form (POST `/auth/logg-ut`).
- [x] 2.3 Reservert plass mens `useUser()` laster (ingen layout-shift / login-blink).
- [x] 2.4 Aktiv rute markeres via `usePathname` (`aria-current="page"` + «tapet fast»-stil).
- [x] 2.5 `src/components/shared/SiteNav/SiteNav.module.css`: «avrevne papirlapper» (D5) — dashed «tape»-kant, lett rotasjon, stempel-rød hover, aktiv = stempel-fyll. Kun eksisterende designtokens.
- [x] 2.6 Mobil: flex-wrap på lappene, ingen hamburger (D5). `@media (max-width: 480px)` strammer padding/gap.

## 3. Montering + barrel

- [x] 3.1 `src/app/layout.tsx`: `<AuthNav />` → `<SiteNav />` (samme posisjon i `<body>`, over `{children}`).
- [x] 3.2 `src/components/shared/index.ts`: eksporter `SiteNav`, fjern `AuthNav`-eksport. AuthNav-fila beholdes (ikke slettet), bare avmontert.

## 4. Verifisering — lokal

- [x] 4.1 `npm run lint` grønt (verifisert).
- [x] 4.2 `npm run build` grønt: `/`, `/blogg`, `/manifest` fortsatt `○ (Static)` — statisk render bevart (D4). Ingen utilsiktet dynamisk rute.
- [ ] 4.3 IKKE VERIFISERT (krever nettleser/preview): nav synlig på forside/blogg/manifest, aktiv lapp markert, auth-veksling logg inn/ut som før, mobil-wrap ved 320px. Sjekkes i Vercel-preview på PR #12.

## 5. Forbudsliste + sanity

- [x] 5.1 Ingen nye npm-avhengigheter (`package.json` urørt).
- [x] 5.2 All bruker-synlig copy via `t()` (`nav`-slice) — ingen hardkodet tekst i komponenten.
- [x] 5.3 `"use client"` + `useUser()` client-side — leser aldri cookies server-side (D4). Statiske ruter forblir statiske.
- [x] 5.4 Ingen hamburger, ingen border-radius/blur/gradient/emoji i nav-UI — zine-tro.
- [x] 5.5 Auth-flyten (E3) urørt: middleware, callback, logg-inn, `/auth/logg-ut`, cookie-domene. Kun visningen flyttet.

## 6. Beslutninger — AVGJORT AV GEIR (2026-09-01)

- [x] 6.1 D1: én samlet komponent (`SiteNav`), ikke separat AuthNav + nav.
- [x] 6.2 D2: kun lenker til rom som finnes. Ingen placeholders.
- [x] 6.3 D3: copy godkjent — Hjem · Blogg · Manifest (+ Logg inn / Min side / Logg ut).
- [x] 6.4 D4: statisk render bevart — client-only, aldri server-side cookies. (Munins ansvar.)
- [x] 6.5 D5: avrevne papirlapper + flex-wrap, ingen hamburger.
