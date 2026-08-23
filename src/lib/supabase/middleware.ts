/*
 * updateSession — Supabase' token-refresh-mønster for Next.js middleware
 * (design D2 i e3-auth). Leser auth-cookies fra requesten, refresher
 * tokenet ved behov via `auth.getUser()`, og synker oppdaterte cookies til
 * BÅDE request og response (så server components nedstrøms ser ferske
 * verdier i samme request).
 *
 * VIKTIG: denne guarder IKKE ruter og redirecter ALDRI. Guards bor i
 * pages/handlers (se /konto). Middleware har én jobb: hold sesjonen i live.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authCookieDomain } from "./cookie-domain";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    // Uten env-varer kan vi ikke refreshe — slipp requesten gjennom uendret.
    return supabaseResponse;
  }

  const supabase = createServerClient(url, publishableKey, {
    // Env-betinget prod-domene via helper, ellers undefined (host-only).
    cookieOptions: { domain: authCookieDomain() },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // Ikke fjern: kallet trigger selve token-refreshen når access-tokenet er
  // utløpt. Resultatet brukes ikke her — guards gjør sin egen getUser().
  await supabase.auth.getUser();

  return supabaseResponse;
}
