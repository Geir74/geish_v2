"use client";

/*
 * NewThreadForm — skjema for ny tråd i et rom (E6). Kaller createThread.
 * Bak innloggings-guard (layout). Ved suksess → redirect til den nye tråden.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/content/i18n";
import { createThread } from "../../actions";
import styles from "../../page.module.css";

export function NewThreadForm({ roomSlug }: { roomSlug: string }) {
  const S = t().stuaForum;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("room_slug", roomSlug);
    const res = await createThread(formData);
    if (res.ok && res.slug) {
      router.push(`/stua/t/${res.slug}`);
    } else {
      setPending(false);
      setError(res.ok ? S.errors.generic : res.message);
    }
  }

  return (
    <form action={handleSubmit} className={styles.form}>
      <label className={styles.field}>
        <span className={styles.label}>{S.form.titleLabel}</span>
        <input
          type="text"
          name="title"
          required
          maxLength={160}
          placeholder={S.form.titlePlaceholder}
          className={styles.input}
          autoComplete="off"
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>{S.form.bodyLabel}</span>
        <textarea
          name="body"
          required
          maxLength={10000}
          rows={6}
          placeholder={S.form.bodyPlaceholder}
          className={styles.textarea}
        />
      </label>
      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? S.form.submitting : S.form.submitThread}
      </button>
      {error ? (
        <p className={styles.error} role="status" aria-live="polite">
          {error}
        </p>
      ) : null}
    </form>
  );
}
