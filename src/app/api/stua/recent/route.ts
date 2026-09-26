/*
 * /api/stua/recent — nyeste published trådtitler for forside-previewen (E6 bolk 7).
 *
 * SIKKERHET: getUser() FØR query. Utlogget → 401 uten data. Titler er innhold
 * bak døra; denne ruten er den ENESTE veien de når klienten, og kun for
 * innloggede. force-dynamic: auth pr. request, aldri cachet.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStuaRecentThreads } from "@/lib/stua/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ threads: [] }, { status: 401 });
  }

  const threads = await getStuaRecentThreads(4);
  return NextResponse.json({ threads });
}
