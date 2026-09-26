// Anvender ALL håndskrevet RLS-SQL under drizzle/rls/ i deterministisk rekkefølge,
// og verifiserer resultatet til slutt.
//
// Finnes fordi `drizzle-kit push` beviselig sletter håndskrevet RLS (2026-09-26,
// reprodusert 2/2 i isolert container — også uten skjemaendring). Etter enhver
// push mot et miljø med data MÅ dette kjøres.
//
// Bruk: node --env-file=.env.local scripts/apply-all-rls.mjs
// SQL-filene er idempotente, så gjentatt kjøring er trygt.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const url = process.env.DIRECT_URL;
if (!url) {
  console.error("DIRECT_URL mangler (kjør med --env-file=.env.local)");
  process.exit(1);
}

const dir = "drizzle/rls";
// Rekkefølge: profiles først (trigger + FK mot auth-skjemaet), så resten alfabetisk.
const alle = readdirSync(dir).filter((f) => f.endsWith(".sql"));
const forst = alle.filter((f) => f === "profiles.sql");
const resten = alle.filter((f) => f !== "profiles.sql").sort();
const filer = [...forst, ...resten];

if (filer.length === 0) {
  console.error(`Fant ingen .sql-filer i ${dir}`);
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false });
let feilet = 0;

try {
  console.log(`Anvender ${filer.length} RLS-fil(er) fra ${dir}:\n`);
  for (const f of filer) {
    try {
      await sql.unsafe(readFileSync(join(dir, f), "utf8"));
      console.log(`  ✅ ${f}`);
    } catch (err) {
      console.error(`  ❌ ${f}: ${err.message}`);
      feilet++;
    }
  }

  console.log("\nKontroll etter anvendelse:");
  const rader = await sql`
    select c.relname as navn, c.relrowsecurity as rls,
           (select count(*)::int from pg_policies p
             where p.schemaname='public' and p.tablename=c.relname) as policyer
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r' order by c.relname`;

  let hull = 0;
  for (const r of rader) {
    const ok = r.rls && r.policyer > 0;
    if (!ok) hull++;
    console.log(`  ${ok ? "✅" : "❌"} ${r.navn.padEnd(22)} RLS=${r.rls ? "på " : "AV "} policyer=${r.policyer}`);
  }

  if (feilet > 0 || hull > 0) {
    console.error(`\n❌ ${feilet} fil(er) feilet, ${hull} tabell(er) står fortsatt uten RLS/policy.`);
    process.exitCode = 1;
  } else {
    console.log("\n✅ Sikkerhetsflaten er gjenopprettet på alle tabeller.");
  }
} catch (err) {
  console.error("Feil:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
