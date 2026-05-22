# PR-workflow for geish.no v2 (full nivå)

> Kode lander ikke lenger rett på `master`. Hver change går gjennom en feature-branch + pull request. En CI-gate (`build`-sjekken i `.github/workflows/ci.yml`) må være grønn før merge, og branch protection på `master` blokkerer merge-knappen til den er det. Geir leser diffen og ser Vercel-preview parallelt med at gaten kjører.

## Hvorfor

- **Review-flate på koden.** OpenSpec-artefaktene reviewes før apply, men koden som ble generert leses aldri som en samlet diff før den lander. PR-en lukker hullet.
- **Læring.** Geir lærer å lese differ ved å gjøre det.
- **Visuell verifisering.** Vercel bygger en preview-deploy per PR (egen URL for grenen). Du ser endringen kjørende før merge.
- **Én atomær merge.** Apply + sync + archive skjer på grenen — én merge for hele changen, ikke to commits i historikken.

## Forutsetninger (verifisert ved oppsett)

| Premiss | Status |
|---------|--------|
| Vercel ↔ GitHub git-integration | **PÅ** (production branch `master`) |
| Preview-deploys per PR | **Automatisk** (URL: `geish-v2-git-<branch>-...vercel.app`) |
| GitHub CLI (`gh`) installert + autentisert | **JA** (v2.92.0, scopes: `repo` + `workflow`) |
| Repo URL | `https://github.com/Geir74/geish_v2.git` |
| Default branch | **`master`** (ikke `main`) |
| CI-workflow | **PÅ** (`.github/workflows/ci.yml` — `build`-jobben kjører `npm ci → lint → build` på hver PR mot `master`) |
| Branch protection på `master` | **PÅ** (krever grønn `build`-sjekk før merge) |

Full nivå = CI-gaten må være grønn og branch protection blokkerer merge ellers. Gaten fanger brukne typer, imports og kompileringsfeil — ikke logikk- eller sikkerhetsbugs (de fanges av manuell review + Vercel-preview).

**Rekkefølge-fakta:** Branch protection kan først kreve en sjekk *etter* at workflowen har kjørt minst én gang (sjekken er ellers ikke valgbar i UI-et). `infra-ci-gate`-PR-en var derfor sin egen demo: workflowen kjørte først på den PR-en, og branch protection ble slått på etter merge.

## Branch-navnekonvensjon

`feature/<change-navn>` — én-til-én med OpenSpec-change-navnet.

Eksempler:
- `feature/e3-auth`
- `feature/e4-stua`
- `feature/infra-rss-feed`

For infra/throwaway-PR-er: `chore/<kort-navn>`, f.eks. `chore/readme-justering`.

## Den 8-stegs oppskriften

Hver change følger samme rutine:

### 1. Start fra fersk master

```bash
git checkout master
git pull
```

*Hva skjer:* `checkout master` bytter til hovedgrenen lokalt. `pull` henter siste commits fra GitHub og fast-forwarder din lokale master. Du jobber alltid fra det siste landede.

### 2. Lag feature-grenen

```bash
git checkout -b feature/<change-navn>
```

*Hva skjer:* `-b` = "branch": lager en ny gren og bytter til den i én operasjon. Grenen starter fra commiten du står på (siste master). Du jobber isolert herfra.

### 3. Implementer changen

Code kjører OpenSpec-loopen på grenen:

```
/opsx:propose <navn>     → proposal/design/specs/tasks
/opsx:apply <navn>       → kode + tasks oppdateres
/opsx:archive <navn>     → sync + flytt change til archive/
```

Commit underveis så ofte som det gir mening — alle commits på grenen blir én PR.

### 4. Push grenen

```bash
git push -u origin feature/<change-navn>
```

*Hva skjer:* Pusher grenen til GitHub. `-u` (eller `--set-upstream`) lenker den lokale grenen til remote-grenen — neste gang holder `git push` uten argumenter. Vercel oppdager pushen og starter en preview-build automatisk.

### 5. Åpne PR-en

**Med gh CLI (foretrukket — Code gjør dette):**

```bash
gh pr create --fill --base master
```

*Hva skjer:* `--fill` bruker siste commit-melding som PR-tittel + body. `--base master` sier "mot master". Output er en GitHub-URL.

**Eller manuelt:** Gå til `https://github.com/Geir74/geish_v2` — GitHub viser en "Compare & pull request"-knapp øverst rett etter push.

### 6. Review

Geir åpner PR-en på GitHub og leser:

- **Diffen.** Files changed-fanen viser alle endringer. Les dem som om noen andre skrev dem.
- **Vercel preview.** En kommentar fra Vercel-boten dukker opp på PR-en med URL. Klikk og verifiser visuelt.
- **OpenSpec-artefaktene.** Proposal/design/specs/tasks ligger som filer i arkivet på grenen — kan også reviewes i diffen.

Hvis noe må fikses: Code committer mer på grenen, pusher, og PR-en oppdateres automatisk (Vercel bygger ny preview).

### 7. Merge og rydd

Når Geir er fornøyd:
- Klikk **Merge pull request** på GitHub.
- Klikk **Delete branch** etter merge (knappen vises etter).
- Vercel starter prod-deploy fra master automatisk.

GitHub default merge-strategi er **merge commit** (bevarer hver enkelt commit fra grenen). Det holder for lett nivå. Squash kan vurderes senere for renere historikk.

### 8. Hent master tilbake lokalt

```bash
git checkout master
git pull
git branch -d feature/<change-navn>
```

*Hva skjer:* Bytt til master, hent den nylig mergede koden, slett den lokale feature-grenen (`-d` = "delete", trygt fordi den er merget). Klar for neste change fra fersk master.

## Hvordan OpenSpec-loopen kobles til PR-en

```
master
 │
 ├─ feature/<change-navn> ←── PR ──→ master (merge)
 │   │
 │   ├─ commit: propose (proposal/design/specs/tasks)
 │   ├─ commit: apply (kode + oppdaterte tasks)
 │   └─ commit: archive (sync specs + flytt change til archive/)
 │
 ▼
```

**Alt** OpenSpec-relatert skjer på grenen. Archive-commiten lander sammen med kode-commiten i samme PR. Specs-treet i `openspec/specs/` oppdateres automatisk i synken som er en del av archive — Geir får hele bildet samtidig i én diff.

## Throwaway-PR for å lære flyten

Før første ekte change (E3) går gjennom denne flyten, gjør én bitte liten test-PR. Det viser hele rutinen uten risiko — Geir ser preview-URL, merge-knappen, branch-sletting — én gang før det betyr noe.

Forslag: `chore/pr-workflow-test` — en triviell oppdatering av denne dokumentens innhold (legg til en linje, eller fjern en typo). Hele formålet er å se flyten, ikke å endre kode.

## Vanlige spørsmål

**Hva hvis jeg har commits lokalt på master som ikke er pushet?**
Push dem først (det er det vi gjorde fram til nå). Fra og med neste change starter du på en feature-branch.

**Hva hvis preview-deployen feiler?**
Vercel viser feilmeldingen i PR-kommentaren og i Vercel-dashbordet. Fix på grenen, push, ny preview-build starter automatisk.

**Hva hvis jeg vil avbryte en PR?**
Klikk **Close pull request** (uten å merge). Slett grenen etterpå. Endringene forsvinner ikke fra grenen — den lever videre lokalt og på GitHub til du sletter den manuelt.

**Hva hvis jeg vil pause en PR midt i?**
La grenen + PR-en stå åpen. PR-er har ingen tids-frist. Hvis du må bytte til noe annet i mellomtiden: `git checkout master` (eller `git checkout -b feature/<annen-change>`) — den paused grenen blir liggende uberørt med commits og preview-URL intakt. Når du er klar igjen: `git checkout chore/pr-workflow-test`, fortsett å committe og pushe. PR-en plukker opp de nye commitsene automatisk og bygger ny preview. Tips: hvis PR-en er pause-lenge, marker den som **Draft** på GitHub (Convert to draft-knappen) — det signaliserer at den ikke er klar for merge ennå.

**Hva med beskyttelse mot å pushe rett på master ved et uhell?**
Branch protection på `master` blokkerer ikke-PR-push. Hvis du prøver `git push origin master` med lokale commits, avviser GitHub pushen med en melding om at grenen er beskyttet. Lag en feature-branch i ettertid (`git checkout -b feature/<navn>`), push den, og åpne PR — CI-sjekken må være grønn før merge tillates.
