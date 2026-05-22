## 1. Forberedelse

- [x] 1.1 Bekreft at vi står på `feature/infra-ci-gate`-grenen og at den er opprettet fra fersk master (`git status` + `git log --oneline -3`).
- [x] 1.2 Les `.github/`-mappen for å bekrefte at den ikke eksisterer fra før (workflowen er ny — ingen risiko for å overskrive).
- [x] 1.3 Les relevant Next.js-docs i `node_modules/next/dist/docs/` om build-prosessen i CI-miljø hvis behov for å bekrefte env-krav (per AGENTS.md). _Hoppet over som unødvendig: koden (src/lib/supabase/{server,client}.ts) leser process.env og kaster eksplisitt ved manglende variabler — kjent risiko håndteres i steg 3.5._

## 2. Workflow-fil

- [x] 2.1 Opprett `.github/workflows/` (mappe finnes ikke fra før).
- [x] 2.2 Skriv `.github/workflows/ci.yml` med:
  - `name: CI`
  - Trigger: `on: pull_request: branches: [master]` (kun pull_request, ikke push)
  - Én jobb med navn `build` som kjører på `ubuntu-latest`
  - Steg i rekkefølge: `actions/checkout@v4` → `actions/setup-node@v4` (med `node-version: '22'` og `cache: 'npm'`) → `npm ci` → `npm run lint` → `npm run build`
- [x] 2.3 Verifiser at YAML-fila parser uten feil (ingen tabs, riktig innrykk; bruk `node -e "require('js-yaml').load(...)"` eller åpne i editor som flagger YAML-feil).

## 3. Førstegangs CI-run for å verifisere build

- [x] 3.1 Commit workflow-fila på `feature/infra-ci-gate`-grenen.
- [x] 3.2 Push grenen: `git push -u origin feature/infra-ci-gate`.
- [x] 3.3 Åpne PR: `gh pr create --fill --base master`. Rapporter PR-URL. _PR #2._
- [x] 3.4 Observer at workflow-runet starter automatisk på PR-en. Vent på resultat.
- [x] 3.5 **Hvis bygget feiler pga manglende Supabase-env** (`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`): Rapporter konkret feilmelding til Geir, be ham legge dem inn som **repository variables** i GitHub (Settings → Secrets and variables → Actions → Variables-fanen, ikke Secrets). Når lagt inn: oppdater `ci.yml` med `env:`-blokk på build-steget som leser `${{ vars.NEXT_PUBLIC_SUPABASE_URL }}` og `${{ vars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }}`. Commit + push for å re-trigge. _Ikke aktivert: NEXT_PUBLIC_*-envene viste seg å ikke trengs ved build (Supabase-klientene instansieres ved request-tid, ikke ved module-load). Den faktiske blokkeren var DATABASE_URL (en ekte secret) — håndtert via 3.6._
- [x] 3.6 **Hvis bygget feiler av annen grunn**: Diagnostiser, fix på grenen, commit + push, re-observer. _Faktisk forløp: (a) første run feilet på `npm run lint` pga pre-eksisterende lint-debt i master (12 tomme `interface Props {}` i forside-komponenter, fanget av `@typescript-eslint/no-empty-object-type`). Løst via separat PR #3 `chore/fix-lint-debt`, deretter rebase. (b) Andre run feilet på `npm run build` med "DATABASE_URL is not set" (Drizzle-import i `/smoke`). Løst ved å legge til dummy DATABASE_URL i workflowens `env:`-blokk for build-steget — bygget kontakter aldri DB-en, kun import-check trengs._
- [x] 3.7 **Hvis bygget passerer uten env-vars**: Ikke legg `env:` til workflowen (hold den minimal — per spec). _Ikke gjeldende: bygget krevde dummy DATABASE_URL for module-evaluation. `env:`-blokk med kommentar lagt til på build-steget._
- [x] 3.8 Bekreft at workflowen er grønn på siste run før vi går videre. _Run 26285059484, 29s, grønn._

## 4. Dokumentasjon

- [x] 4.1 Oppdater `AGENTS.md`: Erstatt bullet-en "Ingen branch-beskyttelse eller CI på lett nivå — PR-en er disiplin, ikke tvang. Hvis Code finner seg selv å committe rett på master ved uhell, stopp og lag grenen i ettertid." med en bullet som sier at hver PR mot `master` må passere `build`-CI-sjekken før merge, og at branch protection er PÅ på master. Behold `<!-- BEGIN:pr-workflow -->`-blokken intakt.
- [x] 4.2 Oppdater `openspec/PR-WORKFLOW.md`:
  - Endre tittel-undertekst hvis nødvendig (fra "(lett nivå)" til "(full nivå)") — bevar resten av strukturen.
  - I "Forutsetninger"-tabellen: legg til/oppdater rad om "Branch protection på `master`" til **PÅ, krever grønn `build`-CI-sjekk**.
  - Erstatt setningen "Lett nivå = ingen branch-beskyttelse, ingen CI som blokkerer. PR-en er frivillig disiplin. Tvang kan strammes til 'full' nivå senere som egen jobb." med tilsvarende setning som beskriver full nivå: CI-sjekken `build` må være grønn før merge, branch protection blokkerer ellers.
  - Oppdater FAQ-raden "Hva med beskyttelse mot å pushe rett på master ved et uhell?": Reflekter at branch protection nå er PÅ og blokkerer rett-push (eller direkte push av non-FF, avhengig av reglen).
  - Legg til en kort note om rekkefølge-fakta: workflowen må ha kjørt minst én gang før Geir kan velge `build` som påkrevd sjekk i branch-protection-UIet — derfor er denne PR-en sin egen demo.
- [x] 4.3 Commit dokumentasjons-oppdateringene på samme PR.
- [x] 4.4 Push og verifiser at workflowen kjører grønt på den oppdaterte commiten.

## 5. Geir gjør sin del (utenfor Code)

Disse stegene utføres av Geir manuelt etter at Code rapporterer at PR-en er klar. Code venter på bekreftelse før archive.

- [x] 5.1 Geir reviewer diffen på PR-en (workflow-fila + dokumentasjons-edits).
- [x] 5.2 Geir verifiserer Vercel preview-URL (kommentar fra Vercel-boten på PR-en) — sanity check at appen fortsatt bygger på Vercel parallelt.
- [x] 5.3 Geir merger PR-en på GitHub når fornøyd.
- [x] 5.4 Geir går til GitHub → Settings → Branches → Add branch protection rule for `master`:
  - Branch name pattern: `master`
  - Krysser av "Require status checks to pass before merging"
  - Krysser av "Require branches to be up to date before merging" (anbefalt — gjør at PR må rebase mot fersk master før merge)
  - I "Status checks that are required"-søkefeltet: finn og velg `build` (nå tilgjengelig fordi workflowen har kjørt)
  - Lagrer regelen
- [x] 5.5 Geir bekrefter til Code at branch protection er PÅ.

## 6. Verifisering at gaten faktisk gater

- [x] 6.1 (Valgfritt, anbefalt) Geir eller Code åpner en triviell test-PR (f.eks. `chore/ci-gate-verify` som introduserer en bevisst lint-feil) og bekrefter at:
  - Workflowen kjører
  - Sjekken blir rød
  - Merge-knappen er disabled med "Required statuses must pass before merging"
  _Hoppet over som syntetisk test — gating ble bevist organisk: PR #2 run 1 feilet på ekte lint-debt, run 2 feilet på ekte DATABASE_URL-mangling. Workflowen kjørte og rapporterte rødt korrekt. Branch protection ble slått på etter merge, så Merge-disabled-oppførselen verifiseres på neste PR uansett._
- [x] 6.2 Lukk test-PR-en uten å merge; slett grenen. _N/A — 6.1 hoppet over._
- [x] 6.3 (Hvis 6.1 ikke kjøres) Vent på neste reelle PR (E3-auth) for å bekrefte gating i praksis. _Pågående: E3-auth PR vil bekrefte gating + Merge-disabled når den åpnes._

## 7. Arkivering

- [x] 7.1 Kjør `/opsx:archive infra-ci-gate` på grenen (eller på master etter merge — Code velger basert på workflow-konvensjon). Archive-commiten lander som siste commit på grenen før merge, eller som separat commit på master etter merge, per `openspec/PR-WORKFLOW.md`. _Faktisk forløp: archive kjøres på egen `chore/archive-infra-ci-gate`-branch via PR, fordi master nå er låst av branch protection som ble slått på etter merge av PR #2._
- [x] 7.2 Verifiser at `openspec/specs/ci-gate/` er opprettet etter sync (archive flytter delta-spec inn i hovedspec-treet). _Verifisert: `openspec/specs/ci-gate/spec.md` opprettet med 6 requirements + scenarier (ADDED-only sync). Purpose-feltet er placeholder per OpenSpec-konvensjon._
- [x] 7.3 Verifiser at `openspec/changes/infra-ci-gate/` er flyttet til `openspec/changes/archive/`. _Verifisert: changen er flyttet til `openspec/changes/archive/2026-05-22-infra-ci-gate/`._
