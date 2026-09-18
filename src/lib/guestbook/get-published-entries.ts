/*
 * getPublishedEntries — autoritativ server-side lesing av PUBLISERTE
 * gjestebok-innlegg via Drizzle (E5, design D1/D4). Nyest først.
 *
 * Domenedata går ALLTID via Drizzle (src/db), aldri via Supabase JS-klienten —
 * den er reservert for auth/realtime/storage.
 *
 * Vi filtrerer eksplisitt på status='published' i query-en. Det er IKKE bare
 * å stole på RLS: denne lesingen går via Drizzle server-connection (som kan
 * omgå RLS), så den eksplisitte where-en er den autoritative filtreringen for
 * den offentlige siden. RLS er dybdeforsvar for den direkte PostgREST/anon-stien.
 */
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { guestbookEntries, type GuestbookEntry } from "@/db/schema";

export type PublishedEntry = Pick<
  GuestbookEntry,
  "id" | "authorName" | "body" | "createdAt"
>;

export async function getPublishedEntries(): Promise<PublishedEntry[]> {
  return db
    .select({
      id: guestbookEntries.id,
      authorName: guestbookEntries.authorName,
      body: guestbookEntries.body,
      createdAt: guestbookEntries.createdAt,
    })
    .from(guestbookEntries)
    .where(eq(guestbookEntries.status, "published"))
    .orderBy(desc(guestbookEntries.createdAt));
}
