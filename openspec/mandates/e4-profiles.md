---
project: geish.no v2
feature: e4-profiles
date: 2026-08-24
updated: 2026-08-24
type: brownfield
status: draft
---

# Mandat: E4 — Profiler + DB-fundament (Drizzle + RLS)

> UTKAST. Munin har skrevet dette forslaget; Geir skal lese det guidet i chat
> før implementering starter. UI-tekster er utkast Geir skal godkjenne.

## Mål

Legg den første ekte datatabellen i geish.no v2: en `profiles`-tabell knyttet
til `auth.users`, med et **visningsnavn** hver innlogget bruker eier. Dette er
forutsetningen for alt sosialt: gjestebok (E5) og Stua (E6) trenger et navn å
feste bidrag til. E3 ga *identitet* (innlogget: ja/nei); E4 gir *data* — og
etablerer samtidig DB-mønsteret (Drizzle-migrasjoner, RLS-policyer, auto-
opprettelse av rader) som E5/E6 arver.

## Scope

### Inn

- **Drizzle-fundament tas i bruk for første gang.** `drizzle.config.ts`,
  `src/db/index.ts` og `src/db/schema.ts` finnes fra E0 men er tomme.
  E4 definerer første tabell, genererer første migrasjon, og fastsetter
  konvensjonen: hvordan tabeller, migrasjoner, RLS og Postgres-triggere
  forfattes og committes så E5/E6 kan kopiere mønsteret.
- **`profiles`-tabell:** `id uuid PK → auth.users(id)`, `display_name` (påkrevd),
  `bio` (valgfri, kort), `created_at`, `updated_at`.
- **Auto-opprettelse** av profil ved første innlogging (Postgres-trigger på
  `auth.users` anbefales — se design), så ingen innlogget bruker mangler rad.
- **RLS på `profiles`:** alle kan LESE (offentlig visningsnavn/bio trengs i
  gjestebok/Stua), kun eier kan ENDRE egen rad. Policyene skrives eksplisitt.
- **/konto utvides** fra ren «logget inn som»-flate til vis + rediger egen
  profil (display_name, bio). Skriving via server action (E3 D1 åpnet for det).
- **`useUser()`/server-hjelpere utvides med profil**, klart som mønster for
  E5/E6 (vis/skjul + hent visningsnavn).

### Ut

- **Gjestebok** — E5.
- **Stua (forum)** — E6.
- **Avatar-/bildeopplasting** — senere (Supabase Storage). E4 er tekst-profil.
- **Offentlige profilsider** (`/folk/<navn>`) — nevnes som senere mulighet,
  bygges ikke nå.
- **Admin-rolle / moderering** — nevnes (E5/E6 trenger det), men E4 legger kun
  et minimalt krok-punkt hvis billig; full rollemodell er senere.
- **Custom Postgres-roller for Drizzle** — E4 bruker eksisterende
  DATABASE_URL-tilkobling.

## Delta-type

**Type:** brownfield. Bygger på E0-fundamentet (Drizzle-wiring, Supabase) og
E3 (auth, `useUser()`, `/konto`). Rører ikke blogg (E2), designsystem (E1)
utover å gjenbruke tokens/komponenter, eller auth-flyten (E3) utover å utvide
`/konto` og innlogget-tilstands-hjelperne.

## Suksesskriterier

- [ ] Innlogget bruker har alltid en `profiles`-rad (auto-opprettet).
- [ ] `/konto` viser eget visningsnavn + bio og lar bruker redigere begge.
- [ ] Endringer lagres og persisterer; `updated_at` oppdateres.
- [ ] RLS: en innlogget bruker kan IKKE endre en annens profil (verifisert).
- [ ] Alle (også anonyme via PostgREST/anon-nøkkel) kan LESE profiler — klart
      for gjestebok/Stua.
- [ ] `npm run build` + `tsc` + `lint` rent; forside/blogg/manifest fortsatt
      statiske; `/konto` fortsatt dynamisk.
- [ ] Migrasjonen er committet og reproduserbar (`drizzle-kit`), RLS + trigger
      dokumentert som SQL i repoet.

## Constraints

- **Domenedata går gjennom Drizzle** (`src/db`), ikke Supabase JS-klienten
  (project-foundation-regelen fra E0). Supabase JS er reservert for
  auth/realtime/storage. → Server actions leser/skriver profil via Drizzle.
- **RLS beskytter PostgREST/anon-stien, ikke Drizzle-stien.** Drizzle kobler
  til med DATABASE_URL (full tilgang, RLS omgås). Den autoritative eier-sjekken
  bor derfor i server action (`getUser()` + `id = user.id`); RLS er
  dybde-forsvar for fremtidig klient-/realtime-tilgang og et mandatkrav.
  Dette må stå tydelig i design så RLS ikke ser overflødig ut.
- **Personvern:** bio er offentlig lesbar. UI MÅ si dette tydelig ved
  redigering («dette vises offentlig»). Ingen private felt i E4.
- **Gratis-plan:** Supabase-prosjektet kan pauses ved inaktivitet (keep-alive
  finnes). E4 legger ikke tung last; ingen cron/jobs.
- Zine-designsystem (CSS-vars + CSS Modules), ingen nye UI-avhengigheter.
- Norsk copy via `t()` (`profil`-slice i `no.ts`). Ingen hardkodede strenger.
- Ingen AI-slop: profiltekst er brukerens egne ord; placeholder-copy er utkast
  Geir godkjenner.

## Kontekst for Code

- Stack: Next.js 16 App Router, `@/`-alias, Supabase (eu-north-1), Drizzle ORM
  0.45 + drizzle-kit 0.31 + `postgres` 3.4 (alt installert i E0).
- `drizzle.config.ts` krever `DIRECT_URL` (Session pooler, port 5432) for
  drizzle-kit; `src/db/index.ts` bruker `DATABASE_URL` (Transaction pooler,
  6543, `prepare:false`) i appen.
- E3 ga `createClient()` (server, autoritativ via `getUser()`) og `useUser()`
  (client, kosmetisk). E4 arver todelingen for profildata.
- Filosofi: siden er en zine man deler. Profilen er lavmælt — et navn og noen
  ord, ikke et sosialt-medie-panel.

## Åpne spørsmål (avgjøres i design, bekreftes av Geir)

- **Auto-opprettelse:** Postgres-trigger på `auth.users` vs. app-kode-upsert
  ved første `/konto`-besøk. (Design anbefaler trigger.)
- **`display_name`:** påkrevd ja/nei, unik ja/nei, default-verdi ved
  opprettelse (f.eks. e-postens lokaldel).
- **Hvor RLS + trigger-SQL bor:** i den genererte Drizzle-migrasjonen vs. egen
  `supabase/`-migrasjon. (Design anbefaler ett sted, committet i repoet.)
- **Skrivevei:** server action (anbefalt) vs. route handler (E3-mønster).
