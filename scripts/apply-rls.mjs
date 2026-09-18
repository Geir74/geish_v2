// Engangs-runner: kjører en håndskrevet RLS/trigger-SQL-fil mot DIRECT_URL.
// Bruk: node --env-file=.env.local scripts/apply-rls.mjs drizzle/rls/<fil>.sql
import { readFileSync } from "node:fs";
import postgres from "postgres";

const file = process.argv[2];
if (!file) {
  console.error("Bruk: node scripts/apply-rls.mjs <sql-fil>");
  process.exit(1);
}
const url = process.env.DIRECT_URL;
if (!url) {
  console.error("DIRECT_URL mangler i miljøet (--env-file=.env.local)");
  process.exit(1);
}

const sqlText = readFileSync(file, "utf8");
const sql = postgres(url, { max: 1, prepare: false });

try {
  await sql.unsafe(sqlText);
  console.log(`✅ Anvendt: ${file}`);
} catch (err) {
  console.error(`❌ Feil ved anvendelse av ${file}:`);
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
