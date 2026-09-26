## 1. GitHub repository secrets (utenfor repoet)

> Publishable-nøkkelen er allerede offentlig (`NEXT_PUBLIC_*` i klienten), men
> legges som secret for ren workflow-referanse. Ingen service-role-nøkkel brukes.

- [x] 1.1 `SUPABASE_URL` satt som repo-secret (`https://<ref>.supabase.co`).
- [x] 1.2 `SUPABASE_PUBLISHABLE_KEY` satt som repo-secret (anon/publishable JWT).

## 2. Workflow

- [x] 2.1 `.github/workflows/supabase-keepalive.yml`: `schedule` (daglig cron) + `workflow_dispatch`.
- [x] 2.2 Ett steg som curler `<SUPABASE_URL>/rest/v1/` med `apikey`- og `Authorization: Bearer`-headere fra secrets.
- [x] 2.3 Feiler synlig (`--fail`/exit ikke-null) hvis status ikke er 2xx.
- [x] 2.4 Ingen klartekst-URL/nøkkel i fila — kun `secrets.*`.

## 3. Verifisering

- [ ] 3.1 `workflow_dispatch` kjørt manuelt → grønt run, Supabase teller aktivitet.
- [ ] 3.2 Prosjektet forblir `ACTIVE_HEALTHY` over neste helg uten manuell vekking.

## 4. Opprydding (etter verifisering)

- [ ] 4.1 Pensjoner den lokale laptop-cronen for Supabase-keepalive (overflødig).
