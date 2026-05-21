---
project: geish.no v2
feature: infra-pr-workflow
date: 2026-05-21
type: infra
status: draft
---

# Mandat: Infra — PR-workflow (lett nivå)

> **Merk:** Dette er et *infrastruktur/prosess*-mandat, ikke en OpenSpec-feature. Det endrer ikke hva siden gjør (ingen `specs/`-capability berøres), så det går ikke gjennom propose→apply→sync→archive på vanlig måte. Det er et engangsoppsett + en ny arbeidsvane. Code kan utføre git-stegene direkte; selve oppsettet dokumenteres som en oppskrift i repoet + GRIM.

## Mål

Innføre en lett pull request-workflow for geish.no v2 slik at kode ikke lenger committes rett på `main`. Fra og med neste change jobber Code på en feature-branch, åpner en PR mot `main`, Geir leser diffen (og Vercel preview-deployen), og merger bevisst. Ingen tvang (branch-beskyttelse/CI) på dette nivået — det er en frivillig disiplin nå, kan strammes til "full" senere (egen backlog-jobb).

## Bakgrunn

I dag committer Code rett på `main` og pusher direkte. Review skjer kun på OpenSpec-artefaktene FØR apply — aldri på den genererte koden ETTER. Det er et hull: ingen leser den faktiske koden som en samlet diff før den lander, og Geir (som lærer å kode) går glipp av læringen som ligger i å lese differ. PR-workflow lukker hullet og gir en naturlig review-flate.

geish.no v2 er koblet til et Vercel-prosjekt (`geish-v2`, prosjekt-ID `prj_K5yPfNcMssUm3MyXhTNoT4azTJSh`). Hvis Vercel er koblet til GitHub-repoet (git integration), bygger Vercel automatisk en **preview-deploy** per PR — en egen live URL for grenen. Da blir diff-review også visuell: Geir ser endringen kjørende før merge. Dette er en stor del av verdien og må verifiseres (åpent spørsmål under).

Dette gjelder **kun v2** (Next.js, `C:\kode\geish_v2`, Vercel). Ikke å forveksle med v1 (Astro, Uniweb SFTP, eget repo) — den har sin egen deploy og berøres ikke.

## Scope

### Inn

- **Verifiser Vercel ↔ GitHub git-integration.** Sjekk i Vercel-dashbordet (Settings → Git) om prosjektet `geish-v2` er koblet til GitHub-repoet. Hvis ja: preview-deploys per PR kommer automatisk — ingenting å sette opp. Hvis nei (deploy skjer via `vercel` CLI manuelt): noter det; preview-per-PR krever da å koble repoet, som er et valgfritt neste steg (ikke påkrevd for lett nivå).
- **Etabler branch-navnekonvensjon.** Feature-grener navngis etter changen de implementerer: `feature/<change-navn>` (f.eks. `feature/e3-auth`, `feature/e15-forside-responsive`). Konsistent med OpenSpec-change-navn.
- **Ny arbeidsvane (oppskriften) per change:**
  1. `git checkout main && git pull` — start fra fersk main.
  2. `git checkout -b feature/<change-navn>` — lag grenen.
  3. Code implementerer changen (apply + sync + archive på grenen, ikke main).
  4. `git push -u origin feature/<change-navn>` — push grenen.
  5. Åpne PR mot `main` på GitHub (Code kan gjøre dette via `gh pr create` hvis GitHub CLI er tilgjengelig, ellers gir Code Geir lenken).
  6. **Review:** Geir leser diffen på GitHub + åpner Vercel preview-URL-en (hvis git-integration er på) og verifiserer visuelt.
  7. Merge via GitHub når fornøyd. Slett grenen.
  8. `git checkout main && git pull` — hent den mergede koden lokalt.
- **GitHub CLI (`gh`)-sjekk.** Verifiser om `gh` er installert/autentisert. Hvis ja, kan Code åpne PR-er direkte (`gh pr create --fill`). Hvis nei: enten installer `gh`, eller Code gir Geir GitHub-lenken til "compare & pull request" så han åpner den manuelt. Begge funker for lett nivå.
- **Dokumenter oppskriften** i repoet: `openspec/PR-WORKFLOW.md` (eller utvid en eksisterende prosess-doc) med branch-navnekonvensjon, de 8 stegene, og hvordan PR-en kobles til OpenSpec-loopen (apply+sync+archive skjer på grenen, ikke main). Kopier til GRIM.
- **Oppdater CLAUDE.md / AGENTS.md** så Code vet at default nå er feature-branch + PR, ikke commit-rett-på-main. Dette er viktig — ellers faller Code tilbake til gammel vane neste change.

### Ut

- **Branch-beskyttelse** (GitHub Settings → Branches → protect `main`) — "full" nivå, egen senere jobb. På lett nivå er PR frivillig, ikke håndhevet.
- **CI som blokkerer merge** (GitHub Actions: tsc/lint/build på PR) — "full" nivå, egen senere jobb.
- **Automatisert PR-review** (Claude/CI som kommenterer diffen) — "full" nivå.
- **Endring av Vercel-deploy-konfig** — vi verifiserer integrasjonen, men endrer ikke hvordan prod deployes (main → Vercel forblir som det er).
- **v1/Astro/Uniweb** — helt urørt.
- **Migrering av historikk** — vi starter PR-vanen fra neste change; gammel main-historikk står som den er.

## Suksesskriterier

- [ ] Vercel ↔ GitHub git-integration-status er avklart og notert (på/av).
- [ ] Branch-navnekonvensjon (`feature/<change-navn>`) er dokumentert.
- [ ] `openspec/PR-WORKFLOW.md` finnes med de 8 stegene + OpenSpec-koblingen.
- [ ] CLAUDE.md/AGENTS.md instruerer Code til å bruke feature-branch + PR som default.
- [ ] `gh`-tilgjengelighet er avklart (Code åpner PR-er, eller gir Geir lenke).
- [ ] **Tørrkjøring:** neste change (E3 eller en triviell test-PR) går gjennom hele flyten — gren → PR → Geir ser diff + preview → merge → main oppdatert. Verifisert minst én gang.

## Constraints

- **Lett nivå = ingen tvang.** Ikke sett opp branch-beskyttelse eller required CI på dette mandatet. Poenget er å lære vanen først; tvangen kommer som egen jobb når vanen sitter.
- **Ikke rør prod-deploy-flyten.** main → Vercel skal fortsette å fungere nøyaktig som nå. Vi legger til preview-per-PR (hvis git-integration), vi endrer ikke prod.
- **Ikke rør v1.** Astro/Uniweb-prosjektet er et annet repo og berøres ikke.
- **OpenSpec-loopen flytter til grenen.** apply + sync + archive kjøres på feature-grenen, slik at hele changen (kode + arkivert spec) er én PR. Det løser også den gamle "to commits å pushe"-friksjonen — alt blir én merge.
- Norsk i doc-prosa, engelsk i git-kommandoer/tekniske termer.

## Kontekst for Code

- **Repo:** `C:\kode\geish_v2`. GitHub: sjekk `git remote -v` for repo-URL. Vercel-prosjekt: `geish-v2` (`prj_K5yPfNcMssUm3MyXhTNoT4azTJSh`, org `team_fvh1QRGSWZOXlC5rPuu2tpfg`).
- **Eksisterende prosess-docs:** `CLAUDE.md`, `AGENTS.md` i repo-rot. `openspec/`-mappen har mandates/changes/specs/archive.
- **Dette er infra, ikke en capability.** Ingen `specs/`-delta. Ingen propose/apply på OpenSpec-vis. Code utfører git-oppsettet + skriver docs direkte. (Hvis Geir/Code vil tracke det som en OpenSpec-change for ryddighet, kan det lages en `infra-pr-workflow`-change uten `specs/`-mappe — men det er valgfritt.)
- **Læringskontekst:** Geir lærer å kode og vil bli komfortabel med PR-flyten (også for jobb). Code bør forklare hvert git-steg kort første gang, ikke bare kjøre dem. Diff-lesing er en del av læringsmålet.

## Åpne spørsmål

<!-- Avklares under oppsett. -->

- **Vercel git-integration på eller av?** Avgjør om preview-per-PR kommer gratis. Sjekk Vercel Settings → Git. (Hvis av: vil Geir koble repoet for previews, eller leve med kun GitHub-diff på lett nivå?)
- **`gh` (GitHub CLI) installert?** Avgjør om Code åpner PR-er automatisk eller gir Geir lenke.
- **Tørrkjøring på E3 eller en throwaway test-PR?** Forslag: gjør en bitte liten test-PR først (f.eks. en README-justering) for å se hele flyten uten risiko, FØR E3-koden går gjennom den. Lærerikt og lavrisiko.
- **Squash, merge-commit, eller rebase ved merge?** Lett nivå: GitHub default (merge-commit) holder. Squash kan vurderes senere for renere historikk — egen liten beslutning.
