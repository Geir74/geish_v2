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
  index,
  integer,
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

/*
 * guestbook_entries — gjesteboka (E5). Lavterskel hilsener fra besøkende.
 *
 * author_name: FRITT navn (D2), PÅKREVD, 1–60 tegn — ingen identitetsvalidering.
 * body: hilsenen, påkrevd 1–2000 tegn. INGEN e-post lagres (personvern-regelen D2).
 * status: pending/published/hidden (D1). Innlogget → published umiddelbart; anonym
 * → pending, må godkjennes i /admin. Default pending (tryggest — anonyme er normen).
 * author_id: NULL for anonyme; FK til auth.users for innloggede, ON DELETE SET NULL
 * (behold hilsenen om brukeren slettes, bare løsne koblingen).
 *
 * RLS (håndskrevet SQL, task 1.3): alle leser KUN published; ingen klient-skriving.
 * Admin-stien skriver via Drizzle server (omgår RLS), aldri via Supabase JS.
 */
export const guestbookEntries = pgTable(
  "guestbook_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    status: text("status").notNull().default("pending"),
    authorId: uuid("author_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "author_name_len",
      sql`char_length(trim(${table.authorName})) between 1 and 60`,
    ),
    check(
      "body_len",
      sql`char_length(trim(${table.body})) between 1 and 2000`,
    ),
    check(
      "status_valid",
      sql`${table.status} in ('pending', 'published', 'hidden')`,
    ),
  ],
);

export type GuestbookEntry = InferSelectModel<typeof guestbookEntries>;

/*
 * ── Stua (E6) — lukket forum: rom → tråder → svar ──────────────────────────
 *
 * Bygget på E5-mønsteret (uuid PK, trim-CHECK, timestamptz, RLS i egen SQL,
 * Drizzle-server-bypass for skriving). Hele Stua er bak innlogging (D2).
 */

// stua_rooms — admin-styrt (seedet: Geish.no/Reik.no/Prat/Annet/Blogg). Ingen
// bruker-skriving. sort_order styrer visningsrekkefølge.
export const stuaRooms = pgTable(
  "stua_rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("room_slug_len", sql`char_length(trim(${table.slug})) between 1 and 60`),
    check("room_name_len", sql`char_length(trim(${table.name})) between 1 and 80`),
  ],
);

// stua_threads — brukeropprettet. slug er GLOBALT unik + immutabel (kanonisk
// rute /stua/t/[slug], room-agnostisk oppslag → trådflytting brekker ikke
// blogg-lenker). source_slug = bloggpost-slug for lazy blogg-tråder (UNIQUE der
// satt → én tråd per post). last_activity_at driver «nyeste aktivitet»-sortering
// (denormalisert, settes av skrive-actions → unngår N+1). reply_count = antall
// PUBLISHED svar utover åpningsinnlegget («tom tråd»-sjekk uten count-query).
export const stuaThreads = pgTable(
  "stua_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => stuaRooms.id, { onDelete: "restrict" }),
    authorId: uuid("author_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    sourceSlug: text("source_slug").unique(),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    replyCount: integer("reply_count").notNull().default(0),
    status: text("status").notNull().default("published"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("thread_title_len", sql`char_length(trim(${table.title})) between 1 and 160`),
    check("thread_status_valid", sql`${table.status} in ('published', 'hidden')`),
    // Varmeste query: trådliste per rom sortert nyeste aktivitet (Hugin bolk 1).
    index("stua_threads_room_activity_idx").on(
      table.roomId,
      table.lastActivityAt.desc(),
    ),
  ],
);

// stua_posts — svar (og åpningsinnlegg = første rad). author_id NULL =
// anonymisert → stormtrooper-fallback (E4). thread_id CASCADE (hard-delete av
// tråd rydder svar). Soft-hide (status='hidden') er normal moderering.
export const stuaPosts = pgTable(
  "stua_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => stuaThreads.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    status: text("status").notNull().default("published"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("post_body_len", sql`char_length(trim(${table.body})) between 1 and 10000`),
    check("post_status_valid", sql`${table.status} in ('published', 'hidden')`),
    // Nest varmest: svar per tråd kronologisk (Hugin bolk 1).
    index("stua_posts_thread_created_idx").on(
      table.threadId,
      table.createdAt,
    ),
  ],
);

export type StuaRoom = InferSelectModel<typeof stuaRooms>;
export type StuaThread = InferSelectModel<typeof stuaThreads>;
export type StuaPost = InferSelectModel<typeof stuaPosts>;
