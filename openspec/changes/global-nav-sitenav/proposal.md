# Proposal: Global navigasjon (SiteNav)

## Hvorfor

geish.no er i dag løse sider med hver sin brødsmule. Det finnes ingen felles
navigasjon som binder rommene sammen — kun `AuthNav` (logg inn/ut) i rot-layouten.
Med flere ekte rom nå live (`/surdeig`, `/gjestebok` i tillegg til `/blogg` og
`/manifest`) trenger siten en global nav slik at besøkende kan bevege seg mellom
rommene, ikke bare lande på løse URL-er.

Kilde: GRIM `03 Projects/geish-no/mandate-global-nav.md` (2026-09-01, status: ready).

## Hva endres

- Ny client-komponent `SiteNav` i `src/components/shared/SiteNav/`, montert i
  `src/app/layout.tsx` — **erstatter** dagens `<AuthNav />`.
- `AuthNav` absorberes inn i `SiteNav` (logg inn/ut-logikk via `useUser()` +
  `/auth/logg-ut`-form flyttes inn). `AuthNav` fjernes fra shared-barrel når
  erstattet.
- Lenker (kun rom som faktisk finnes): **Hjem · Blogg · Surdeig · Gjestebok · Manifest**.
- Auth-del uendret oppførsel: `Logg inn` (utlogget) ↔ `Min side` + `Logg ut` (innlogget).
- Ny `nav`-copy-nøkkel i i18n; gjenbruker eksisterende `auth.nav` for auth-etikettene.
- Design: «avrevne papirlapper» — Cut & Paste-zine, mono/caps, stempel-rød på hover,
  aktiv rute uthevet. Mobil: flex-wrap, ingen hamburger.

## Avvik fra opprinnelig mandat (bevisst oppdatering)

Mandatet (2026-09-01) listet kun **Hjem · Blogg · Manifest** og satte gjestebok
eksplisitt som «Ut», fordi rommet ikke fantes da. Siden den gang er `/surdeig`
(PR #16) og `/gjestebok` (E5, PR #15) mergd og live. Per mandatets eget prinsipp
**D2 — «kun lenker til rom som finnes»** — legges begge nye rom inn nå. Dette er
en oppdatering av mandatets lenke-liste, godkjent av Geir 2026-09-22, ikke et brudd
med mandatets intensjon.

## Scope ut

- Stua-lenke (E6) — rommet finnes ikke ennå.
- Hamburger / off-canvas-meny, dropdowns, undermenyer, søk.
- Ny styling av selve sidene — kun nav-komponenten røres.
- Server-side auth-lesing — forbudt (statiske ruter må forbli statiske).

## Påvirkning

- Berørte specs: ny capability `navigation`.
- Berørt kode: `src/components/shared/SiteNav/` (ny), `src/app/layout.tsx`,
  `src/content/i18n.ts` (nav-copy), `src/components/shared/index.ts` (barrel),
  `src/components/shared/AuthNav/` (fjernes/absorberes).
