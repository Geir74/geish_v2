// Beviser at Drizzle-server-connection (DATABASE_URL, postgres-rolle) SER alle
// statuser (pending/published/hidden) — dvs. omgår RLS — mens anon-stien ikke gjør det.
// Hugin-krav (E5 RLS-review): bypass er antatt, MÅ bevises før admin bygges.
//
// Bruk: node --env-file=.env.local scripts/verify-bypass.mjs
// Rydder opp etter seg (sletter test-radene).
import postgres from "postgres";

const dbUrl = process.env.DATABASE_URL; // Drizzle server-sti (Transaction pooler)
if (!dbUrl) { console.error("DATABASE_URL mangler"); process.exit(1); }
const sql = postgres(dbUrl, { prepare: false });

const marker = `__bypass_test_${Date.now()}`;
try {
  // Sett inn én rad av hver status via server-connection.
  for (const status of ["pending", "published", "hidden"]) {
    await sql`
      insert into public.guestbook_entries (author_name, body, status)
      values (${marker}, ${status + " test"}, ${status})`;
  }

  // Les tilbake via SAMME server-connection — skal se ALLE tre.
  const rows = await sql`
    select status from public.guestbook_entries
    where author_name = ${marker} order by status`;
  const seen = rows.map((r) => r.status).sort().join(",");
  const expected = "hidden,pending,published";
  console.log(`Server-connection ser: [${seen}]`);
  if (seen === expected) {
    console.log("✅ BEVIST: Drizzle-server-rollen omgår RLS (ser pending/published/hidden).");
  } else {
    console.log(`❌ FEIL: forventet [${expected}] — admin ville IKKE sett alle statuser!`);
    process.exitCode = 1;
  }

  // Rydd opp test-radene.
  const del = await sql`
    delete from public.guestbook_entries where author_name = ${marker}`;
  console.log(`Ryddet ${del.count} test-rader.`);
} catch (err) {
  console.error("Feil:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
