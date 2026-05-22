## Why

PR-workflowen er i dag "lett nivå": disiplin, ikke tvang. En knust build kan nå `master` hvis Geir merger uten å sjekke previewen først, eller hvis noen committer rett på master ved et uhell. Mandatet `infra-ci-gate` (FULL nivå fra backloggen) skal lukke det hullet før E3-auth lander — gaten må stå på plass *før* den første reelle feature-PR-en passerer gjennom den.

## What Changes

- Legg til `.github/workflows/ci.yml` som kjører på `pull_request` mot `master`: checkout → setup-node (LTS) → `npm ci` → `npm run lint` → `npm run build`. Ingen separat `tsc`-steg (Next build typesjekker), ingen test-runner (det finnes ingen tester), ingen deploy (Vercel håndterer det via git-integration).
- Dokumenter at branch protection på `master` slås på manuelt av Geir i GitHub UI etter at workflowen har kjørt sin første grønne run (sjekken er ikke valgbar før den har eksistert minst én gang).
- Oppdater `AGENTS.md` — fjern setningen "Ingen branch-beskyttelse eller CI på lett nivå — PR-en er disiplin, ikke tvang", erstatt med tekst som reflekterer at CI nå gater PR-er og at `master` er beskyttet.
- Oppdater `openspec/PR-WORKFLOW.md` — flytt fra "lett nivå" til "full nivå": CI-sjekken må være grønn før merge, branch protection er PÅ.
- Verifiser at `next build` faktisk passerer i CI-miljøet uten `.env.local`. Hvis bygget krever Supabase-env, legg `NEXT_PUBLIC_SUPABASE_URL` og `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` inn som GitHub Actions **repository variables** (ikke secrets — de er offentlige).

## Capabilities

### New Capabilities

- `ci-gate`: GitHub Actions-workflow som gater hver PR mot `master` ved å kjøre lint og build, sammen med dokumentert branch protection-policy som krever grønn sjekk før merge. Capabilityens scope er kun gating-mekanismen — selve PR-workflowen (grenkonvensjon, `gh pr create`, review-flyt) hører fortsatt under prosessdokumentasjon, ikke spec.

### Modified Capabilities

Ingen. Changen rører ikke app-kode eller eksisterende specs (blog, design-system, homepage, manifest, project-foundation).

## Impact

- **Nye filer:** `.github/workflows/ci.yml`.
- **Endrede filer:** `AGENTS.md`, `openspec/PR-WORKFLOW.md`.
- **Repo-innstillinger (utenfor kode):** Branch protection på `master` slås på manuelt av Geir; eventuelt `NEXT_PUBLIC_SUPABASE_*` lagt inn som repository variables hvis bygget krever det.
- **Ingen app-kode endres.** Ingen avhengigheter legges til eller fjernes. `src/`, `package.json` og lockfile rører ikke.
- **CI-tid per PR:** Forventet ~1–2 minutter (npm ci + lint + next build). Vercel preview-build kjører parallelt og uavhengig.
- **Pedagogisk bonus:** Workflowen kjører på sin egen PR (`feature/infra-ci-gate`) som første run — beviser at den virker før Geir slår på branch protection.
