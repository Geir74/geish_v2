"use client";

/*
 * GuestbookForm — client-component for gjestebok-innsending (E5, task 2.4).
 *
 * Felter: navn + hilsen + USYNLIG honeypot (D3). Honeypot-feltet heter noe et
 * menneske aldri ser (aria-hidden, tabindex -1, autocomplete off, off-screen).
 * Bot-er som auto-fyller alt fyller det → server forkaster stille.
 *
 * Poster til submitEntry-server-action. Viser suksess/feil via t()-strenger.
 * INGEN e-post samles inn (personvern D2).
 */
import { useState } from "react";
import { t } from "@/content/i18n";
import { submitEntry, type SubmitResult } from "./actions";
import styles from "./page.module.css";

export function GuestbookForm() {
  const G = t().gjestebok;
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setResult(null);
    const res = await submitEntry(formData);
    setResult(res);
    setPending(false);
    if (res.ok) {
      // Nullstill skjemaet ved suksess (client-side).
      const form = document.getElementById("guestbook-form");
      if (form instanceof HTMLFormElement) form.reset();
    }
  }

  return (
    <form id="guestbook-form" action={handleSubmit} className={styles.form}>
      <label className={styles.field}>
        <span className={styles.label}>{G.form.nameLabel}</span>
        <input
          type="text"
          name="author_name"
          required
          maxLength={60}
          placeholder={G.form.namePlaceholder}
          className={styles.input}
          autoComplete="off"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>{G.form.messageLabel}</span>
        <textarea
          name="body"
          required
          maxLength={2000}
          rows={4}
          placeholder={G.form.messagePlaceholder}
          className={styles.textarea}
        />
      </label>

      {/* Honeypot (D3): usynlig for mennesker, lokker bots. Ikke fjern. */}
      <div aria-hidden="true" className={styles.honeypot}>
        <label>
          La stå tom
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? G.form.submitting : G.form.submit}
      </button>

      {result && (
        <p
          className={result.ok ? styles.success : styles.error}
          role="status"
          aria-live="polite"
        >
          {result.message}
        </p>
      )}
    </form>
  );
}
