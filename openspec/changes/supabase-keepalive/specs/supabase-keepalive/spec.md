## ADDED Requirements

### Requirement: Ekstern scheduler holder Supabase-prosjektet aktivt

Repoet SHALL inneholde en GitHub Actions-workflow på
`.github/workflows/supabase-keepalive.yml` som kjører **uavhengig av lokal
maskin** og periodisk genererer databaseaktivitet mot geish.no sitt
Supabase-prosjekt, slik at prosjektet ikke pauses av gratis-tierens
7-dagers inaktivitetsregel.

Workflowen MUST trigges på `schedule` (daglig cron) og SHALL også kunne
trigges manuelt via `workflow_dispatch`. Aktiviteten MUST være én lett,
lesende HTTP-forespørsel mot prosjektets PostgREST-endepunkt
(`<SUPABASE_URL>/rest/v1/`) med den offentlige anon/publishable-nøkkelen i
`apikey`- og `Authorization: Bearer`-headere.

Workflowen SHALL NOT inneholde hemmeligheter i klartekst; prosjekt-URL og
publishable-nøkkel MUST leses fra GitHub repository secrets
(`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`).

#### Scenario: Daglig kjøring pinger databasen

- **WHEN** den planlagte cron-tiden inntreffer
- **THEN** starter GitHub Actions et run som sender én autentisert GET mot
  `<SUPABASE_URL>/rest/v1/` og teller dermed som databaseaktivitet hos Supabase

#### Scenario: Kan trigges manuelt

- **WHEN** en vedlikeholder velger «Run workflow» i Actions-UIet
- **THEN** kjører samme keepalive-forespørsel umiddelbart via `workflow_dispatch`

#### Scenario: Ingen hemmeligheter i repoet

- **WHEN** workflow-fila inspiseres i repoet
- **THEN** finnes ingen klartekst-URL eller -nøkkel; verdier refereres kun via
  `secrets.SUPABASE_URL` og `secrets.SUPABASE_PUBLISHABLE_KEY`

### Requirement: Keepalive feiler synlig ved varig nede-tilstand

Workflowen SHALL avslutte med ikke-null exit code (rødt run) hvis
keepalive-forespørselen ikke returnerer en 2xx HTTP-status, slik at en
vedvarende feil (nettverk, feil URL/nøkkel, eller allerede pauset prosjekt)
blir fanget og synlig i Actions-kjørehistorikken.

#### Scenario: Endepunkt svarer ikke 2xx

- **WHEN** keepalive-forespørselen returnerer en ikke-2xx status eller feiler
- **THEN** markeres workflow-runet som rødt (ikke-null exit), slik at feilen
  vises i Actions-loggen
