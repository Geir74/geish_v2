import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

loadEnv({ path: ".env.local" });

const url = process.env.DIRECT_URL;
if (!url) {
  throw new Error(
    "DIRECT_URL is not set. drizzle-kit must connect via the Supabase Session pooler (port 5432) — the Transaction pooler (DATABASE_URL, port 6543) hangs because drizzle-kit's internal connection does not honor prepare:false. Add DIRECT_URL to .env.local.",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
