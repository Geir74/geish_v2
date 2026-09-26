# Design: SiteNav

## Kontekst

Brownfield. `AuthNav` er allerede en client-komponent i rot-layouten som leser
auth-tilstand via `useUser()` i nettleseren (aldri server-side), slik at statiske
ruter forblir statiske (E3 D5). SiteNav arver dette mønsteret og utvider det med
rom-lenker.

## Beslutninger (låst med Geir 2026-09-01, oppdatert 2026-09-22)

- **D1** Én samlet komponent (`SiteNav`), ikke separat AuthNav + nav. AuthNav
  absorberes inn.
- **D2** Kun lenker til rom som finnes. Per 2026-09-22: Hjem · Blogg · Surdeig ·
  Gjestebok · Manifest. Ingen placeholders for rom som ikke finnes (f.eks. Stua).
- **D3** Copy godkjent: Hjem · Blogg · Surdeig · Gjestebok · Manifest
  (+ Logg inn / Min side / Logg ut fra `auth.nav`).
- **D4** Statisk rendering bevares — `"use client"`, leser auth via `useUser()`
  i nettleseren, aldri server-side cookies.
- **D5** Mobil = avrevne papirlapper med flex-wrap, ingen hamburger.
- **D6 (nytt 2026-09-22)** Rekkefølge: Hjem → Blogg → Surdeig → Gjestebok →
  Manifest. Manifest sist (lengst «inn i sjela»); rom/verktøy først.

## Constraints

- Statiske ruter må forbli statiske — bekreftes i build-output (ingen ruter går
  fra statisk til dynamisk).
- Ingen hardkodet tekst — all copy fra `i18n.ts`.
- Designtokens — bruk eksisterende CSS-variabler (`--font-mono`, `--stamp`,
  `--border-dashed`, `--sp-*`), ingen nye magiske verdier.
- Ingen layout-shift ved auth-loading (reservert plass, arvet fra AuthNav-mønsteret).

## Datamodell for lenker

Rute-stiene (`/`, `/blogg`, `/surdeig`, `/gjestebok`, `/manifest`) defineres som
en **statisk array i komponent-koden** — ikke i i18n. i18n leverer kun
visningsnavnene (labels). Dette unngår risiko med statisk render og holder
stiene som kode (sant/typesjekket mot faktiske ruter), copy som innhold.
Aktiv rute bestemmes client-side via `usePathname()`.

## Faktiske ruter (verifisert mot dagens AuthNav — Hugin-review 2026-09-22)

SiteNav SKAL gjenbruke de EKSAKTE stiene dagens `AuthNav` bruker, ikke finne
på nye:
- Innlogget konto-lenke: `href="/konto"` (copy: «Min side», nøkkel `auth.nav.konto`).
- Logg ut: `<form method="post" action="/auth/logg-ut">` (nøkkel `auth.nav.logout`).
- Logg inn (utlogget): `href="/logg-inn"` (nøkkel `auth.nav.login`).
Ingen `/min-side` eller `/auth/logg-ut-form` — de finnes ikke i koden.

## Loading-tilstand (Hugin-review 2026-09-22)

Dagens AuthNav returnerer `null` mens `loading` er true → auth-delen popper inn
og gir layout-shift. SiteNav SKAL i stedet rendre en **reservert placeholder med
fast dimensjon** (tom boks/CSS-skjelett i zine-stil) mens `loading` er true, slik
at auth-delen ikke forskyver rom-lenkene når den hydreres. Dette er en
forbedring over arvet oppførsel, ikke bare en kopi.

## Avveininger

- **Egen `navigation`-capability vs. under `homepage`:** valgt egen capability
  fordi SiteNav er global (montert i rot-layout), ikke forside-spesifikk. Holder
  spec-grensene rene.
- **Absorbere AuthNav vs. beholde begge:** absorbere (D1) gir én kilde til
  nav-tilstand og unngår to komponenter som konkurrerer om samme rad.
