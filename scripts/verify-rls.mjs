// Verifiserer at RLS er aktiv og har policyer på ALLE tabeller i public-skjemaet.
//
// Bakgrunn: 2026-09-26 sto RLS av på alle fem tabellene i produksjon uten at noe
// sa fra. Årsaken ble bevist samme dag: `drizzle-kit push` sletter håndskrevet
// RLS — også ved push uten skjemaendring. Dette skriptet er vakten mot det.
//
// Bruk: node --env-file=.env.local scripts/verify-rls.mjs [tabell ...]
// Exit 0 = alt i orden. Exit 1 = sikkerhetsflaten har hull (eller feil).
import postgres from "postgres";

const url = process.env.DIRECT_URL;
if (!url) {
  console.error("DIRECT_URL mangler (kjør med --env-file=.env.local)");
  process.exit(1);
}

const bare = process.argv.slice(2);
const sql = postgres(url, { max: 1, prepare: false });

let avvik = 0;

try {
  const tabeller = await sql`
    select c.relname as navn,
           c.relrowsecurity as rls,
           (select count(*)::int from pg_policies p
             where p.schemaname = 'public' and p.tablename = c.relname) as policyer
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by c.relname`;

  const valgte = bare.length ? tabeller.filter((t) => bare.includes(t.navn)) : tabeller;

  if (valgte.length === 0) {
    console.error(bare.length ? `Fant ingen av tabellene: ${bare.join(", ")}` : "Fant ingen tabeller i public");
    process.exit(1);
  }

  console.log(`Sjekker ${valgte.length} tabell(er) i public:\n`);

  for (const t of valgte) {
    const ok = t.rls && t.policyer > 0;
    if (!ok) avvik++;
    console.log(`${ok ? "✅" : "❌"} ${t.navn.padEnd(22)} RLS=${t.rls ? "på " : "AV "} policyer=${t.policyer}`);

    const pols = await sql`
      select policyname, cmd, roles::text as roller, qual
      from pg_policies where schemaname = 'public' and tablename = ${t.navn}
      order by policyname`;
    for (const p of pols) {
      console.log(`     - ${p.policyname} (${p.cmd}) roller=${p.roller} USING: ${p.qual ?? "-"}`);
    }

    const grants = await sql`
      select grantee, privilege_type
      from information_schema.role_table_grants
      where table_schema = 'public' and table_name = ${t.navn}
        and grantee in ('anon','authenticated')
        and privilege_type in ('INSERT','UPDATE','DELETE')
      order by grantee, privilege_type`;
    for (const g of grants) {
      console.log(`     ⚠️  ${g.grantee} har ${g.privilege_type} (skriving bør gå via server actions)`);
    }
  }

  console.log("");
  if (avvik > 0) {
    console.error(`❌ ${avvik} tabell(er) mangler RLS eller policyer — sikkerhetsflaten har hull.`);
    console.error("   Gjenopprett med: node --env-file=.env.local scripts/apply-all-rls.mjs");
    process.exitCode = 1;
  } else {
    console.log(`✅ Alle ${valgte.length} tabeller har RLS aktiv med minst én policy.`);
  }
} catch (err) {
  console.error("Feil:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
