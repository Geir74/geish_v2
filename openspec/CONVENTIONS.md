# Konvensjoner – slik jobber vi i geish.no v2

> Denne fila er kontrakten for *hvordan* endringer gjøres her. Den gjelder **alle** –
> mennesker og agenter (Munin, Claude Code, Cowork, hvem som helst). Les den før du rører kode.

## Grunnregel: all utvikling går gjennom OpenSpec

**Ingen unntak.** Ikke for «små» endringer, ikke for «rene UI»-endringer, ikke for «bare en
tekstjustering». Hvis du skriver eller endrer kode i dette repoet, finnes det en tilhørende
OpenSpec-change. Punktum.

Grunnen: OpenSpec-artefaktene er den maskinlesbare kontrakten som lever *i* repoet. De gir
review-flate, historikk og et forutsigbart sted der neste utvikler/agent finner *hva* som ble
endret og *hvorfor*. En endring uten spec-spor er usynlig for alle som ikke var i chatten da den
ble laget. (Lærdom fra `global-nav`, 2026-09-01: en «liten UI-endring» gled inn i GRIM-mandat-
sporet uten OpenSpec-change – det ble retrofittet. Ikke gjenta den snarveien.)

## Flyt per endring

For hver endring, opprett `openspec/changes/<change-navn>/` med:

- `proposal.md` – Why / What Changes / Impact
- `specs/<capability>/spec.md` – spec-**delta**: nye/endrede requirements med WHEN/THEN-scenarier
- `tasks.md` – konkret oppgaveliste, krysses av mens du jobber

Så:

1. `openspec validate <change-navn>` → må returnere «is valid» før du går videre.
2. Implementer koden (se PR-workflowen under).
3. Etter merge: arkiver changen til `openspec/changes/archive/<dato>-<change-navn>/` og synk
   den levende speccen i `openspec/specs/`.

Eksisterende levende capabilities: `auth`, `blog`, `ci-gate`, `design-system`, `homepage`,
`manifest`, `project-foundation`, `navigation` (se `openspec/specs/`).

## PR-workflow (kode lander via pull request)

Full oppskrift: `openspec/PR-WORKFLOW.md`. Kort:

- Én change = én feature-branch: `feature/<change-navn>` (`chore/<navn>` for infra/prosess).
- Default branch er **`master`**, ikke `main`. Kode lander **ikke** rett på master – alltid via PR.
- CI (`.github/workflows/ci.yml`: `npm ci → lint → build`) må være grønn; branch protection på
  `master` blokkerer merge ellers.
- Push utløser Vercel preview-deploy automatisk; inkluder preview-URL i PR-rapporten.
- Geir leser diffen + previewen og merger selv.

## GRIM er tillegg, ikke erstatning

Discovery, mandat og «hvorfor» dokumenteres i GRIM-vaulten. Det **erstatter aldri**
OpenSpec-kontrakten i repoet. GRIM = kontekst/resonnement; OpenSpec = kontrakt.

## Personvern

Vi lekker aldri e-postadresser eller annen personlig info uten spesifikk, aktiv tillatelse fra
personen selv. E-post er betrodd for innlogging/kontakt – aldri for publisering eller avledning
(f.eks. visningsnavn fra e-post).
