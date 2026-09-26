"use client";

/*
 * ReplyForm — svarskjema i en tråd (E6). Kaller createReply-server-action.
 * Bak innloggings-guard (layout), så bruker er alltid autentisert her.
 */
import { useState } from "react";
import { t } from "@/content/i18n";
import { createReply } from "../../actions";
import styles from "../../page.module.css";

export function ReplyForm({ threadId }: { threadId: string }) {
  const S = t().stuaForum;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const res = await createReply(threadId, formData);
    setPending(false);
    if (res.ok) {
      const form = document.getElementById("reply-form");
      if (form instanceof HTMLFormElement) form.reset();
    } else {
      setError(res.message);
    }
  }

  return (
    <form id="reply-form" action={handleSubmit} className={styles.form}>
      <label className={styles.field}>
        <span className={styles.label}>{S.form.bodyLabel}</span>
        <textarea
          name="body"
          required
          maxLength={10000}
          rows={4}
          placeholder={S.form.bodyPlaceholder}
          className={styles.textarea}
        />
      </label>
      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? S.form.submitting : S.form.submitReply}
      </button>
      {error ? (
        <p className={styles.error} role="status" aria-live="polite">
          {error}
        </p>
      ) : null}
    </form>
  );
}
