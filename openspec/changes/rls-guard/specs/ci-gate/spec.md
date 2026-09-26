# ci-gate Specification

## ADDED Requirements

### Requirement: Schedulert RLS-vakt verifiserer produksjonens sikkerhetsflate

Repoet SHALL inneholde en GitHub Actions-workflow som kjører på `schedule`
(og kan trigges manuelt via `workflow_dispatch`), atskilt fra `build`-jobben
som gater PR-er. Workflowen MUST kjøre et verifiseringsskript som kobler til
produksjonsdatabasen og kontrollerer at row level security er aktiv på alle
tabeller i `public`-skjemaet, og at hver tabell har minst én policy.

Workflowen MUST avslutte med ikke-null exit code hvis RLS er av på én eller
flere tabeller, eller hvis en tabell mangler policyer. Tilkoblingsstrengen
MUST leveres som GitHub **secret**, ikke som repository variable — i motsetning
til `NEXT_PUBLIC_*`-verdiene er dette en privilegert credential.

Vakten SHALL NOT være et steg i `build`-jobben som kjører på hver
`pull_request`. CI-bygget har ingen databasetilgang, og PR-jobber (inkludert
fra forks) SHALL NOT eksponeres for produksjons-credentials.

Vakten SHALL NOT forsøke å reparere sikkerhetsflaten automatisk; den rapporterer
kun.

#### Scenario: Vakten er rød når RLS mangler

- **WHEN** row level security er slått av på minst én tabell i `public`
- **THEN** vakt-workflowen avslutter med ikke-null exit code og vises som rød

#### Scenario: Vakten er grønn når sikkerhetsflaten står

- **WHEN** alle tabeller i `public` har RLS aktiv og minst én policy hver
- **THEN** workflowen fullfører uten feil

#### Scenario: Vakten eksponerer ikke prod-credentials for PR-er

- **WHEN** en PR åpnes mot `master` (også fra en fork)
- **THEN** `build`-jobben kjører uten databasetilgang, og vakt-workflowen
  trigges ikke av `pull_request`-eventet

#### Scenario: Vakten kan kjøres manuelt ved mistanke

- **WHEN** en maintainer trigger workflowen via `workflow_dispatch`
- **THEN** verifiseringen kjører umiddelbart mot produksjon og rapporterer
  status uten å endre noe
