"use client";

/*
 * AdminThreadRow — én tråd i admin-Stua-panelet (E6 bolk 6). Tråd-handlinger
 * (skjul/vis/slett/flytt/rediger tittel) + per-innlegg (skjul/vis/rediger/
 * anonymiser). Alle actions guardes av isAdmin() server-side; dette er kun UI.
 *
 * Slett + anonymiser bekreftes (destruktivt / irreversibelt navn-tap).
 */
import { useState, useTransition } from "react";
import Link from "next/link";
import { t } from "@/content/i18n";
import {
  anonymizePost,
  deleteThread,
  editPost,
  editThreadTitle,
  hidePost,
  hideThread,
  moveThread,
  showPost,
  showThread,
} from "./actions";
import styles from "./page.module.css";

type ModPost = {
  id: string;
  body: string;
  status: "published" | "hidden";
  authorName: string;
};

type ModThread = {
  id: string;
  slug: string;
  title: string;
  status: "published" | "hidden";
  replyCount: number;
  authorName: string;
};

export function AdminThreadRow({
  thread,
  posts,
  roomOptions,
}: {
  thread: ModThread;
  posts: ModPost[];
  roomOptions: { slug: string; name: string }[];
}) {
  const M = t().admin.stua;
  const [pending, startTransition] = useTransition();
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  function run(action: () => Promise<unknown>) {
    startTransition(() => {
      void action();
    });
  }

  function handleDeleteThread() {
    if (window.confirm(M.confirmDeleteThread)) {
      run(() => deleteThread(thread.id));
    }
  }

  function handleMove(newRoomSlug: string) {
    run(() => moveThread(thread.id, newRoomSlug));
  }

  function handleTitleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await editThreadTitle(formData);
      if (res.ok) setEditingTitle(false);
    });
  }

  function handlePostEditSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await editPost(formData);
      if (res.ok) setEditingPostId(null);
    });
  }

  function handleAnonymize(postId: string) {
    if (!window.confirm(M.confirmAnonymize)) return;
    const fd = new FormData();
    fd.set("post_id", postId);
    run(() => anonymizePost(fd));
  }

  return (
    <li
      className={`${styles.thread} ${thread.status === "hidden" ? styles.threadHidden : ""}`}
    >
      <div className={styles.threadHead}>
        <span className={`${styles.badge} ${styles["badge_" + thread.status]}`}>
          {thread.status === "hidden" ? M.statusHidden : M.statusPublished}
        </span>
        {editingTitle ? (
          <form action={handleTitleSubmit} className={styles.titleForm}>
            <input type="hidden" name="thread_id" value={thread.id} />
            <input
              type="text"
              name="title"
              defaultValue={thread.title}
              maxLength={160}
              required
              className={styles.titleInput}
            />
            <button type="submit" disabled={pending} className={styles.btn}>
              {M.save}
            </button>
            <button
              type="button"
              onClick={() => setEditingTitle(false)}
              disabled={pending}
              className={styles.btnGhost}
            >
              {M.cancel}
            </button>
          </form>
        ) : (
          <Link href={`/stua/t/${thread.slug}`} className={styles.threadTitle}>
            {thread.title}
          </Link>
        )}
        <span className={styles.threadMeta}>
          {thread.authorName} · {thread.replyCount} {M.replies}
        </span>
      </div>

      {!editingTitle && (
        <div className={styles.actions}>
          {thread.status === "hidden" ? (
            <button
              type="button"
              onClick={() => run(() => showThread(thread.id))}
              disabled={pending}
              className={styles.btn}
            >
              {M.showThread}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => run(() => hideThread(thread.id))}
              disabled={pending}
              className={styles.btnGhost}
            >
              {M.hideThread}
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            disabled={pending}
            className={styles.btnGhost}
          >
            {M.editTitle}
          </button>
          <label className={styles.moveLabel}>
            {M.moveTo}
            <select
              className={styles.moveSelect}
              defaultValue=""
              disabled={pending}
              onChange={(e) => {
                if (e.target.value) handleMove(e.target.value);
              }}
            >
              <option value="" disabled>
                {M.selectRoom}
              </option>
              {roomOptions.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleDeleteThread}
            disabled={pending}
            className={styles.btnDanger}
          >
            {M.deleteThread}
          </button>
        </div>
      )}

      <ul className={styles.posts}>
        {posts.map((post, idx) => (
          <li
            key={post.id}
            className={`${styles.post} ${post.status === "hidden" ? styles.postHidden : ""}`}
          >
            <div className={styles.postHead}>
              <span className={styles.postAuthor}>
                {idx === 0 ? `${post.authorName} · ${M.openingPost}` : post.authorName}
              </span>
              {post.status === "hidden" && (
                <span className={styles.postHiddenTag}>{M.statusHidden}</span>
              )}
            </div>

            {editingPostId === post.id ? (
              <form action={handlePostEditSubmit} className={styles.postEditForm}>
                <input type="hidden" name="post_id" value={post.id} />
                <textarea
                  name="body"
                  defaultValue={post.body}
                  maxLength={10000}
                  rows={4}
                  required
                  className={styles.postEditTextarea}
                />
                <div className={styles.actions}>
                  <button type="submit" disabled={pending} className={styles.btn}>
                    {M.save}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPostId(null)}
                    disabled={pending}
                    className={styles.btnGhost}
                  >
                    {M.cancel}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className={styles.postBody}>{post.body}</p>
                <div className={styles.actions}>
                  {post.status === "hidden" ? (
                    <button
                      type="button"
                      onClick={() => run(() => showPost(post.id))}
                      disabled={pending}
                      className={styles.btn}
                    >
                      {M.showPost}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => run(() => hidePost(post.id))}
                      disabled={pending}
                      className={styles.btnGhost}
                    >
                      {M.hidePost}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingPostId(post.id)}
                    disabled={pending}
                    className={styles.btnGhost}
                  >
                    {M.editPost}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAnonymize(post.id)}
                    disabled={pending}
                    className={styles.btnDanger}
                  >
                    {M.anonymize}
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </li>
  );
}
