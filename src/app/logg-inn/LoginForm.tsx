/*
 * LoginForm — to-tilstands client-skjema (design D6 i e3-auth):
 * skjema ↔ "lenke sendt"-kvittering med mottakeradressen (fanger tastefeil —
 * eneste sjansen i en passordløs flyt). Feil fra callbacken kommer som
 * ?feil=-param; utsendingsfeil fanges lokalt. All copy fra t().
 */
"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { t } from "@/content/i18n";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

type Phase = "form" | "sending" | "sent";

function LoginFormInner() {
  const C = t();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("form");
  const [email, setEmail] = useState("");
  const [sendError, setSendError] = useState(false);

  // ?feil=lenke fra callbacken (utløpt/ugyldig magic link). Skjules når
  // brukeren har fått sendt en ny lenke.
  const callbackError = searchParams.get("feil") !== null && phase !== "sent";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSendError(false);
    setPhase("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=/konto`,
      },
    });

    if (error) {
      setSendError(true);
      setPhase("form");
      return;
    }
    setPhase("sent");
  }

  if (phase === "sent") {
    return (
      <div className={styles.receipt}>
        <span className={styles.stamp}>{C.auth.login.sentStamp}</span>
        <p className={styles.receiptText}>
          {C.auth.login.sentBefore}{" "}
          <strong className={styles.receiptEmail}>{email}</strong>.{" "}
          {C.auth.login.sentAfter}
        </p>
        <button
          type="button"
          className={styles.resetLink}
          onClick={() => setPhase("form")}
        >
          {C.auth.login.useAnother}
        </button>
      </div>
    );
  }

  return (
    <div>
      {callbackError ? (
        <p className={styles.error} role="alert">
          {C.auth.login.errorLink}
        </p>
      ) : null}
      {sendError ? (
        <p className={styles.error} role="alert">
          {C.auth.login.errorSend}
        </p>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label} htmlFor="email">
          {C.auth.login.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={styles.input}
          placeholder={C.auth.login.emailPlaceholder}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={phase === "sending"}
        />
        <button
          type="submit"
          className={styles.submit}
          disabled={phase === "sending"}
        >
          {phase === "sending" ? C.auth.login.submitting : C.auth.login.submit}
        </button>
      </form>
    </div>
  );
}

export function LoginForm() {
  // useSearchParams krever Suspense-boundary i client components.
  return (
    <Suspense fallback={null}>
      <LoginFormInner />
    </Suspense>
  );
}
