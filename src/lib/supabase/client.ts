// Use for auth/realtime/storage only. Domain reads/writes go through Drizzle
// (src/db/index.ts). The smoke route is the sole exception — it intentionally
// hits PostgREST to verify the anon key + URL actually reach this project.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
  }
  if (!publishableKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set.");
  }
  return createBrowserClient(url, publishableKey);
}
