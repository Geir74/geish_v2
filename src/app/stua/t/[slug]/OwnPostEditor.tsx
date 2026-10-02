"use client";

/*
 * OwnPostEditor — inline redigering av EGET innlegg (E6 bolk 11.1).
 * Fri redigering uten tidsvindu (D9). Eierskap avgjøres server-side i
 * editOwnPost (where author_id = user.id) — denne komponenten styrer kun
 * hva som VISES, aldri hva som tillates.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/content/i18n";
import { editOwnPost } from "../../actions";
import styles from "../../page.module.css";

export function OwnPostEditor({
  postId,
  body,
}: {
  postId: string;
  body: string;
}) {
  const S = t().stuaForum;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const res = await editOwnPost(postId, formData);
    setPending(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError(res.message);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={styles.ownerAction}
      >
        {S.owner.edit}
      </button>
    );
  }

  return (
    <form action={handleSubmit} className={styles.ownerForm}>
      <label className={styles.field}>
        <span className={styles.label}>{S.form.bodyLabel}</span>
        <textarea
          name="body"
          required
          maxLength={10000}
          rows={4}
          defaultValue={body}
          className={styles.textarea}
        />
      </label>
      <div className={styles.ownerRow}>
        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? S.form.submitting : S.owner.save}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className={styles.ownerAction}
        >
          {S.owner.cancel}
        </button>
      </div>
      {error ? (
        <p className={styles.error} role="status" aria-live="polite">
          {error}
        </p>
      ) : null}
    </form>
  );
}
