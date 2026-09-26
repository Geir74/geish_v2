## Why

geish.no kjører på Supabas gratis-tier, som **pauser prosjektet automatisk
etter 7 sammenhengende dager uten databaseaktivitet**. Når basen pauses,
svarer ikke auth eller data, og siden er i praksis nede til noen manuelt
vekker prosjektet igjen.

Dagens keepalive (en cron på Munins laptop som pinger Supabase) er **strukturelt
utilstrekkelig**: laptopen sover, slås av og restartes. Når maskinen er nede
kjører ingen cron, og Supabase teller inaktivitet uansett. Det skjedde
2026-09-07: prosjektet stod `INACTIVE` etter en helg med maskinen av, og måtte
vekkes manuelt via Management API.

En keepalive må kjøre **uavhengig av lokal maskin** for å ha noen verdi.
GitHub Actions gir en gratis, kontofri scheduler som kjører i skyen 24/7 —
riktig sted for denne jobben.

## What Changes

- **Ny GitHub Actions-workflow** `.github/workflows/supabase-keepalive.yml`
  som trigges på `schedule` (daglig cron) og manuelt via `workflow_dispatch`.
- Workflowen gjør **én lett, lesende HTTP-forespørsel** mot prosjektets
  PostgREST-endepunkt (`/rest/v1/`) med den offentlige anon/publishable-nøkkelen.
  Dette teller som databaseaktivitet og nullstiller Supabase sin
  inaktivitetsteller.
- **Ingen hemmeligheter eksponeres i repoet.** Prosjekt-URL og publishable-nøkkel
  legges som GitHub Actions **repository secrets** (`SUPABASE_URL`,
  `SUPABASE_PUBLISHABLE_KEY`) og leses via `secrets.*` i workflowen.
- Workflowen **feiler synlig** (ikke-null exit) hvis endepunktet ikke svarer
  2xx, slik at en varig nede-tilstand blir fanget i Actions-loggen.
- **Ingen produktkode endres.** Dette er ren drifts-/infra-tooling; ingen
  Next.js-, DB- eller RLS-endringer.

## Impact

- **Berørte capabilities:** ny `supabase-keepalive` (drift/infra). Ingen
  endring i `auth`, `blog`, `project-foundation` e.l.
- **Berørte filer:** `.github/workflows/supabase-keepalive.yml` (ny).
- **Nye eksterne avhengigheter:** to GitHub repository secrets settes utenfor
  repoet (dokumenteres i tasks). Publishable-nøkkelen er allerede offentlig
  (eksponeres i klienten via `NEXT_PUBLIC_*`), så den utgjør ingen ny risiko.
- **Erstatter:** den lokale laptop-cronen for Supabase-keepalive blir
  overflødig og kan pensjoneres når denne er verifisert.
