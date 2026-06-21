import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";
import PartnerPromotionsOverview from "../../../components/PartnerPromotions/PartnerPromotionsOverview";
import PartnerPromotionsTable from "../../../components/PartnerPromotions/PartnerPromotionsTable";
import PartnerPromotionsEmptyState from "../../../components/PartnerPromotions/PartnerPromotionsEmptyState";
import PartnerPromotionSheet from "../../../components/PartnerPromotions/PartnerPromotionSheet";
import {
  createAdminPartnerPromotion,
  deleteAdminPartnerPromotion,
  fetchAdminPartnerPromotions,
  rebuildPartnerPromotionsCache,
  updateAdminPartnerPromotion,
} from "../../../utils/partnerPromotionsApi";
import { uploadImage } from "../../../utils/storageUtils";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Separator } from "../../../components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Plus, ChevronRight, Search, X, RefreshCw } from "lucide-react";

const EMPTY_FORM = {
  name: "",
  logoUrl: "",
  description: "",
  linkUrl: "",
  linkType: "website",
  displayStartAt: "",
  displayEndAt: "",
  isActive: true,
  placements: [],
  sortOrder: 0,
  locale: "all",
};

const SELECT_CLASS =
  "h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200";

function toLocalDateTimeInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isPromotionLive(row, nowMs = Date.now()) {
  if (!row || row.isActive !== true) return false;
  const startMs = row.displayStartAt ? Date.parse(row.displayStartAt) : null;
  const endMs = row.displayEndAt ? Date.parse(row.displayEndAt) : null;
  if (startMs !== null && Number.isFinite(startMs) && startMs > nowMs) return false;
  if (endMs !== null && Number.isFinite(endMs) && endMs < nowMs) return false;
  return true;
}

export default function PartnerPromotionsDashboardPage() {
  const [promotions, setPromotions] = useState([]);
  const [zones, setZones] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetError, setSheetError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [logoUploading, setLogoUploading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [localeFilter, setLocaleFilter] = useState("all");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState(null);

  const zoneList = useMemo(() => Object.values(zones || {}), [zones]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminPartnerPromotions();
      setPromotions(data.promotions);
      setZones(data.zones);
    } catch (e) {
      setError(e?.message || "Nu am putut încărca promoțiile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const lower = search.trim().toLowerCase();
    const nowMs = Date.now();

    return promotions.filter((row) => {
      const matchesSearch =
        !lower ||
        (row.name || "").toLowerCase().includes(lower) ||
        (row.description || "").toLowerCase().includes(lower);

      let matchesStatus = true;
      if (statusFilter === "active") {
        matchesStatus = isPromotionLive(row, nowMs);
      } else if (statusFilter === "inactive") {
        matchesStatus = row.isActive !== true;
      } else if (statusFilter === "scheduled") {
        const startMs = row.displayStartAt ? Date.parse(row.displayStartAt) : null;
        matchesStatus =
          row.isActive === true &&
          startMs !== null &&
          Number.isFinite(startMs) &&
          startMs > nowMs;
      } else if (statusFilter === "expired") {
        const endMs = row.displayEndAt ? Date.parse(row.displayEndAt) : null;
        matchesStatus = endMs !== null && Number.isFinite(endMs) && endMs < nowMs;
      }

      let matchesLocale = true;
      if (localeFilter === "all-locale") {
        matchesLocale = (row.locale || "all") === "all";
      } else if (localeFilter !== "all") {
        matchesLocale = (row.locale || "all") === localeFilter;
      }

      return matchesSearch && matchesStatus && matchesLocale;
    });
  }, [promotions, search, statusFilter, localeFilter]);

  const stats = useMemo(() => {
    const nowMs = Date.now();
    const total = promotions.length;
    const active = promotions.filter((row) => isPromotionLive(row, nowMs)).length;
    const inactive = promotions.filter((row) => row.isActive !== true).length;
    const scheduled = promotions.filter((row) => {
      const startMs = row.displayStartAt ? Date.parse(row.displayStartAt) : null;
      return (
        row.isActive === true &&
        startMs !== null &&
        Number.isFinite(startMs) &&
        startMs > nowMs
      );
    }).length;
    const expired = promotions.filter((row) => {
      const endMs = row.displayEndAt ? Date.parse(row.displayEndAt) : null;
      return endMs !== null && Number.isFinite(endMs) && endMs < nowMs;
    }).length;

    const webZoneIds = new Set(
      zoneList.filter((z) => z.platform === "web").map((z) => z.id)
    );
    const mobileZoneIds = new Set(
      zoneList.filter((z) => z.platform === "mobile").map((z) => z.id)
    );

    let webZones = 0;
    let mobileZones = 0;
    for (const row of promotions) {
      for (const placement of row.placements || []) {
        if (webZoneIds.has(placement)) webZones += 1;
        if (mobileZoneIds.has(placement)) mobileZones += 1;
      }
    }

    return { total, active, inactive, scheduled, expired, webZones, mobileZones };
  }, [promotions, zoneList]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setLocaleFilter("all");
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSheetError("");
    setSheetOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name || "",
      logoUrl: row.logoUrl || "",
      description: row.description || "",
      linkUrl: row.linkUrl || "",
      linkType: row.linkType || "website",
      displayStartAt: toLocalDateTimeInput(row.displayStartAt),
      displayEndAt: toLocalDateTimeInput(row.displayEndAt),
      isActive: row.isActive === true,
      placements: Array.isArray(row.placements) ? [...row.placements] : [],
      sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : 0,
      locale: row.locale || "all",
    });
    setSheetError("");
    setSheetOpen(true);
  };

  const togglePlacement = (zoneId) => {
    setForm((prev) => {
      const set = new Set(prev.placements);
      if (set.has(zoneId)) set.delete(zoneId);
      else set.add(zoneId);
      return { ...prev, placements: [...set] };
    });
  };

  const handleLogoFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setSheetError("");
    try {
      const result = await uploadImage([file], [], true, "PartnerPromotions", null, null);
      const url = result?.finalUri || result;
      if (typeof url === "string" && url) {
        setForm((prev) => ({ ...prev, logoUrl: url }));
      }
    } catch (e) {
      setSheetError(e?.message || "Upload logo eșuat.");
    } finally {
      setLogoUploading(false);
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSheetError("");
    try {
      const payload = {
        ...form,
        sortOrder: Number(form.sortOrder) || 0,
        displayStartAt: form.displayStartAt ? new Date(form.displayStartAt).toISOString() : null,
        displayEndAt: form.displayEndAt ? new Date(form.displayEndAt).toISOString() : null,
      };
      if (editingId) {
        await updateAdminPartnerPromotion(editingId, payload);
      } else {
        await createAdminPartnerPromotion(payload);
      }
      await rebuildPartnerPromotionsCache().catch(() => {});
      setSheetOpen(false);
      await load();
    } catch (e) {
      setSheetError(e?.message || "Salvare eșuată.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (row) => {
    setError("");
    try {
      await updateAdminPartnerPromotion(row.id, { isActive: !row.isActive });
      await rebuildPartnerPromotionsCache().catch(() => {});
      await load();
    } catch (e) {
      setError(e?.message || "Actualizare status eșuată.");
    }
  };

  const openDeleteDialog = (row) => {
    setPromotionToDelete(row);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setPromotionToDelete(null);
    setDeleteDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (!promotionToDelete) return;
    setError("");
    try {
      await deleteAdminPartnerPromotion(promotionToDelete.id);
      await rebuildPartnerPromotionsCache().catch(() => {});
      closeDeleteDialog();
      await load();
    } catch (e) {
      setError(e?.message || "Ștergere eșuată.");
    }
  };

  const hasActiveFilters =
    search.trim() !== "" || statusFilter !== "all" || localeFilter !== "all";

  return (
    <>
      <Head>
        <title>Promovări parteneri | Dashboard</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LocalPasswordGate redirectTo="/dashboard/login">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
                <Link href="/dashboard" className="transition-colors hover:text-gray-900">
                  Dashboard
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-gray-900">Promovări parteneri</span>
              </div>

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Promovări parteneri</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Gestionează firmele promovate pentru site și aplicație. Modificările apar automat
                    după salvare.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Reîncarcă
                  </Button>
                  <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Firmă nouă
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {error ? (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="space-y-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Lista promovări</CardTitle>
                        <CardDescription>
                          Filtrează și gestionează firmele partenere promovate.
                        </CardDescription>
                      </div>
                      {filtered.length > 0 && (
                        <Badge variant="secondary" className="text-sm">
                          {filtered.length} {filtered.length === 1 ? "rezultat" : "rezultate"}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="relative min-w-[240px] flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Caută după nume sau descriere..."
                          className="pl-9 pr-9"
                        />
                        {search ? (
                          <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>

                      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                        <TabsList>
                          <TabsTrigger value="all">Toate</TabsTrigger>
                          <TabsTrigger value="active">Active</TabsTrigger>
                          <TabsTrigger value="inactive">Inactive</TabsTrigger>
                          <TabsTrigger value="scheduled">Programate</TabsTrigger>
                          <TabsTrigger value="expired">Expirate</TabsTrigger>
                        </TabsList>
                      </Tabs>

                      <select
                        className={SELECT_CLASS}
                        value={localeFilter}
                        onChange={(e) => setLocaleFilter(e.target.value)}
                      >
                        <option value="all">Toate limbile</option>
                        <option value="all-locale">Locale: toate</option>
                        <option value="ro">Română</option>
                        <option value="en">English</option>
                      </select>

                      {hasActiveFilters ? (
                        <Button variant="outline" size="sm" onClick={resetFilters}>
                          Resetează
                        </Button>
                      ) : null}
                    </div>

                    <Separator />

                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                          Se încarcă promovările…
                        </div>
                      </div>
                    ) : promotions.length === 0 ? (
                      <PartnerPromotionsEmptyState type="noPromotions" onAction={openCreate} />
                    ) : filtered.length === 0 ? (
                      <PartnerPromotionsEmptyState type="noResults" onAction={resetFilters} />
                    ) : (
                      <PartnerPromotionsTable
                        promotions={filtered}
                        zones={zones}
                        onEdit={openEdit}
                        onToggleActive={handleToggleActive}
                        onDelete={openDeleteDialog}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              <aside className="lg:sticky lg:top-8 lg:self-start">
                <PartnerPromotionsOverview stats={stats} />
              </aside>
            </div>
          </div>
        </div>

        <PartnerPromotionSheet
          open={sheetOpen}
          onOpenChange={(open) => {
            if (!saving) setSheetOpen(open);
          }}
          editingId={editingId}
          form={form}
          setForm={setForm}
          zoneList={zoneList}
          onTogglePlacement={togglePlacement}
          onLogoFile={handleLogoFile}
          logoUploading={logoUploading}
          onCancel={() => setSheetOpen(false)}
          onSave={handleSave}
          saving={saving}
          error={sheetError}
        />

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmare ștergere</DialogTitle>
              <DialogDescription>
                Ești sigur că vrei să ștergi promovarea{" "}
                <span className="font-semibold text-gray-900">
                  &quot;{promotionToDelete?.name}&quot;
                </span>
                ? Această acțiune nu poate fi anulată.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={closeDeleteDialog}>
                Anulează
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Șterge promovarea
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </LocalPasswordGate>
    </>
  );
}
