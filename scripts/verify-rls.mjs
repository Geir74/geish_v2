// Verifiserer at RLS er aktiv på guestbook_entries + at anon-rollen kun ser published.
// Bruk: node --env-file=.env.local scripts/verify-rls.mjs
import postgres from "postgres";

const url = process.env.DIRECT_URL;
if (!url) { console.error("DIRECT_URL mangler"); process.exit(1); }
const sql = postgres(url, { max: 1, prepare: false });

try {
  // 1) RLS aktiv?
  const [rls] = await sql`
    select relrowsecurity as enabled
    from pg_class where oid = 'public.guestbook_entries'::regclass`;
  console.log(`RLS enablet: ${rls.enabled ? "JA ✅" : "NEI ❌"}`);

  // 2) SELECT-policy finnes?
  const pols = await sql`
    select policyname, cmd, qual
    from pg_policies where tablename = 'guestbook_entries'`;
  console.log(`Policyer: ${pols.length}`);
  for (const p of pols) console.log(`  - ${p.policyname} (${p.cmd}) USING: ${p.qual}`);

  // 3) Grants for anon/authenticated (skal IKKE ha insert/update/delete)
  const grants = await sql`
    select grantee, privilege_type
    from information_schema.role_table_grants
    where table_name = 'guestbook_entries'
      and grantee in ('anon','authenticated')
    order by grantee, privilege_type`;
  console.log(`Grants (anon/authenticated):`);
  if (grants.length === 0) console.log("  (ingen — strengest)");
  for (const g of grants) console.log(`  - ${g.grantee}: ${g.privilege_type}`);
} catch (err) {
  console.error("Feil:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
