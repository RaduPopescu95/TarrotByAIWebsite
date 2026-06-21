import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { getFirebaseBearerHeader } from "../../utils/firebaseAuthHeaders";

const PAGE_SIZE = 20;
const MAX_LENGTH = 500;

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

  const authorFirstName = useMemo(() => {
    const candidates = [
      userData?.first_name,
      currentUser?.displayName?.split(" ")?.[0],
      t("videoCommentsUserFallback"),
    ];
    return candidates.find((value) => typeof value === "string" && value.trim())?.trim() || "Utilizator";
  }, [currentUser?.displayName, t, userData?.first_name]);

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

  const redirectToLogin = useCallback(() => {
    const returnPath = router.asPath || `/videouri/${videoId}`;
    router.push(`/login/videoteca?returnUrl=${encodeURIComponent(returnPath)}`);
  }, [router, videoId]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
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
    setText("");
    setComments((current) => [optimistic, ...current]);
    setVisibleCount((count) => count + 1);
    try {
      const headers = await getFirebaseBearerHeader({ required: true });
      const response = await fetch(`/api/video-comments/${encodeURIComponent(videoId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...headers },
        body: JSON.stringify({ text: normalized }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "comment_create_failed");
      setComments((current) =>
        current.map((item) => (item.id === tempId ? data.comment : item))
      );
      setVisibleCount(Math.max(0, Number(data?.visibleCount) || previousCount + 1));
    } catch (submitError) {
      console.error("[video-comments.create]", submitError);
      setComments((current) => current.filter((item) => item.id !== tempId));
      setVisibleCount(previousCount);
      setText(normalized);
      setError(t("videoCommentsError"));
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

      {signedIn ? (
        <form onSubmit={handleSubmit} className="mt-4">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, MAX_LENGTH))}
            placeholder={t("videoCommentsPlaceholder")}
            rows={3}
            maxLength={MAX_LENGTH}
            className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">{text.length}/{MAX_LENGTH}</span>
            <button
              type="submit"
              disabled={submitting || text.replace(/\s+/g, " ").trim().length < 2}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? t("videoCommentsSubmitting") : t("videoCommentsSubmit")}
            </button>
          </div>
        </form>
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
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-full rounded bg-slate-100" />
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

      {hasMore ? (
        <button
          type="button"
          disabled={loadingMore}
          onClick={() => loadComments({ append: true })}
          className="mt-5 rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          {loadingMore ? t("videoCommentsLoadingMore") : t("videoCommentsLoadMore")}
        </button>
      ) : null}
    </section>
  );
}
