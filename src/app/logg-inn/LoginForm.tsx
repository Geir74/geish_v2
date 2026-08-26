/*
 * LoginForm — to-tilstands client-skjema (design D6 i e3-auth):
 * skjema ↔ "lenke sendt"-kvittering med mottakeradressen (fanger tastefeil —
 * eneste sjansen i en passordløs flyt). Feil fra callbacken kommer som
 * ?feil=-param; utsendingsfeil fanges lokalt. All copy fra t().
 *
 * Kvitteringen tilbyr i tillegg engangskode som fallback: enkelte
 * jobb-maskiner har lenkeskannere som «klikker» magic-linken før brukeren
 * rekker det (engangstokenet brukes opp). Koden fra samme e-post verifiseres
 * med verifyOtp({ type: "email" }) og er immun mot skannere. Forutsetter at
 * Supabase-e-postmalen for Magic Link inkluderer {{ .Token }}.
 */
"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { t } from "@/content/i18n";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

type Phase = "form" | "sending" | "sent";

function LoginFormInner() {
  const C = t();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("form");
  const [email, setEmail] = useState("");
  const [sendError, setSendError] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState(false);

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
    setOtp("");
    setOtpError(false);
    setPhase("sent");
  }

  // OTP-fallback: verifiser koden fra e-posten mot samme adresse som lenken
  // ble sendt til. Suksess setter sesjonscookies i browser-klienten; refresh()
  // etter push() så server components ser den nye sesjonen (samme sluttilstand
  // som callback-redirecten).
  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOtpError(false);
    setOtpBusy(true);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: "email",
    });

    if (error) {
      setOtpError(true);
      setOtpBusy(false);
      return;
    }
    router.push("/konto");
    router.refresh();
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
        <form className={styles.otpForm} onSubmit={handleVerifyOtp}>
          <p className={styles.otpLegend}>{C.auth.login.otpLegend}</p>
          {otpError ? (
            <p className={styles.error} role="alert">
              {C.auth.login.errorOtp}
            </p>
          ) : null}
          <label className={styles.label} htmlFor="otp">
            {C.auth.login.otpLabel}
          </label>
          {/* inputmode numeric gir talltastatur på mobil, men vi håndhever
              ikke lengde/format — Supabase eier kodeformatet (i dag 6 siffer). */}
          <input
            id="otp"
            name="otp"
            type="text"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            className={styles.input}
            placeholder={C.auth.login.otpPlaceholder}
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            disabled={otpBusy}
          />
          <button type="submit" className={styles.submit} disabled={otpBusy}>
            {otpBusy ? C.auth.login.otpSubmitting : C.auth.login.otpSubmit}
          </button>
        </form>
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
