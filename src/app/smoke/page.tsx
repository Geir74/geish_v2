// Smoke route — verifies that the project foundation is wired up:
//   1. Drizzle DB module (src/db) imports and instantiates the postgres-js
//      client without throwing (no network call).
//   2. Supabase server client (src/lib/supabase/server) imports and
//      instantiates without throwing (env vars present, cookies API works).
//   3. shadcn Button renders.
//
// Live DB verification (SELECT 1) and PostgREST verification are deferred to
// the first real schema mandate, when there's a tested code path against
// actual tables. The aws-1 pooler host and the publishable-key env name are
// already noted in .env.local for that future verification.

import { db, client } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

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
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-12 font-mono text-sm">
      <h1 className="text-2xl font-semibold">project-init smoke</h1>

      <dl className="grid grid-cols-[8rem_1fr] gap-y-2">
        <dt>db (Drizzle):</dt>
        <dd className={ok(dbStatus) ? "text-green-600" : "text-red-600"}>
          {dbStatus}
        </dd>

        <dt>supabase:</dt>
        <dd className={ok(supabaseStatus) ? "text-green-600" : "text-red-600"}>
          {supabaseStatus}
        </dd>
      </dl>

      <div>
        <Button>shadcn Button renders</Button>
      </div>
    </main>
  );
}
