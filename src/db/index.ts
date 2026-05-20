// Primary read/write/migrations path for all domain data.
// Do NOT bypass via the Supabase JS client — that one is reserved for
// auth/realtime/storage (see src/lib/supabase/*).
//
// Uses Supabase Transaction pooler (pgBouncer), which does not support
// prepared statements — `prepare: false` is mandatory.

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local (Supabase Transaction pooler URL, port 6543).",
  );
}

export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client);
