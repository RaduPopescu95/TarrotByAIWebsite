import React from "react";
import type { VideoDoc, VideoSortDirection, VideoSortField } from "../types/video";
import { formatTimestamp } from "../utils/videoFormat";

type Props = {
  videos: VideoDoc[];
  loading?: boolean;
  sortField: VideoSortField;
  sortDirection: VideoSortDirection;
  onSortChange: (field: VideoSortField) => void;
  onEdit: (video: VideoDoc) => void;
  onDelete: (video: VideoDoc) => void;
  onTogglePublish: (video: VideoDoc, nextValue: boolean) => void;
  onOpen: (video: VideoDoc) => void;
  onCopy: (video: VideoDoc) => void;
  onPreview: (video: VideoDoc) => void;
};

export default function VideoTable({
  videos,
  loading = false,
  sortField,
  sortDirection,
  onSortChange,
  onEdit,
  onDelete,
  onTogglePublish,
  onOpen,
  onCopy,
  onPreview,
}: Props) {
  const getAriaSort = (field: VideoSortField): "ascending" | "descending" | "none" => {
    if (sortField !== field) return "none";
    return sortDirection === "asc" ? "ascending" : "descending";
  };

  const getSortIndicator = (field: VideoSortField): string => {
    if (sortField !== field) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const sortHeaderButtonClass =
    "inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-left transition-colors hover:text-gray-900";

  if (videos.length === 0) {
    if (loading) {
      return (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto inline-flex items-center gap-3 text-sm font-medium text-gray-700">
            <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            Se încarcă videoclipurile...
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto max-w-md">
          <div className="text-lg font-semibold text-gray-900">Niciun videoclip</div>
          <div className="mt-2 text-sm text-gray-600">
            Adaugă primul videoclip și setează dacă este publicat în aplicație.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-700">
            <tr>
              <th className="px-6 py-4" aria-sort={getAriaSort("order")}>
                <button
                  type="button"
                  onClick={() => onSortChange("order")}
                  className={sortHeaderButtonClass}
                >
                  <span>Ordine</span>
                  <span className="text-[10px] text-gray-500">{getSortIndicator("order")}</span>
                </button>
              </th>
              <th className="px-6 py-4" aria-sort={getAriaSort("title")}>
                <button
                  type="button"
                  onClick={() => onSortChange("title")}
                  className={sortHeaderButtonClass}
                >
                  <span>Titlu</span>
                  <span className="text-[10px] text-gray-500">{getSortIndicator("title")}</span>
                </button>
              </th>
              <th className="px-6 py-4" aria-sort={getAriaSort("platform")}>
                <button
                  type="button"
                  onClick={() => onSortChange("platform")}
                  className={sortHeaderButtonClass}
                >
                  <span>Platformă</span>
                  <span className="text-[10px] text-gray-500">{getSortIndicator("platform")}</span>
                </button>
              </th>
              <th className="px-6 py-4" aria-sort={getAriaSort("category")}>
                <button
                  type="button"
                  onClick={() => onSortChange("category")}
                  className={sortHeaderButtonClass}
                >
                  <span>Categorie</span>
                  <span className="text-[10px] text-gray-500">{getSortIndicator("category")}</span>
                </button>
              </th>
              <th className="px-6 py-4" aria-sort={getAriaSort("publishAt")}>
                <button
                  type="button"
                  onClick={() => onSortChange("publishAt")}
                  className={sortHeaderButtonClass}
                >
                  <span>Publicare</span>
                  <span className="text-[10px] text-gray-500">{getSortIndicator("publishAt")}</span>
                </button>
              </th>
              <th className="px-6 py-4" aria-sort={getAriaSort("isPublished")}>
                <button
                  type="button"
                  onClick={() => onSortChange("isPublished")}
                  className={sortHeaderButtonClass}
                >
                  <span>Publicat</span>
                  <span className="text-[10px] text-gray-500">{getSortIndicator("isPublished")}</span>
                </button>
              </th>
              <th className="px-6 py-4" aria-sort={getAriaSort("createdAt")}>
                <button
                  type="button"
                  onClick={() => onSortChange("createdAt")}
                  className={sortHeaderButtonClass}
                >
                  <span>Creat</span>
                  <span className="text-[10px] text-gray-500">{getSortIndicator("createdAt")}</span>
                </button>
              </th>
              <th className="px-6 py-4 text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {videos.map((video) => (
              <tr
                key={video.id}
                className="transition-colors hover:bg-gray-50"
              >
                <td className="px-6 py-4 text-gray-600">{video.order ?? "—"}</td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">
                    {video.title}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    {video.platform === "youtube" ? "YouTube" : "Vimeo"}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {video.category ? (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-300">
                      {video.category}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {video.publishAt ? (
                    <div className="flex flex-col gap-1">
                      <span>{formatTimestamp(video.publishAt)}</span>
                      <span
                        className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                          video.publishAt.toDate && video.publishAt.toDate() > new Date()
                            ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                            : "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                        }`}
                      >
                        {video.publishAt.toDate && video.publishAt.toDate() > new Date()
                          ? "Programat"
                          : "Activ"}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                      Activ
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onTogglePublish(video, !video.isPublished)}
                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-all ${
                      video.isPublished
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 hover:bg-emerald-100"
                        : "bg-gray-100 text-gray-700 ring-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {video.isPublished ? "Public" : "Ascuns"}
                  </button>
                </td>
                <td className="px-6 py-4 text-gray-600">{formatTimestamp(video.createdAt)}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                    onClick={() => onPreview(video)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-indigo-50 hover:text-indigo-700 hover:shadow"
                  >
                    Test video
                  </button>
                  <button
                      onClick={() => onEdit(video)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-blue-50 hover:text-blue-700 hover:shadow"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onOpen(video)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-emerald-50 hover:text-emerald-700 hover:shadow"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => onCopy(video)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-amber-50 hover:text-amber-700 hover:shadow"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => onDelete(video)}
                      className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm transition-all hover:bg-red-50 hover:shadow"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
