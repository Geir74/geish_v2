# ci-gate Specification

## Purpose
TBD - created by archiving change infra-ci-gate. Update Purpose after archive.
## Requirements
### Requirement: GitHub Actions-workflow gater PR-er mot master

Repoet SHALL inneholde en GitHub Actions-workflow på `.github/workflows/ci.yml` som trigges automatisk på `pull_request`-events mot `master`-grenen. Workflowen MUST kjøre minst stegene `npm ci` → `npm run lint` → `npm run build` i den rekkefølgen, etter standard checkout og Node.js-oppsett. Jobben MUST ha et stabilt navn (`build`) som kan refereres fra branch-protection-regler.

Workflowen SHALL NOT trigge på `push` til `master` (kun `pull_request`), SHALL NOT inneholde et tomt eller dummy test-steg, og SHALL NOT deploye noe — Vercels git-integration håndterer deploy uavhengig.

#### Scenario: Workflow trigges når PR mot master åpnes

- **WHEN** en utvikler pusher en feature-gren og åpner PR mot `master`
- **THEN** GitHub starter et workflow-run for `ci.yml` automatisk og en sjekk ved navn `build` vises i PR-UIet

#### Scenario: Workflow kjører forventet steg-sekvens

- **WHEN** workflow-runet starter
- **THEN** stegene kjøres i rekkefølgen: `actions/checkout@v4` → `actions/setup-node@v4` (med `node-version: '22'` og `cache: 'npm'`) → `npm ci` → `npm run lint` → `npm run build`

#### Scenario: Workflow trigges ikke på push direkte til master

- **WHEN** en commit pushes direkte til `master` (uten PR)
- **THEN** `ci.yml` starter ikke et nytt run (kun `pull_request`-events er konfigurert)

### Requirement: Workflow rapporterer rødt ved kompileringsfeil og grønt ved suksess

Workflowen SHALL avslutte med exit code 0 (grønn sjekk) hvis og bare hvis alle steg fullfører uten feil. Hvis `npm ci`, `npm run lint`, eller `npm run build` returnerer ikke-null exit code, MUST jobben markeres som rød i PR-UIet og blokkere merge når branch protection er aktiv.

#### Scenario: Lint-feil gjør sjekken rød

- **WHEN** en PR introduserer en ESLint-feil som `npm run lint` rapporterer
- **THEN** `build`-jobben feiler, sjekken vises som rød i PR-UIet, og branch-protection-regelen blokkerer Merge-knappen

#### Scenario: TypeScript-feil i build gjør sjekken rød

- **WHEN** en PR introduserer en TypeScript-typefeil
- **THEN** `npm run build`-steget feiler (Next build typesjekker), `build`-jobben markeres som rød, og merge blokkeres

#### Scenario: Ren PR gir grønn sjekk

- **WHEN** en PR med kode som passerer både lint og build pushes
- **THEN** workflowen fullfører uten feil og `build`-sjekken vises som grønn i PR-UIet

### Requirement: Supabase-env tilgjengelig for build når nødvendig

Hvis `next build` krever `NEXT_PUBLIC_SUPABASE_URL` og/eller `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for å fullføre, SHALL disse leveres til build-steget via GitHub Actions **repository variables** (`vars.*`), ikke secrets. Variablene MUST eksponeres som `env:` på build-steget i workflow-fila. Verdiene er per definisjon offentlige (`NEXT_PUBLIC_`-prefiks inliner dem i klient-bundle) og lagres derfor som variables, ikke secrets.

Hvis bygget passerer uten disse envene, SHALL workflowen IKKE referere dem (hold workflowen minimal).

#### Scenario: Build i CI passerer når env-variabler er satt

- **WHEN** `NEXT_PUBLIC_SUPABASE_URL` og `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` er konfigurert som repository variables, og workflowen kjører `npm run build`
- **THEN** Next.js leser variablene via `process.env` og build-steget fullfører uten "missing env"-feil

#### Scenario: Workflow refererer ikke env-vars unødvendig

- **WHEN** bygget viser seg å passere uten Supabase-env i CI
- **THEN** workflow-fila inneholder ingen `env:`-blokk med `NEXT_PUBLIC_SUPABASE_*` (holdes minimal)

### Requirement: Branch protection på master krever grønn CI-sjekk før merge

`master`-grenen SHALL ha branch protection slått på i GitHub-repoets innstillinger med regelen "Require status checks to pass before merging" aktivert, og sjekken `build` (workflow-jobbens navn) MUST være valgt som påkrevd. Beskyttelsen slås på manuelt av maintainer (Geir) via GitHub Settings → Branches → Add rule, *etter* at workflowen har kjørt minst én gang på en PR (sjekken er ellers ikke valgbar i UI-et).

Mens branch protection er aktiv, SHALL GitHub-UIet vise Merge-knappen som disabled på enhver PR der `build`-sjekken er rød eller mangler.

#### Scenario: Merge blokkeres når CI er rød

- **WHEN** en PR har `build`-sjekken markert som rød
- **THEN** GitHub viser Merge-knappen som disabled med "Required statuses must pass before merging"

#### Scenario: Merge tillates når CI er grønn

- **WHEN** alle nødvendige sjekker (inkludert `build`) er grønne på en PR
- **THEN** Merge-knappen aktiveres og PR-en kan merges manuelt av maintainer

#### Scenario: Branch protection-rekkefølge er dokumentert

- **WHEN** workflow-fila legges til som ny capability og branch protection ennå ikke er på
- **THEN** workflowen MUST ha kjørt minst ett run på en PR før Geir kan velge `build` som påkrevd sjekk i branch-protection-UIet — denne rekkefølgen MUST dokumenteres i `openspec/PR-WORKFLOW.md`

### Requirement: AGENTS.md og PR-WORKFLOW.md reflekterer full nivå

`AGENTS.md` SHALL ikke lenger inneholde påstanden "Ingen branch-beskyttelse eller CI på lett nivå — PR-en er disiplin, ikke tvang". Tilsvarende setning i `openspec/PR-WORKFLOW.md` ("Lett nivå = ingen branch-beskyttelse, ingen CI som blokkerer. PR-en er frivillig disiplin.") SHALL erstattes med tekst som angir at CI-gaten gater merge og at `master` er beskyttet.

Begge filene SHALL nevne at workflow-jobbens navn er `build` og at branch-protection-regelen krever den.

#### Scenario: AGENTS.md angir full nivå

- **WHEN** en utvikler leser `AGENTS.md` etter changen er merged
- **THEN** filen sier at hver PR mot `master` må passere `build`-CI-sjekken før merge, og at branch protection er PÅ

#### Scenario: PR-WORKFLOW.md angir full nivå

- **WHEN** en utvikler leser `openspec/PR-WORKFLOW.md` etter changen er merged
- **THEN** filen reflekterer at CI gater PR-er, beskriver `build`-sjekken som påkrevd, og forklarer rekkefølge-fakta (workflow må kjøre én gang før branch protection kan referere sjekken)

### Requirement: CI gjør ingen deploy og inneholder ingen test-steg

Workflowen SHALL utelukkende være en gate — ingen deploy, ingen publish, ingen artifact-upload utover det GitHub Actions logger som standard. Workflowen SHALL NOT inneholde et test-steg så lenge ingen testsuite eksisterer i repoet; et tomt test-steg er eksplisitt forbudt.

#### Scenario: Workflow deployer ikke

- **WHEN** workflow-fila leses
- **THEN** den inneholder ingen Vercel-, Netlify-, deploy-, publish- eller release-steg

#### Scenario: Workflow har intet test-steg før tester eksisterer

- **WHEN** workflow-fila leses og repoet ikke inneholder en testsuite
- **THEN** workflowen kjører ikke `npm test` eller tilsvarende, og inneholder ingen placeholder-/dummy-test-steg

