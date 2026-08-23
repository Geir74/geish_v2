/*
 * /auth/callback — PKCE-callback (design D7 i e3-auth). Magic-linken lander
 * her med en `code` som byttes mot en sesjon SERVER-SIDE via
 * exchangeCodeForSession. Suksess → redirect til `next` (kun interne stier,
 * default /konto). Feil → /logg-inn?feil=lenke der skjemaet viser feilen.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Open-redirect-vern: slipp kun gjennom interne stier ("/…", ikke "//…"). */
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/konto";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Bygg på requestens origin så localhost/preview/prod alle lander riktig.
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/logg-inn?feil=lenke`);
}
