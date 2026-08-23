/*
 * /auth/logg-ut — logg ut som POST (design D1 i e3-auth). POST, ikke GET,
 * så prefetch/crawlere/<img>-triks ikke kan logge brukeren ut. Konsumeres
 * av <form method="post"> fra både AuthNav og /konto — funker uten JS.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  await supabase.auth.signOut();
  // 303: gjør redirecten etter POST til en GET (standard PRG-mønster).
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
