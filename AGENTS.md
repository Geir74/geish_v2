<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:pr-workflow -->
# Workflow: feature-branch + PR (ikke commit-rett-på-master)

Hver OpenSpec-change kjøres på en feature-branch og lander via pull request — ikke direkte på master. Full oppskrift: `openspec/PR-WORKFLOW.md`.

**Default rutine for hver change:**

1. `git checkout master && git pull` — start fra fersk master.
2. `git checkout -b feature/<change-navn>` — gren navngis etter changen (`feature/e3-auth`, osv.).
3. Kjør OpenSpec-loopen på grenen: `/opsx:propose` → `/opsx:apply` → `/opsx:archive`. Alle commits, inkludert archive-commiten, lander på grenen.
4. `git push -u origin feature/<change-navn>` — push. Vercel starter preview-build automatisk (git-integration er PÅ).
5. `gh pr create --fill --base master` — åpne PR. Code har `gh` tilgjengelig og bør gjøre dette automatisk.
6. Pause. Rapporter PR-URL til Geir, som leser diffen + Vercel-preview før merge.
7. Geir merger via GitHub når fornøyd og sletter grenen der.
8. `git checkout master && git pull && git branch -d feature/<change-navn>` — hent merged kode, slett lokal gren.

**Viktig:**
- Default branch er **`master`**, ikke `main`. Bruk `master` i alle git-kommandoer og PR-er.
- Vercel ↔ GitHub git-integration er PÅ; preview-URL-er genereres som `https://geish-v2-git-<branch>-...vercel.app`. Inkluder denne i PR-rapporten hvis tilgjengelig.
- CI gater hver PR mot `master`: workflow `.github/workflows/ci.yml` kjører `npm ci → lint → build` og sjekken må være grønn før merge tillates. Branch protection på `master` er PÅ (krever `build`-sjekken). Push rett til `master` blokkeres av GitHub; alle endringer går gjennom PR.
- Ikke åpne PR mot prosess-changes/infra med mindre Geir ber om det (denne fila ble laget på master som et engangs-oppsett).
<!-- END:pr-workflow -->
