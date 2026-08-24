// Domenetabeller (Drizzle). Første ekte tabell kom med E4 (profiles).
// Mønster for E5/E6: legg tabell her → `npm run db:generate` (commit migrasjon)
// → håndskriv `drizzle/rls/<tabell>.sql` (RLS + evt. triggere), commit.
//
// Domenedata leses/skrives via denne (src/db/index.ts), ALDRI via Supabase JS —
// den er reservert for auth/realtime/storage (src/lib/supabase/*).

import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  check,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Minimal referanse til auth.users — KUN id-kolonnen, for FK-en. Vi eier ikke
// `auth`-skjemaet (Supabase gjør det); dette deklareres bare så FK-en synes i
// datamodellen (design D1). Ingen DDL genereres mot auth.
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

/*
 * profiles — 1:1-utvidelse av auth.users. PK = FK (id), så dobbel-profil er
 * strukturelt umulig; ON DELETE CASCADE rydder profilen når brukeren slettes.
 *
 * display_name: FRITT navn, IKKE unikt (Geirs D1). NULLABLE og fersk = NULL
 * (Geirs D5 — aldri avledet fra e-post). CHECK håndhever 2–40 tegn NÅR satt
 * (NULL passerer). bio er valgfri, ≤300 tegn, og OFFENTLIG lesbar (RLS SELECT
 * true). Ingen private felt bor i denne tabellen.
 */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    displayName: text("display_name"),
    bio: text("bio"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "display_name_len",
      sql`${table.displayName} is null or char_length(${table.displayName}) between 2 and 40`,
    ),
    check("bio_len", sql`${table.bio} is null or char_length(${table.bio}) <= 300`),
  ],
);

export type Profile = InferSelectModel<typeof profiles>;
