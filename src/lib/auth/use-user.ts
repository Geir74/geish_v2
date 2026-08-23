/*
 * useUser() — client-side innlogget-tilstand (design D4 i e3-auth).
 *
 * KOSMETISK, aldri tilgangskontroll: hooken styrer bare hva som VISES
 * (nav-lenker, skrive-knapper i E4). All faktisk tilgang valideres
 * server-side med createClient() fra @/lib/supabase/server + getUser().
 *
 * getUser() ved mount (validerer mot Supabase) + onAuthStateChange-
 * subscription så innlogging/utlogging reflekteres uten sidelasting.
 */
"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function useUser(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, loading };
}
