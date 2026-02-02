import React, { useEffect, useMemo, useState } from "react";
import type { VideoCategoryDoc, VideoCreateInput, VideoDoc, VideoPlatform } from "../types/video";
import {
  createVideo,
  deleteVideo,
  listVideos,
  listVideoCategories,
  addVideoCategory,
  deleteVideoCategoryByName,
  togglePublish,
  updateVideo,
} from "../services/videos.service";
import VideoForm from "./VideoForm";
import VideoTable from "./VideoTable";
import Modal from "./Modal";
import { LANGUAGE_LABELS } from "../../../../data/constants";
import { gTranslateFetch } from "../../../../utils/apiUtils";

type PublishFilter = "all" | "published" | "unpublished";
type PremiumFilter = "all" | "premium" | "nonPremium";
type ScheduleFilter = "all" | "scheduled" | "active";
type SortOption = "default" | "publishAtAsc" | "publishAtDesc";

export default function VideoLibraryAdminScreen() {
  const [videos, setVideos] = useState<VideoDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"videos" | "categories">("videos");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [platformFilter, setPlatformFilter] = useState<VideoPlatform | "all">("all");
  const [publishFilter, setPublishFilter] = useState<PublishFilter>("all");
  const [premiumFilter, setPremiumFilter] = useState<PremiumFilter>("all");
  const [scheduleFilter, setScheduleFilter] = useState<ScheduleFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoDoc | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoDoc | null>(null);
  const [categoryDocs, setCategoryDocs] = useState<VideoCategoryDoc[]>([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryMessage, setCategoryMessage] = useState("");
  const [categoryLocales, setCategoryLocales] = useState<Record<string, string> | undefined>(
    undefined
  );
  const [isCategoryTranslating, setIsCategoryTranslating] = useState(false);
  const [categoryTranslateMessage, setCategoryTranslateMessage] = useState("");
  const [showCategoryTranslateConfirm, setShowCategoryTranslateConfirm] = useState(false);
  const [pendingCategoryName, setPendingCategoryName] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<VideoCategoryDoc | null>(null);
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);

  const refreshVideos = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await listVideos();
      setVideos(data);
    } catch (err) {
      setErrorMessage("Nu am putut încărca lista de videoclipuri.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshVideos();
  }, []);

  const refreshCategories = async () => {
    setCategoriesLoading(true);
    try {
      const items = await listVideoCategories();
      const clean = items
        .filter((item) => typeof item.name === "string" && item.name.trim().length > 0)
        .sort((a, b) => a.name.localeCompare(b.name));
      setCategoryDocs(clean);
    } catch (_) {
      setCategoryMessage("Nu am putut încărca categoriile.");
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    refreshCategories();
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const id = window.setTimeout(() => setSuccessMessage(""), 3000);
    return () => window.clearTimeout(id);
  }, [successMessage]);

  const filteredVideos = useMemo(() => {
    const lower = searchValue.trim().toLowerCase();
    const now = new Date();
    const result = videos.filter((video) => {
      const matchesSearch = lower.length === 0 || video.title.toLowerCase().includes(lower);
      const matchesPlatform = platformFilter === "all" || video.platform === platformFilter;
      const matchesPublish =
        publishFilter === "all" ||
        (publishFilter === "published" ? video.isPublished : !video.isPublished);
      const matchesPremium =
        premiumFilter === "all" ||
        (premiumFilter === "premium" ? !!video.isPremium : !video.isPremium);
      const publishAtDate = video.publishAt?.toDate ? video.publishAt.toDate() : null;
      const isScheduled = publishAtDate ? publishAtDate > now : false;
      const matchesSchedule =
        scheduleFilter === "all" ||
        (scheduleFilter === "scheduled" ? isScheduled : !isScheduled);
      return matchesSearch && matchesPlatform && matchesPublish && matchesPremium && matchesSchedule;
    });
    if (sortOption === "default") {
      return result;
    }
    const direction = sortOption === "publishAtAsc" ? 1 : -1;
    return [...result].sort((a, b) => {
      const aTime = a.publishAt?.toDate ? a.publishAt.toDate().getTime() : null;
      const bTime = b.publishAt?.toDate ? b.publishAt.toDate().getTime() : null;
      if (aTime === null && bTime === null) return 0;
      if (aTime === null) return 1; // nulls last
      if (bTime === null) return -1;
      return (aTime - bTime) * direction;
    });
  }, [videos, searchValue, platformFilter, publishFilter, premiumFilter, scheduleFilter, sortOption]);

  const totalPages = Math.max(1, Math.ceil(filteredVideos.length / pageSize));
  const pagedVideos = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredVideos.slice(start, start + pageSize);
  }, [filteredVideos, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginationItems = useMemo(() => {
    // Returns a list like: [1, "…", 7, 8, 9, "…", 20]
    const pages: Array<number | "ellipsis"> = [];
    if (totalPages <= 9) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    const clamp = (n: number) => Math.max(1, Math.min(totalPages, n));
    const start = clamp(page - 1);
    const end = clamp(page + 1);

    pages.push(1);
    if (start > 2) pages.push("ellipsis");
    for (let p = Math.max(2, start); p <= Math.min(totalPages - 1, end); p++) {
      pages.push(p);
    }
    if (end < totalPages - 1) pages.push("ellipsis");
    pages.push(totalPages);

    // de-dup just in case
    return pages.filter((item, idx, arr) => {
      if (item === "ellipsis") return true;
      return arr.indexOf(item) === idx;
    });
  }, [page, totalPages]);

  const handleCreateClick = () => {
    setEditingVideo(null);
    setShowForm(true);
  };

  const handleEdit = (video: VideoDoc) => {
    setEditingVideo(video);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingVideo(null);
  };

  const handleDelete = async (video: VideoDoc) => {
    const confirmed = window.confirm(`Ștergi videoclipul "${video.title}"?`);
    if (!confirmed) return;
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await deleteVideo(video.id);
      await refreshVideos();
      setSuccessMessage("Videoclip șters.");
    } catch (_) {
      setErrorMessage("Ștergerea a eșuat.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (video: VideoDoc, nextValue: boolean) => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await togglePublish(video.id, nextValue);
      await refreshVideos();
      setSuccessMessage(nextValue ? "Videoclip publicat." : "Videoclip ascuns.");
    } catch (_) {
      setErrorMessage("Actualizarea statusului a eșuat.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: VideoCreateInput) => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      console.log("[VideoLibraryAdminScreen] Form submit", {
        mode: editingVideo ? "edit" : "create",
        data,
      });
      if (editingVideo) {
        await updateVideo(editingVideo.id, data);
        setSuccessMessage("Videoclip actualizat.");
      } else {
        await createVideo(data);
        setSuccessMessage("Videoclip creat.");
      }
      setShowForm(false);
      setEditingVideo(null);
      await refreshVideos();
      await refreshCategories();
    } catch (error) {
      console.error("[VideoLibraryAdminScreen] Save failed", error);
      setErrorMessage("Salvarea a eșuat.");
    } finally {
      setLoading(false);
    }
  };

  const generateCategoryLocales = async (name: string) => {
    if (!name.trim()) {
      setCategoryTranslateMessage("Completează categoria înainte de localizare.");
      return undefined;
    }
    setIsCategoryTranslating(true);
    setCategoryTranslateMessage("");
    try {
      const result: Record<string, string> = {};
      const languageKeys = Object.keys(LANGUAGE_LABELS);
      for (const lang of languageKeys) {
        if (lang === "ro") {
          result[lang] = name;
          continue;
        }
        const translated = await gTranslateFetch(name, lang);
        result[lang] = translated || name;
      }
      setCategoryLocales(result);
      setCategoryTranslateMessage("Localizarea s-a terminat. Poți continua.");
      return result;
    } catch (_) {
      setCategoryTranslateMessage("Localizarea a eșuat. Încearcă din nou.");
      return undefined;
    } finally {
      setIsCategoryTranslating(false);
    }
  };

  const handleTranslateCategory = async () => {
    const trimmed = categoryInput.trim();
    await generateCategoryLocales(trimmed);
  };

  const addCategory = async (name: string, locales?: Record<string, string>) => {
    try {
      const created = await addVideoCategory(name, locales);
      setCategoryDocs((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryInput("");
      setCategoryLocales(undefined);
      setCategoryTranslateMessage("");
      setCategoryMessage("Categoria a fost adăugată.");
    } catch (_) {
      setCategoryMessage("Nu am putut adăuga categoria.");
    }
  };

  const handleAddCategory = async () => {
    const trimmed = categoryInput.trim();
    setCategoryMessage("");
    if (!trimmed) {
      setCategoryMessage("Introdu o categorie.");
      return;
    }
    const exists = categoryDocs.some((item) => item.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setCategoryMessage("Categoria există deja.");
      return;
    }
    if (!categoryLocales || Object.keys(categoryLocales).length === 0) {
      setPendingCategoryName(trimmed);
      setShowCategoryTranslateConfirm(true);
      return;
    }
    await addCategory(trimmed, categoryLocales);
  };

  const handleConfirmCategoryTranslate = async () => {
    if (!pendingCategoryName) return;
    setShowCategoryTranslateConfirm(false);
    const locales = await generateCategoryLocales(pendingCategoryName);
    if (!locales) return;
    await addCategory(pendingCategoryName, locales);
    setPendingCategoryName(null);
  };

  const handleDeleteCategory = async (name: string) => {
    const confirmed = window.confirm(`Ștergi categoria "${name}"?`);
    if (!confirmed) return;
    try {
      await deleteVideoCategoryByName(name);
      setCategoryDocs((prev) => prev.filter((item) => item.name.toLowerCase() !== name.toLowerCase()));
      setCategoryMessage("Categoria a fost ștearsă.");
      if (selectedCategory?.name.toLowerCase() === name.toLowerCase()) {
        setShowCategoryDetails(false);
        setSelectedCategory(null);
      }
    } catch (_) {
      setCategoryMessage("Nu am putut șterge categoria.");
    }
  };

  const openCategoryDetails = (category: VideoCategoryDoc) => {
    setSelectedCategory(category);
    setShowCategoryDetails(true);
  };

  const closeCategoryDetails = () => {
    setShowCategoryDetails(false);
    setSelectedCategory(null);
  };

  const handleOpen = (video: VideoDoc) => {
    if (video.videoUrl) {
      window.open(video.videoUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopy = async (video: VideoDoc) => {
    try {
      await navigator.clipboard.writeText(video.videoUrl);
      setSuccessMessage("Link copiat.");
    } catch (_) {
      setErrorMessage("Nu am putut copia linkul.");
    }
  };

  const handlePreview = (video: VideoDoc) => {
    setPreviewVideo(video);
  };

  const getEmbedUrl = (video: VideoDoc) => {
    const raw = video.videoUrl?.trim();
    if (!raw) return null;
    try {
      const parsed = new URL(raw);
      if (video.platform === "youtube") {
        if (parsed.hostname.includes("youtu.be")) {
          const id = parsed.pathname.replace("/", "");
          return id ? `https://www.youtube.com/embed/${id}` : null;
        }
        if (parsed.hostname.includes("youtube.com")) {
          const id = parsed.searchParams.get("v") || "";
          if (id) return `https://www.youtube.com/embed/${id}`;
          const match = parsed.pathname.match(/\/embed\/([^/]+)/);
          return match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : null;
        }
      }
      if (video.platform === "vimeo") {
        if (parsed.hostname.includes("vimeo.com")) {
          const id = parsed.pathname.split("/").filter(Boolean).pop();
          return id ? `https://player.vimeo.com/video/${id}` : null;
        }
      }
      return null;
    } catch (_) {
      return null;
    }
  };

  const stats = useMemo(() => {
    const total = videos.length;
    const published = videos.filter((v) => v.isPublished).length;
    return { total, published, unpublished: total - published };
  }, [videos]);

  return (
    <div className="mx-auto w-full max-w-none space-y-8">
      <div className="flex w-full max-w-md rounded-lg bg-gray-100 p-1 text-sm text-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab("videos")}
          className={`flex-1 rounded-md px-3 py-2 font-medium transition-colors ${
            activeTab === "videos" ? "bg-white text-gray-900 shadow-sm" : "hover:text-gray-900"
          }`}
        >
          Videoclipuri
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={`flex-1 rounded-md px-3 py-2 font-medium transition-colors ${
            activeTab === "categories" ? "bg-white text-gray-900 shadow-sm" : "hover:text-gray-900"
          }`}
        >
          Categorii
        </button>
      </div>

      {activeTab === "videos" ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Videoclipuri</h1>
          <p className="mt-2 text-base text-gray-600">
                  Administrează biblioteca video afișată în aplicația mobilă.
                </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-4 py-1.5 font-medium text-gray-700 ring-1 ring-inset ring-gray-300">
              Total: <span className="ml-1 font-semibold text-gray-900">{stats.total}</span>
                  </span>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1.5 font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              Publicate: <span className="ml-1 font-semibold text-emerald-800">{stats.published}</span>
                  </span>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-4 py-1.5 font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
              Nepublicate: <span className="ml-1 font-semibold text-amber-800">{stats.unpublished}</span>
                  </span>
                </div>
              </div>
        <div className="flex items-center gap-3">
                <button
                  onClick={refreshVideos}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow"
                >
                  Reîncarcă
                </button>
                <button
                  onClick={handleCreateClick}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 hover:shadow-md"
                >
                  + Adaugă videoclip
                </button>
              </div>
            </div>

            {(errorMessage || successMessage) && (
              <div
          className={`rounded-xl border px-5 py-4 text-sm font-medium shadow-sm ${
                  errorMessage
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {errorMessage || successMessage}
              </div>
            )}

            <Modal
              open={showForm}
              onClose={closeForm}
              title={editingVideo ? "Editează videoclip" : "Adaugă videoclip"}
            >
              <VideoForm initialValue={editingVideo} onCancel={closeForm} onSubmit={handleFormSubmit} />
            </Modal>

      <Modal
        open={!!previewVideo}
        onClose={() => setPreviewVideo(null)}
        title={previewVideo ? `Test video: ${previewVideo.title}` : "Test video"}
      >
        {previewVideo && (
          <div className="space-y-4">
            {getEmbedUrl(previewVideo) ? (
              <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-black">
                <iframe
                  className="h-full w-full"
                  src={getEmbedUrl(previewVideo) || undefined}
                  title={previewVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Nu am putut genera un embed. Deschide linkul direct.
              </div>
            )}
            <button
              type="button"
              onClick={() => handleOpen(previewVideo)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
            >
              Deschide în tab nou
            </button>
          </div>
        )}
      </Modal>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
                <input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Caută după titlu..."
            className="w-full max-w-sm rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value as VideoPlatform | "all")}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">Toate platformele</option>
                  <option value="youtube">YouTube</option>
                  <option value="vimeo">Vimeo</option>
                </select>
                <select
                  value={publishFilter}
                  onChange={(e) => setPublishFilter(e.target.value as PublishFilter)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">Toate statusurile</option>
                  <option value="published">Publicate</option>
                  <option value="unpublished">Nepublicate</option>
                </select>
                <select
                  value={premiumFilter}
                  onChange={(e) => setPremiumFilter(e.target.value as PremiumFilter)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">Toate</option>
                  <option value="premium">Premium</option>
                  <option value="nonPremium">Nepremium</option>
                </select>
                <select
                  value={scheduleFilter}
                  onChange={(e) => setScheduleFilter(e.target.value as ScheduleFilter)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">Toate programările</option>
                  <option value="active">Active acum</option>
                  <option value="scheduled">Programate</option>
                </select>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="default">Sortare implicită</option>
                  <option value="publishAtAsc">PublishAt ascendent</option>
                  <option value="publishAtDesc">PublishAt descendent</option>
                </select>
                <button
                  onClick={() => {
                    setSearchValue("");
                    setPlatformFilter("all");
                    setPublishFilter("all");
                    setPremiumFilter("all");
                    setScheduleFilter("all");
                    setSortOption("default");
                  }}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
                >
                  Resetează filtre
                </button>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Afișate: <span className="font-semibold text-gray-900">{filteredVideos.length}</span>
                  </div>
            {loading && <span className="text-sm text-blue-600">Se încarcă...</span>}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="font-medium">Afișează:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size} / pagină
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-gray-600">
                {filteredVideos.length === 0 ? 0 : (page - 1) * pageSize + 1}-
                {Math.min(page * pageSize, filteredVideos.length)} din {filteredVideos.length}
              </div>
            </div>

            <VideoTable
              videos={pagedVideos}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTogglePublish={handleTogglePublish}
              onOpen={handleOpen}
              onCopy={handleCopy}
            onPreview={handlePreview}
          />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-gray-600">
                Pagina {page} din {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Înapoi
                </button>
                {paginationItems.map((item, idx) => {
                  if (item === "ellipsis") {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-2 text-sm text-gray-500">
                        …
                      </span>
                    );
                  }
                  const pageNumber = item;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition-all ${
                        pageNumber === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Înainte
                </button>
              </div>
            </div>
        </>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Categorii</h1>
            <p className="mt-2 text-base text-gray-600">
              Adaugă și gestionează categoriile folosite în videoclipuri.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <label className="text-sm font-medium text-gray-700">Categorie nouă</label>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                value={categoryInput}
                onChange={(e) => {
                  setCategoryInput(e.target.value);
                  setCategoryLocales(undefined);
                  setCategoryTranslateMessage("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Ex: Meditații, Tarot, Live Sessions"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={isCategoryTranslating}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 hover:shadow-md"
              >
                + Adaugă
              </button>
              <button
                type="button"
                onClick={handleTranslateCategory}
                disabled={isCategoryTranslating}
                className="rounded-lg border border-blue-600 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 shadow-sm transition-all hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCategoryTranslating ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    Se localizează...
                  </span>
                ) : (
                  "Generează localizări"
                )}
              </button>
            </div>
            {isCategoryTranslating && (
              <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600">
                <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                Se traduc textele...va rugam asteptati...
              </div>
            )}
            {categoryTranslateMessage && (
              <div
                className={`mt-3 text-sm ${
                  categoryTranslateMessage.includes("eșuat")
                    ? "text-red-600"
                    : "text-emerald-600"
                }`}
              >
                {categoryTranslateMessage}
              </div>
            )}
            {categoryMessage && (
              <div className="mt-3 text-sm text-gray-600">{categoryMessage}</div>
            )}
          </div>
          {showCategoryTranslateConfirm && (
            <div className="fixed inset-0 z-[95] flex items-center justify-center bg-gray-900/60 px-4">
              <div
                className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-lg font-semibold text-gray-900">
                  Textele nu au fost localizate
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Nu s-au localizat textele pe limbile necesare. Vrei să generezi localizările și să
                  adaugi categoria?
                </p>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCategoryTranslateConfirm(false)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow"
                  >
                    Anulează
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCategoryTranslate}
                    disabled={isCategoryTranslating}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCategoryTranslating ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/90 border-t-transparent" />
                        Se localizează...
                      </span>
                    ) : (
                      "Localizează și adaugă"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Categorii existente</div>
            {categoryDocs.length === 0 ? (
              categoriesLoading ? (
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  Se încarcă categoriile...
                </div>
              ) : (
              <p className="mt-2 text-sm text-gray-500">Nu există categorii salvate încă.</p>
              )
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {categoryDocs.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => openCategoryDetails(category)}
                    className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-300 transition-all hover:bg-gray-200"
                    title="Vezi localizările"
                  >
                    {category.name}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category.name);
                      }}
                      className="rounded-full px-1 text-gray-500 hover:text-red-600"
                      aria-label={`Șterge categoria ${category.name}`}
                      title="Șterge categoria"
                    >
                      ×
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Modal open={showCategoryDetails} onClose={closeCategoryDetails} title="Detalii categorie">
            {selectedCategory ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xl font-semibold text-gray-900">{selectedCategory.name}</div>
                    <div className="mt-1 text-sm text-gray-600">
                      Verifică localizările pe limbile necesare.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(selectedCategory.name)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition-all hover:bg-red-50 hover:shadow"
                      title="Șterge categoria"
                    >
                      <span className="inline-flex h-4 w-4" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                          <path
                            d="M9 3h6m-8 4h10m-1 0-.8 13a2 2 0 0 1-2 2H9.8a2 2 0 0 1-2-2L7 7m3 4v7m4-7v7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      Șterge
                    </button>
                    <button
                      type="button"
                      onClick={closeCategoryDetails}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow"
                      aria-label="Închide"
                      title="Închide"
                    >
                      <span className="text-lg leading-none">×</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-700">
                      <tr>
                        <th className="px-5 py-3">Limbă</th>
                        <th className="px-5 py-3">Traducere</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {Object.keys(LANGUAGE_LABELS).map((langKey) => {
                        const langInfo = (LANGUAGE_LABELS as Record<string, any>)[langKey];
                        const langLabel =
                          typeof langInfo?.denumire === "string" && langInfo.denumire.trim()
                            ? langInfo.denumire
                            : langKey;
                        const value =
                          selectedCategory.locales?.[langKey] ??
                          (langKey === "ro" ? selectedCategory.name : "");
                        const isMissing = !value || !value.trim();
                        return (
                          <tr key={langKey}>
                            <td className="px-5 py-3 font-medium text-gray-900">
                              {langLabel}{" "}
                              <span className="text-xs font-semibold text-gray-500">({langKey})</span>
                            </td>
                            <td className="px-5 py-3 text-gray-700">
                              {isMissing ? <span className="text-gray-400">—</span> : value}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                                  isMissing
                                    ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                                    : "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                }`}
                              >
                                {isMissing ? "Lipsește" : "OK"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">Selectează o categorie.</div>
            )}
          </Modal>
        </div>
      )}
    </div>
  );
}
