"use client";

/*
 * BlogThreadForm — «start diskusjonen»-skjema for en bloggpost (E6 bolk 5).
 * Forhåndsutfylt med posttittelen (redigerbar). Kaller startBlogThread, som er
 * race-sikret (ON CONFLICT source_slug DO NOTHING + re-select) → to samtidige
 * lesere havner i samme tråd. Ved suksess → redirect til tråden.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/content/i18n";
import { startBlogThread } from "../../actions";
import styles from "../../page.module.css";

export function BlogThreadForm({
  bloggSlug,
  prefillTitle,
}: {
  bloggSlug: string;
  prefillTitle: string;
}) {
  const S = t().stuaForum;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const title = String(formData.get("title") ?? "");
    const res = await startBlogThread(bloggSlug, title, formData);
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
          defaultValue={prefillTitle}
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
