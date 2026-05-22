---
project: geish.no v2
feature: infra-ci-gate
date: 2026-05-22
type: brownfield
status: ready
---

# Mandat: PR-workflow FULL nivå — CI-gate + branch protection

## Mål

Heve PR-workflowen fra "disiplin" til "tvang": legge til en minimal CI-gate (GitHub Actions) som kjører på hver PR mot `master`, og slå på branch protection som krever at gaten er grønn før merge. Resultatet er at en knust build aldri kan nå `master` — for alltid, for alle epics etter dette. Lett nivå (feature-branch + PR + manuell diff-review) er allerede levert; dette er FULL nivå fra backloggen.

Viktig avgrensning i forståelse: CI-gaten gjør IKKE auth-koden trygg. Den fanger brukne typer, imports og kompileringsfeil — ikke feil cookie-domene eller open redirects (de fanges av manuell verifisering og review). Gaten er en byggeinspektør, ikke en sikkerhetsrevisor.

## Scope

### Inn

- **`.github/workflows/ci.yml`** — en GitHub Actions-workflow som:
  - Trigges på `pull_request` mot `master`.
  - Kjører: checkout → sett opp Node (LTS) → `npm ci` → `npm run lint` → `npm run build`.
  - `next build` typesjekker allerede, så et separat `tsc`-steg er unødvendig.
- **Branch protection på `master`** — dokumenteres som et manuelt GitHub-innstillingssteg Geir utfører selv (det er en repo-innstilling, ikke kode). Regel: krev at CI-sjekken er grønn før merge tillates. NB på rekkefølge: branch protection kan først kreve en sjekk *etter* at workflowen har kjørt minst én gang (ellers er ikke sjekken valgbar i UI-et).
- **Oppdater `AGENTS.md`** — erstatt linja "Ingen branch-beskyttelse eller CI på lett nivå — PR-en er disiplin, ikke tvang" med tekst som reflekterer at CI nå gater PR-er og at `master` er beskyttet.
- **Oppdater `openspec/PR-WORKFLOW.md`** — samme: CI må være grønn før merge, branch protection er PÅ.

### Ut

- **Lighthouse CI, Dependabot / Renovate, automatisert PR-review, Prettier-i-CI** — alt sammen kaninhull. Blir egne backlog-jobber senere, IKKE nå.
- **Test-runner / test-steg i CI** — det finnes ingen tester ennå; ikke legg til et tomt test-steg.
- **Deploy fra CI** — Vercel håndterer deploy via git-integration som før. CI er KUN en gate, den deployer ingenting.
- **Endringer i selve PR-rutinen** (grener, `gh pr create`, etc.) — den står som i AGENTS.md; FULL legger bare en automatisk dørstopper foran det eksisterende manuelle merge-steget.
- **E3-implementering** — egen change. Denne gaten skal være på plass *før* E3-PR-en lander, så E3 flyter gjennom den uendret.

## Delta-type

**Type:** brownfield

Berører repo-rot (`.github/workflows/` opprettes), `AGENTS.md` og `openspec/PR-WORKFLOW.md` (dokumentasjon oppdateres). Rører ingen app-kode, ingen `src/`, ingen avhengigheter.

## Suksesskriterier

- [ ] En PR mot `master` trigger workflowen automatisk.
- [ ] Workflowen kjører `npm ci` → `lint` → `build` og blir RØD hvis noen feiler, GRØNN ellers.
- [ ] Branch protection på `master` (slått på av Geir) blokkerer merge til CI-sjekken er grønn.
- [ ] Vercel preview-flyten er uendret: preview-build per PR, Geir leser diff + preview og merger manuelt når fornøyd. Gaten kan si nei for ham, aldri ja på hans vegne.
- [ ] `AGENTS.md` og `PR-WORKFLOW.md` reflekterer at CI/branch-protection nå er aktivt.

## Constraints

- **Default branch er `master`** — workflowen trigges på PR mot `master`, ikke `main`.
- **Hold det minimalt.** Kun `lint` + `build`. Ingen ekstra verktøy, ingen matrise over flere Node-versjoner, ingen fancy caching utover det `setup-node` gir gratis.
- **Branch protection settes av Geir i GitHub-innstillinger**, ikke av Code. Code leverer workflow-fila; Geir slår på beskyttelsen etter at workflowen har kjørt én gang.
- **`next build` kan trenge Supabase-env i CI.** Hvis bygget feiler uten `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, legg dem inn som GitHub Actions **repository variables** (de er `NEXT_PUBLIC_`-prefikset = offentlige, så de trenger ikke være secrets). Code verifiserer at bygget faktisk passerer i CI-miljøet uten `.env.local`.
- Per `AGENTS.md`: les relevant guide i `node_modules/next/dist/docs/` før kode skrives — denne Next.js-versjonen har breaking changes.

## Kontekst for Code

- Lett nivå er levert: feature-branch + PR + manuell diff-review fungerer, og en test-PR er allerede merget på `master`.
- Vercel ↔ GitHub git-integration er PÅ; preview-URL-er som `https://geish-v2-git-<branch>-...vercel.app`. CI legger seg ved siden av previewen, erstatter den ikke.
- `package.json`-scripts som finnes i dag: `dev`, `build`, `start`, `lint`, `db:generate`, `db:push`. Det finnes ikke noe `typecheck`-script (unødvendig — `next build` dekker det).
- Denne changen er liten nok til å være sin egen PR. Foreslått pedagogisk flyt: Code lager workflowen på `feature/infra-ci-gate`, åpner PR — og workflowen kjører da på sin egen PR, som beviser at den virker — Geir reviewer + merger, og slår *deretter* på branch protection.

## Åpne spørsmål

- **Node-versjon i CI:** Code velger gjeldende LTS (20 eller 22) — bør matche det Vercel bygger med.
- **Trenger `next build` Supabase-env i CI?** Code tester; hvis ja, legg `NEXT_PUBLIC_`-variablene inn som repository variables (se Constraints).
- **Kun `pull_request`, eller også `push` til master?** Anbefaling: kun `pull_request` — etter branch protection skal det uansett ikke pushes rett på `master`. Code avgjør, men hold det enkelt.
