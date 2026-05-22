## Context

PR-workflowen lever på "lett nivå" siden `chore/pr-workflow-test`-PR-en ble merget tidligere på master: feature-branch + manuell diff-review + Vercel-preview, men ingen automatisert gate som blokkerer merge hvis koden ikke kompilerer. Mandatet `infra-ci-gate` skifter nivå til "full" ved å legge en GitHub Actions-workflow foran merge-knappen og slå på branch protection som krever at workflowen er grønn.

Gjeldende state:
- Default branch: `master`. Repo: `https://github.com/Geir74/geish_v2`.
- `package.json`-scripts som finnes: `dev`, `build`, `start`, `lint`, `db:generate`, `db:push`. Ingen `typecheck`-script (Next build dekker typesjekk).
- Vercel ↔ GitHub git-integration er PÅ. Preview-builds per PR genereres på `geish-v2-git-<branch>-...vercel.app`.
- Auth/Supabase: `NEXT_PUBLIC_SUPABASE_URL` og `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` brukes via `@supabase/ssr`. Klient-fabrikkene kaster eksplisitt feil hvis envene mangler — det gjør at `next build` kan feile i CI-miljøet uten dem.
- Ingen tester eksisterer. Ingen `__tests__/`, ingen jest/vitest-konfig.
- E3-auth-changen er under arbeid på `feature/e3-auth`-grenen og skal lande gjennom den nye gaten når den er på plass.

Stakeholders: Geir er eneste maintainer. Code agenten produserer endringene; Geir reviewer + merger + slår på branch protection manuelt.

## Goals / Non-Goals

**Goals:**

- En PR mot `master` trigger automatisk en GitHub Actions-workflow som kjører `npm ci` → `npm run lint` → `npm run build`.
- Workflowen blir rød hvis noen av stegene feiler, grønn ellers — synlig som en sjekk i PR-UIet.
- Branch protection på `master` (manuelt slått på av Geir etter første grønne run) blokkerer merge til sjekken er grønn.
- Vercel preview-flyten er uendret; CI legger seg ved siden av previewen.
- `AGENTS.md` og `PR-WORKFLOW.md` reflekterer at CI/branch-protection er aktivt.

**Non-Goals:**

- Lighthouse CI, Dependabot/Renovate, automatisert PR-review, Prettier-i-CI — backlog.
- Test-runner / test-steg — det finnes ingen tester ennå; tomt test-steg legges *ikke* til.
- Deploy fra CI — Vercel håndterer deploy via git-integration, uendret.
- Endringer i selve PR-rutinen (grener, `gh pr create`, review-flyt) — gaten legger en automatisk dørstopper foran eksisterende manuelt merge-steg, men erstatter ingen del av rutinen.
- E3-auth-implementering — egen change. Gaten skal være på plass *før* E3 lander, ikke kombineres med den.
- Automatisering av branch protection-innstillingen — det er en repo-innstilling Geir slår på i GitHub UI; Code leverer kun workflow-fila og dokumentasjon.

## Decisions

### 1. Workflow-trigger: kun `pull_request` mot `master`

Trigger på `pull_request` med `branches: [master]`. **Ikke** trigger på `push` til master.

Rasjonale: Etter branch protection er PÅ skal det uansett ikke pushes rett på master — alle endringer går gjennom PR. Å legge til `push`-trigger ville duplisere kjøring (samme commit kjører både som PR og som push når den merges) uten å fange noe nytt. Mandatets anbefaling er eksplisitt "kun pull_request — hold det enkelt".

Alternativ vurdert: `push` til master i tillegg. Avvist — duplikat-kjøring, ingen ny dekning.

### 2. Stegssekvens: checkout → setup-node → npm ci → lint → build

Workflowen kjører fire steg etter checkout:
1. `actions/checkout@v4`
2. `actions/setup-node@v4` med `node-version: '22'` og `cache: 'npm'`
3. `npm ci`
4. `npm run lint`
5. `npm run build`

Rasjonale:
- `npm ci` (ikke `npm install`) — reproduserbar installasjon fra lockfile, raskere i CI.
- `lint` før `build` — billigere steg først, gir raskere feedback ved trivielle feil.
- `next build` typesjekker allerede via TypeScript-integrasjon; et separat `tsc --noEmit`-steg er redundant og legger til ~10–20s for null gevinst.
- `setup-node@v4` med `cache: 'npm'` gir gratis cache av `~/.npm` basert på lockfile-hash.

Alternativ vurdert: Legge til `npm run typecheck` som eget steg. Avvist — finnes ikke som script, og `next build` dekker det. Å legge til scriptet bare for CI ville være kosmetikk.

### 3. Node-versjon: 22 (gjeldende LTS)

`node-version: '22'` i `setup-node`. Vercel bygger med Node 22 som default for nye prosjekter, så CI-miljøet matcher prod-miljøet.

Alternativ vurdert: 20 (forrige LTS). Avvist — 22 er aktiv LTS siden 2024-10 og blir Vercels default. Å matche Vercel reduserer "fungerer i CI, feiler på Vercel"-divergens.

Alternativ vurdert: Matrise over flere Node-versjoner. Avvist — vi deployer kun på én Node-versjon (Vercels), så matrise er bortkastet CI-tid.

### 4. Supabase-env: repository variables, ikke secrets

Hvis `next build` feiler uten `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, legges de inn som GitHub Actions **repository variables** (`vars.NEXT_PUBLIC_SUPABASE_URL`), ikke secrets. Brukes i workflowen som `env:` på build-steget.

Rasjonale: `NEXT_PUBLIC_`-prefikset gjør at Next.js inliner verdiene i klient-bundle ved build. De er per definisjon offentlige (allerede synlige for hvilken som helst nettleser som besøker siden). Secrets-mekanismen er for hemmeligheter; variables-mekanismen er for offentlig konfig. Riktig verktøy for jobben.

Mandatet er eksplisitt: Code verifiserer først at bygget passerer *uten* envene satt. Hvis ja → ikke legg dem til. Hvis nei → legg til som variables.

Alternativ vurdert: Secrets. Avvist — disse er ikke hemmeligheter; å lagre dem som secrets gir et falskt sikkerhetssignal.

Alternativ vurdert: Hardkode i workflow-fila. Avvist — verdiene byttes hvis Supabase-prosjektet flytter; sentralisert i repo-innstillinger er bedre.

### 5. Branch protection settes manuelt av Geir, ikke automatiseres

Workflow-fila committes som kode. Branch protection-regelen (krev grønn CI-sjekk før merge) slås på via GitHub Settings → Branches → Add rule, manuelt, av Geir, *etter* at workflowen har kjørt minst én gang på en PR.

Rasjonale: Branch protection er en repo-innstilling, ikke kode. GitHub Actions API-et kan endre den, men det krever ekstra autentisering og er overkill for en enkel "PÅ"-bryter som settes én gang. Mandatet er eksplisitt: Geir slår den på selv.

Viktig rekkefølge-fakt: Sjekken er ikke valgbar i branch-protection-UIet før den har eksistert som en kjørt workflow minst én gang. Derfor: Code leverer workflow-fila → Code åpner PR → workflowen kjører på sin egen PR → Geir reviewer + merger → Geir slår på branch protection. Denne PR-en er "demoen" som beviser at gaten virker.

Alternativ vurdert: Bruke `gh api` til å sette branch protection programmatisk. Avvist — krever PAT med ekstra scopes, og det er én bryter Geir trykker én gang. Manuelt er enklere og tydeligere.

### 6. Dokumentasjons-edits: kirurgiske, bevar struktur

`AGENTS.md` har en `<!-- BEGIN:pr-workflow -->` / `<!-- END:pr-workflow -->`-blokk med oppskriften. Den ene viktige linjen er bullet-en "Ingen branch-beskyttelse eller CI på lett nivå — PR-en er disiplin, ikke tvang. Hvis Code finner seg selv å committe rett på master ved uhell, stopp og lag grenen i ettertid." Den erstattes med en linje som sier at CI nå gater PR-er og at branch protection er PÅ på `master`.

`PR-WORKFLOW.md` har en større nivå-beskrivelse i forutsetningstabellen og i avsnittet "Lett nivå = ingen branch-beskyttelse...". Den oppdateres til full nivå med formulering om at CI-sjekken må være grønn før merge tillates. Tabellraden om branch-protection oppdateres fra "ingen" til "PÅ på master, krever grønn CI-sjekk".

Rasjonale: Bevar eksisterende dokumentstruktur (HTML-kommentar-markører i AGENTS.md, tabell + headings i PR-WORKFLOW.md). Minimale edits, ingen omskrivning.

## Risks / Trade-offs

- **[Risk] `next build` feiler i CI uten Supabase-env** → Mitigation: Code verifiserer først ved å åpne en PR uten env-vars satt; hvis bygget feiler med konkret melding om manglende env, legger Geir inn `NEXT_PUBLIC_SUPABASE_URL` og `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` som repository variables og Code pusher en triviell endring for å re-trigge bygget. Workflowen leser dem som `env:` på build-steget.
- **[Risk] Branch protection-sjekk-navn må matche workflow-jobben** → Mitigation: Gi jobben et stabilt, beskrivende navn (`build`) som Geir skriver inn ordrett i branch-protection-regelen. Dokumenter navnet i PR-WORKFLOW.md slik at det ikke kan trekkes feil.
- **[Risk] npm ci feiler hvis lockfile er ute av sync med package.json** → Akseptabel feilmodus: Det er nettopp den slags inkonsistens gaten *skal* fange. Lokal `npm install` etterfulgt av commit av lockfile er den normale workflowen.
- **[Risk] Vercel-preview-build og CI-build avviker (forskjellige Node-versjoner, forskjellig miljø)** → Mitigation: Bruk Node 22 i CI for å matche Vercel. Aksepter at full paritet er umulig (Vercel har egen build-infra); CI-build er "kompilerer dette i et rent miljø?", ikke "deployer dette eksakt som Vercel gjør det?".
- **[Trade-off] Ingen test-runner → ingen test-coverage-gate.** Akseptert: vi har ingen tester ennå. Når tester legges til (egen backlog-jobb), legges et `npm test`-steg til workflowen samtidig. Ikke pre-empt det nå med tomt steg.
- **[Trade-off] Manuell branch protection → glemmes-risiko.** Akseptert: Geir er eneste maintainer; han slår den på etter første grønne run. Documentert i tasks.md som eksplisitt steg.
- **[Risk] Workflowen kjører på sin egen PR — hvis den feiler her, har vi en kylling-og-egg-situasjon** → Mitigation: Hvis første run feiler, fix på samme PR (push nye commits til `feature/infra-ci-gate`); workflowen kjører nytt run automatisk. Branch protection er ikke på ennå, så Geir kan merge den selv om gaten skulle være rød (men hele poenget er at den skal være grønn — hvis ikke, fix først).

## Migration Plan

1. Code lager `feature/infra-ci-gate`-grenen fra fersk master.
2. Code skriver `.github/workflows/ci.yml` og oppdaterer `AGENTS.md` + `PR-WORKFLOW.md`.
3. Code pusher grenen og åpner PR med `gh pr create --fill --base master`.
4. Workflowen kjører automatisk på PR-en. Code observerer resultatet:
   - **Grønn:** Rapporter PR-URL + Vercel-preview-URL til Geir. Hopp til steg 6.
   - **Rød pga manglende Supabase-env:** Rapporter feilen + presis env-variabel til Geir, som legger dem inn som repository variables, og Code pusher en triviell commit (whitespace e.l.) for å re-trigge. Re-observer.
   - **Rød av annen grunn:** Diagnostiser, fix på grenen, push, re-observer.
5. Når CI er grønn → Geir reviewer diff + merger PR-en.
6. Geir slår på branch protection: GitHub → Settings → Branches → Add rule for `master` → Require status checks to pass before merging → velg sjekken `build` fra dropdown (nå tilgjengelig fordi workflowen har kjørt).
7. Verifisering: Geir åpner en hvilken som helst test-PR (eller venter på neste reelle PR, f.eks. E3-auth) og bekrefter at merge-knappen er disabled til CI er grønn.

Rollback-strategi: Hvis gaten viser seg å være for streng eller blokkere legitim merge, kan Geir midlertidig slå AV branch protection-regelen i GitHub UI uten å rulle tilbake workflow-fila. Workflowen kjører fortsatt, men blokkerer ikke merge. Workflow-fila kan også slettes via en PR hvis gaten droppes permanent (usannsynlig).

## Open Questions

Ingen åpne spørsmål gjenstår — mandatets tre spørsmål er besvart i Decisions:
- Node-versjon: 22 (Decision 3)
- Supabase-env i CI: Code verifiserer først; hvis nødvendig, repository variables (Decision 4)
- Trigger: kun `pull_request` (Decision 1)
