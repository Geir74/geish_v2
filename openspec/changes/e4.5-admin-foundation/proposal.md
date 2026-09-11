## Why

E4 ga geish.no *data* (profiles-tabell, DB-mønster, RLS). Det som står for tur
er *sosiale flater* — gjestebok (E5) og Stua (E6) — og de deler ett behov E4
ikke løste: **moderering**. Anonyme gjestebok-innlegg må godkjennes; forum-
tråder må kunne fjernes. Det betyr at noen (Geir) må få se og handle på *andres*
innhold, inkludert uroderte, potensielt sensitive innlegg.

Hvis hver epic bygger sin egen admin-sjekk, havner tilgangslogikken spredd på
mange steder med ulik «hvem er admin»-logikk — klassisk kilde til
sikkerhetshull. Admin er ikke som navigasjon (som får bli til underveis): det er
en **sikkerhets- og personverngrense**. Den skal defineres én gang, tidlig, og
bo bak én tydelig, testbar sjekk.

Derfor et eget, **tynt** admin-fundament mellom E4 og E5: grensen vi garantert
trenger, uten en moderering-motor vi ikke har brukere for (YAGNI).

## What Changes

- **`isAdmin()`-hjelper, ett sted.** Server-side sjekk mot env-variabel
  `ADMIN_USER_ID` (Supabase auth-UUID). Ingen role-kolonne, ingen DB-endring
  (D1). Fail closed: mangler env → ingen er admin.
- **`/admin`-tak.** Beskyttet, `force-dynamic`, guardet med `getUser()` +
  `isAdmin()`. Ikke-admin nektes uten å lekke innhold. Minimal landingsside;
  E5/E6 legger paneler under `/admin/*`.
- **Moderering-mønster** (ikke motor): server actions bak `isAdmin()`, progressiv
  `<form action>`, `revalidatePath`. Dokumentert for gjenbruk.
- **Copy-slice `admin`** i `no.ts` (utkast, Geir godkjenner): overskrift,
  tom-tilstand, «ikke autorisert».
- **`.env.example`/dokumentasjon** oppdateres med `ADMIN_USER_ID` (verdien selv
  settes i `.env.local` + Vercel, aldri committet).

## Sikkerhetsmodell

Domenedata går gjennom Drizzle (`DATABASE_URL`), som omgår RLS. Den autoritative
admin-sjekken bor derfor i **server-laget** (`getUser()` + `isAdmin()`), ikke i
middleware og ikke kun i RLS — samme prinsipp som E3s page-guard og E4s
action-guard. `isAdmin()` er den primære muren for `/admin` og alle
moderering-actions.

Personvern: kun admin ser ventende/anonyme innlegg (E5 bygger på dette). Ingen
tredjepart — heller ikke Munin — er nødvendig i moderering-loopen. Et eventuelt
Telegram-varsel om «ventende innlegg» (senere, valgfritt) er kun en påminnelse;
selve godkjenningen skjer på Geirs egen side.

## Impact

- **Nye ruter:** `/admin` (+ senere `/admin/*` fra E5/E6).
- **Ny env:** `ADMIN_USER_ID` (ikke committet; dokumenteres i `.env.example`).
- **Berørte capabilities:** ny `admin`-capability. Rører ikke `auth`, `blog`,
  `homepage`, `design-system`, `manifest` utover gjenbruk av `getUser()` og
  design-tokens.
- **Ingen DB-migrasjon** (D1: env, ikke role-kolonne).
- **Ingen nye npm-avhengigheter.**
