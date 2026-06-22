import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { getFirebaseBearerHeader } from "../../utils/firebaseAuthHeaders";

const PLACEHOLDER_NAMES = ["Utilizator", "Guest", "User"];

const mergeServerComment = (optimistic, serverComment) => {
  if (!serverComment) return optimistic;
  const localName = optimistic.authorFirstName?.trim() || "";
  const serverName = serverComment.authorFirstName?.trim() || "";
  const keepLocalName =
    localName &&
    !PLACEHOLDER_NAMES.includes(localName) &&
    (!serverName || PLACEHOLDER_NAMES.includes(serverName));
  return keepLocalName
    ? { ...serverComment, authorFirstName: localName }
    : serverComment;
};

const PAGE_SIZE = 3;
const MAX_LENGTH = 500;
const syncedAuthorNamePerUid = new Set();

function formatCommentDate(value, locale) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(locale || "ro", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch (_) {
    return "";
  }
}

export default function VideoComments({
  videoId,
  initialCount = 0,
  currentUser,
  isGuestUser,
  userData,
}) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const signedIn = Boolean(currentUser?.uid) && !isGuestUser;
  const [comments, setComments] = useState([]);
  const [visibleCount, setVisibleCount] = useState(Math.max(0, Number(initialCount) || 0));
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameCollected, setNameCollected] = useState(false);
  const [composeVisible, setComposeVisible] = useState(false);
  const [composeError, setComposeError] = useState("");

  const needsName = useMemo(() => {
    if (nameCollected) return false;
    const name = typeof userData?.first_name === "string" ? userData.first_name.trim() : "";
    return !name || PLACEHOLDER_NAMES.includes(name);
  }, [nameCollected, userData?.first_name]);

  const handleSaveName = useCallback(async (event) => {
    event.preventDefault();
    const trimmed = nameValue.trim();
    if (trimmed.length < 2 || trimmed.length > 30 || nameSaving) return;
    if (!currentUser?.uid) return;
    setNameSaving(true);
    try {
      await updateDoc(doc(db, "Users", currentUser.uid), { first_name: trimmed });
      setNameCollected(true);
    } catch (err) {
      console.error("[video-comments.saveName]", err);
    } finally {
      setNameSaving(false);
    }
  }, [currentUser?.uid, nameSaving, nameValue]);

  const authorFirstName = useMemo(() => {
    if (nameCollected && nameValue.trim()) return nameValue.trim();
    const candidates = [
      userData?.first_name,
      currentUser?.displayName?.split(" ")?.[0],
      t("videoCommentsUserFallback"),
    ];
    return candidates.find((value) => typeof value === "string" && value.trim() && !PLACEHOLDER_NAMES.includes(value.trim()))?.trim() || "Utilizator";
  }, [currentUser?.displayName, nameCollected, nameValue, t, userData?.first_name]);

  const loadComments = useCallback(async ({ append = false } = {}) => {
    if (!videoId) return;
    append ? setLoadingMore(true) : setLoading(true);
    setError("");
    try {
      const headers = await getFirebaseBearerHeader({ required: false });
      const query = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (append && cursor) query.set("cursor", cursor);
      const response = await fetch(
        `/api/video-comments/${encodeURIComponent(videoId)}?${query.toString()}`,
        { headers: { Accept: "application/json", ...headers } }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "comments_load_failed");
      const nextComments = Array.isArray(data?.comments) ? data.comments : [];
      setComments((current) => {
        if (!append) return nextComments;
        const known = new Set(current.map((item) => item.id));
        return [...current, ...nextComments.filter((item) => !known.has(item.id))];
      });
      setVisibleCount(Math.max(0, Number(data?.visibleCount) || 0));
      setCursor(typeof data?.nextCursor === "string" ? data.nextCursor : null);
      setHasMore(data?.hasMore === true);
    } catch (loadError) {
      console.error("[video-comments.load]", loadError);
      setError(t("videoCommentsError"));
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  }, [cursor, t, videoId]);

  useEffect(() => {
    setComments([]);
    setVisibleCount(Math.max(0, Number(initialCount) || 0));
    setCursor(null);
    setHasMore(false);
    setText("");
    void loadComments();
  // loadComments includes cursor, but this reset must only follow identity/auth changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, currentUser?.uid]);

  useEffect(() => {
    const uid = currentUser?.uid;
    if (!uid || isGuestUser) return;
    const realName =
      typeof userData?.first_name === "string" ? userData.first_name.trim() : "";
    if (!realName || PLACEHOLDER_NAMES.includes(realName)) return;
    const cacheKey = `${uid}:${realName}`;
    if (syncedAuthorNamePerUid.has(cacheKey)) return;
    syncedAuthorNamePerUid.add(cacheKey);

    let cancelled = false;
    (async () => {
      try {
        const headers = await getFirebaseBearerHeader({ required: true });
        const response = await fetch("/api/video-comments/sync-author-name", {
          method: "POST",
          headers: { Accept: "application/json", ...headers },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error || "sync_failed");
        if (!cancelled && Number(data?.updated) > 0) {
          void loadComments();
        }
      } catch (syncError) {
        syncedAuthorNamePerUid.delete(cacheKey);
        console.warn("[video-comments.sync-author-name]", syncError);
      }
    })();
    return () => {
      cancelled = true;
    };
  // loadComments depends on cursor; we intentionally only re-run on identity/name changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid, isGuestUser, userData?.first_name]);

  const redirectToLogin = useCallback(() => {
    const returnPath = router.asPath || `/videouri/${videoId}`;
    router.push(`/login/videoteca?returnUrl=${encodeURIComponent(returnPath)}`);
  }, [router, videoId]);

  const openCompose = useCallback(() => {
    if (!signedIn) {
      redirectToLogin();
      return;
    }
    if (needsName) return;
    setComposeError("");
    setComposeVisible(true);
  }, [needsName, redirectToLogin, signedIn]);

  const closeCompose = useCallback(() => {
    if (submitting) return;
    setComposeVisible(false);
    setComposeError("");
  }, [submitting]);

  const handleSubmit = useCallback(async () => {
    if (!signedIn) {
      redirectToLogin();
      return;
    }
    const normalized = text.replace(/\s+/g, " ").trim();
    if (normalized.length < 2 || normalized.length > MAX_LENGTH || submitting) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      videoId,
      authorFirstName,
      text: normalized,
      createdAt: new Date().toISOString(),
      canDelete: true,
      pending: true,
    };
    const previousCount = visibleCount;
    setSubmitting(true);
    setError("");
    setComposeError("");
    setText("");
    setComposeVisible(false);
    setComments((current) => [optimistic, ...current]);
    setVisibleCount((count) => count + 1);
    try {
      const headers = await getFirebaseBearerHeader({ required: true });
      const sendAuthorName = PLACEHOLDER_NAMES.includes(authorFirstName)
        ? undefined
        : authorFirstName;
      const response = await fetch(`/api/video-comments/${encodeURIComponent(videoId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...headers },
        body: JSON.stringify({
          text: normalized,
          ...(sendAuthorName ? { authorFirstName: sendAuthorName } : {}),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "comment_create_failed");
      setComments((current) =>
        current.map((item) =>
          item.id === tempId ? mergeServerComment(optimistic, data.comment) : item
        )
      );
      setVisibleCount(Math.max(0, Number(data?.visibleCount) || previousCount + 1));
    } catch (submitError) {
      console.error("[video-comments.create]", submitError);
      setComments((current) => current.filter((item) => item.id !== tempId));
      setVisibleCount(previousCount);
      setText(normalized);
      setComposeVisible(true);
      setComposeError(t("videoCommentsError"));
    } finally {
      setSubmitting(false);
    }
  }, [authorFirstName, redirectToLogin, signedIn, submitting, t, text, videoId, visibleCount]);

  const handleDelete = useCallback(async (comment) => {
    if (!comment?.id || deletingId || comment.pending) return;
    if (!window.confirm(t("videoCommentsDeleteConfirm"))) return;
    const previousComments = comments;
    const previousCount = visibleCount;
    setDeletingId(comment.id);
    setError("");
    setComments((current) => current.filter((item) => item.id !== comment.id));
    setVisibleCount((count) => Math.max(0, count - 1));
    try {
      const headers = await getFirebaseBearerHeader({ required: true });
      const response = await fetch(
        `/api/video-comments/${encodeURIComponent(videoId)}/${encodeURIComponent(comment.id)}`,
        { method: "DELETE", headers: { Accept: "application/json", ...headers } }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "comment_delete_failed");
      setVisibleCount(Math.max(0, Number(data?.visibleCount) || 0));
    } catch (deleteError) {
      console.error("[video-comments.delete]", deleteError);
      setComments(previousComments);
      setVisibleCount(previousCount);
      setError(t("videoCommentsError"));
    } finally {
      setDeletingId("");
    }
  }, [comments, deletingId, t, videoId, visibleCount]);

  return (
    <section className="mt-8 border-t border-slate-200 pt-7">
      <h2 className="text-lg font-semibold text-slate-900">
        {t("videoCommentsTitle", { count: visibleCount })}
      </h2>

      {signedIn && needsName ? (
        <form onSubmit={handleSaveName} className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-slate-800">{t("videoCommentsNamePrompt", "What is your first name?")}</p>
          <p className="mt-1 text-xs text-slate-500">{t("videoCommentsNamePromptHint", "Your name will appear on your comments.")}</p>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value.slice(0, 30))}
              placeholder={t("videoCommentsNamePlaceholder", "First name")}
              maxLength={30}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={nameSaving || nameValue.trim().length < 2}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {nameSaving ? "..." : t("videoCommentsNameSave", "Save")}
            </button>
          </div>
        </form>
      ) : signedIn ? (
        <button
          type="button"
          onClick={openCompose}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          {t("videoCommentsAdd", "Adaugă comentariu")}
        </button>
      ) : (
        <button
          type="button"
          onClick={redirectToLogin}
          className="mt-4 rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          {t("videoCommentsLogin")}
        </button>
      )}

      {error ? <p className="mt-3 text-sm text-red-700" role="alert">{error}</p> : null}

      {loading ? (
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="animate-pulse rounded-xl border border-slate-100 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="h-4 w-24 rounded bg-slate-200" />
                  <div className="mt-1.5 h-3 w-16 rounded bg-slate-100" />
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-3.5 w-full rounded bg-slate-100" />
                <div className="h-3.5 w-3/4 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">{t("videoCommentsEmpty")}</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className={`rounded-xl border border-slate-200 bg-white p-4 ${comment.pending ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{comment.authorFirstName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatCommentDate(comment.createdAt, router.locale)}
                  </p>
                </div>
                {comment.canDelete ? (
                  <button
                    type="button"
                    disabled={deletingId === comment.id || comment.pending}
                    onClick={() => handleDelete(comment)}
                    className="text-xs font-semibold text-red-700 hover:text-red-900 disabled:opacity-50"
                  >
                    {t("videoCommentsDelete")}
                  </button>
                ) : null}
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                {comment.text}
              </p>
            </li>
          ))}
        </ul>
      )}

      {loadingMore ? (
        <div className="mt-4 space-y-4">
          {[1, 2].map((item) => (
            <div key={item} className="animate-pulse rounded-xl border border-slate-100 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="h-4 w-24 rounded bg-slate-200" />
                  <div className="mt-1.5 h-3 w-16 rounded bg-slate-100" />
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-3.5 w-full rounded bg-slate-100" />
                <div className="h-3.5 w-3/4 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : hasMore ? (
        <button
          type="button"
          onClick={() => loadComments({ append: true })}
          className="mt-5 rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          {t("videoCommentsLoadMore")}
        </button>
      ) : null}

      {composeVisible ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-comment-compose-title"
          onClick={closeCompose}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 id="video-comment-compose-title" className="text-lg font-semibold text-slate-900">
                {t("videoCommentsAdd", "Adaugă comentariu")}
              </h3>
              <button
                type="button"
                onClick={closeCompose}
                disabled={submitting}
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                aria-label={t("videoCommentsCancel")}
              >
                ×
              </button>
            </div>

            <textarea
              value={text}
              onChange={(event) => setText(event.target.value.slice(0, MAX_LENGTH))}
              placeholder={t("videoCommentsPlaceholder")}
              rows={4}
              maxLength={MAX_LENGTH}
              autoFocus
              className="mt-4 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">{text.length}/{MAX_LENGTH}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeCompose}
                  disabled={submitting}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  {t("videoCommentsCancel")}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={submitting || text.replace(/\s+/g, " ").trim().length < 2}
                  className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? t("videoCommentsSubmitting") : t("videoCommentsSubmit")}
                </button>
              </div>
            </div>

            {composeError ? (
              <p className="mt-3 text-sm text-red-700" role="alert">{composeError}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
