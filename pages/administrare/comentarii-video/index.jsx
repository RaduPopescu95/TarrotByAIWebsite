import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";

function dashboardHeaders(json = false) {
  return {
    Accept: "application/json",
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (_) {
    return value;
  }
}

function VideoCommentsAdminScreen() {
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState("");
  const [videoId, setVideoId] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ limit: "50" });
    if (status) params.set("status", status);
    if (videoId.trim()) params.set("videoId", videoId.trim());
    if (appliedSearch.trim()) params.set("search", appliedSearch.trim());
    return params.toString();
  }, [appliedSearch, status, videoId]);

  const load = useCallback(async ({ append = false } = {}) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError("");
    try {
      const suffix = append && cursor ? `${queryString}&cursor=${encodeURIComponent(cursor)}` : queryString;
      const response = await fetch(`/api/dashboard/video-comments?${suffix}`, {
        headers: dashboardHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Nu am putut încărca comentariile.");
      const nextRows = Array.isArray(data?.comments) ? data.comments : [];
      setComments((current) => append ? [...current, ...nextRows] : nextRows);
      setCursor(typeof data?.nextCursor === "string" ? data.nextCursor : null);
      setHasMore(data?.hasMore === true);
    } catch (loadError) {
      setError(loadError?.message || "Nu am putut încărca comentariile.");
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  }, [cursor, queryString]);

  useEffect(() => {
    setCursor(null);
    void load();
  // load changes with cursor; filters are the intended reload trigger.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const runAction = useCallback(async (comment, action) => {
    const destructive = action === "delete";
    const message = destructive
      ? "Ștergi definitiv acest comentariu? Acțiunea nu poate fi anulată."
      : action === "hide"
        ? "Ascunzi acest comentariu din website și aplicație?"
        : "Restaurezi acest comentariu public?";
    if (!window.confirm(message)) return;

    setActionId(comment.id);
    setError("");
    try {
      const response = await fetch("/api/dashboard/video-comments", {
        method: destructive ? "DELETE" : "PATCH",
        headers: dashboardHeaders(true),
        body: JSON.stringify({ commentId: comment.id, action }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Acțiunea a eșuat.");
      if (destructive) {
        setComments((current) => current.filter((item) => item.id !== comment.id));
      } else {
        setComments((current) =>
          current.map((item) =>
            item.id === comment.id ? { ...item, status: data.status } : item
          )
        );
      }
    } catch (actionError) {
      setError(actionError?.message || "Acțiunea a eșuat.");
    } finally {
      setActionId("");
    }
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-900">Comentarii video</h1>
          <p className="mt-1 text-sm text-slate-600">
            Moderare comentarii publicate în website și aplicația mobilă.
          </p>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[180px_1fr_1fr_auto]">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Toate statusurile</option>
            <option value="visible">Vizibile</option>
            <option value="hidden">Ascunse</option>
          </select>
          <input
            value={videoId}
            onChange={(event) => setVideoId(event.target.value)}
            placeholder="ID videoclip"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") setAppliedSearch(search);
            }}
            placeholder="Text, prenume, email sau titlu"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => setAppliedSearch(search)}
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Caută
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <p className="p-10 text-center text-slate-500">Se încarcă…</p>
          ) : comments.length === 0 ? (
            <p className="p-10 text-center text-slate-500">Nu există comentarii pentru filtrele selectate.</p>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {["Autor", "Videoclip", "Comentariu", "Status", "Data", "Acțiuni"].map((label) => (
                    <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comments.map((comment) => (
                  <tr key={comment.id} className="align-top hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-800">
                      <p className="font-semibold">{comment.authorFirstName}</p>
                      <p className="text-xs text-slate-500">{comment.authorEmail || "—"}</p>
                      <p className="mt-1 font-mono text-[10px] text-slate-400">{comment.uid}</p>
                    </td>
                    <td className="max-w-[240px] px-4 py-4 text-sm text-slate-700">
                      <p className="font-medium">{comment.videoTitle || "—"}</p>
                      <p className="mt-1 break-all font-mono text-[10px] text-slate-400">{comment.videoId}</p>
                    </td>
                    <td className="min-w-[300px] max-w-[520px] px-4 py-4 text-sm leading-relaxed text-slate-700">
                      {comment.text}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        comment.status === "hidden"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {comment.status === "hidden" ? "Ascuns" : "Vizibil"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                      {formatDate(comment.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={actionId === comment.id}
                          onClick={() => runAction(comment, comment.status === "hidden" ? "restore" : "hide")}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                          {comment.status === "hidden" ? "Restaurează" : "Ascunde"}
                        </button>
                        <button
                          type="button"
                          disabled={actionId === comment.id}
                          onClick={() => runAction(comment, "delete")}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Șterge
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {hasMore && !loading ? (
          <div className="mt-5 text-center">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => load({ append: true })}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              {loadingMore ? "Se încarcă…" : "Încarcă mai multe"}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function VideoCommentsAdminPage() {
  return (
    <>
      <Head>
        <title>Comentarii video | Administrare</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate redirectTo="/administrare/login">
        <VideoCommentsAdminScreen />
      </LocalPasswordGate>
    </>
  );
}
