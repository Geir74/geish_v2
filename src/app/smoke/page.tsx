// Smoke route — verifies that the project foundation is wired up:
//   1. Drizzle DB module (src/db) imports and instantiates the postgres-js
//      client without throwing (no network call).
//   2. Supabase server client (src/lib/supabase/server) imports and
//      instantiates without throwing (env vars present, cookies API works).
//
// Live DB verification (SELECT 1) and PostgREST verification are deferred to
// the first real schema mandate, when there's a tested code path against
// actual tables. The aws-1 pooler host and the publishable-key env name are
// already noted in .env.local for that future verification.
//
// E1 fjernet shadcn-Button — denne sida inneholder ingen UI-bibliotek-import.

import { db, client } from "@/db";
import { createClient } from "@/lib/supabase/server";
import styles from "./smoke.module.css";

export const dynamic = "force-dynamic";

async function checkDb(): Promise<string> {
  try {
    if (!db || !client) {
      return "fail: db or client is null";
    }
    return "wired (live verification deferred to first schema mandate)";
  } catch (err) {
    return `fail: ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function checkSupabase(): Promise<string> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return "fail: createClient returned falsy";
    }
    return "wired (live verification deferred to first schema mandate)";
  } catch (err) {
    return `fail: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export default async function SmokePage() {
  const [dbStatus, supabaseStatus] = await Promise.all([
    checkDb(),
    checkSupabase(),
  ]);

  const ok = (s: string) => s.startsWith("wired");

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>project-init smoke</h1>

      <dl className={styles.grid}>
        <dt>db (Drizzle):</dt>
        <dd className={ok(dbStatus) ? styles.ok : styles.fail}>{dbStatus}</dd>

        <dt>supabase:</dt>
        <dd className={ok(supabaseStatus) ? styles.ok : styles.fail}>
          {supabaseStatus}
        </dd>
      </dl>
    </main>
  );
}
