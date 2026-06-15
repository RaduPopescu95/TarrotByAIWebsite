import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";
import CustomDrawer from "../../../components/Dashboard/CustomDrawer";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";

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

function toLocalDateTimeInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatPeriod(row) {
  const start = row.displayStartAt ? new Date(row.displayStartAt).toLocaleDateString("ro-RO") : "—";
  const end = row.displayEndAt ? new Date(row.displayEndAt).toLocaleDateString("ro-RO") : "—";
  return `${start} → ${end}`;
}

export default function PartnerPromotionsDashboardPage() {
  const [promotions, setPromotions] = useState([]);
  const [zones, setZones] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [logoUploading, setLogoUploading] = useState(false);

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

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
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
    setDialogOpen(true);
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
    setError("");
    try {
      const result = await uploadImage([file], [], true, "PartnerPromotions", null, null);
      const url = result?.finalUri || result;
      if (typeof url === "string" && url) {
        setForm((prev) => ({ ...prev, logoUrl: url }));
      }
    } catch (e) {
      setError(e?.message || "Upload logo eșuat.");
    } finally {
      setLogoUploading(false);
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
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
      setDialogOpen(false);
      await load();
    } catch (e) {
      setError(e?.message || "Salvare eșuată.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ștergi această promovare?")) return;
    setError("");
    try {
      await deleteAdminPartnerPromotion(id);
      await rebuildPartnerPromotionsCache().catch(() => {});
      await load();
    } catch (e) {
      setError(e?.message || "Ștergere eșuată.");
    }
  };

  return (
    <>
      <Head>
        <title>Promovări parteneri | Dashboard</title>
      </Head>
      <LocalPasswordGate>
        <CustomDrawer selectedItem="Promovări parteneri" drawerText="Promovări parteneri">
          <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Promovări parteneri</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Gestionează firmele promovate pentru site și aplicație. Modificările apar automat după salvare.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={load} disabled={loading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reîncarcă
                </Button>
                <Button onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Firmă nouă
                </Button>
              </div>
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firmă</TableHead>
                    <TableHead>Perioadă</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                        Se încarcă…
                      </TableCell>
                    </TableRow>
                  ) : promotions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                        Nicio promovare încă. Adaugă prima firmă parteneră.
                      </TableCell>
                    </TableRow>
                  ) : (
                    promotions.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {row.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={row.logoUrl}
                                alt=""
                                className="h-10 w-10 rounded-lg border object-contain bg-white"
                              />
                            ) : null}
                            <div>
                              <div className="font-medium text-slate-900">{row.name}</div>
                              <div className="text-xs text-slate-500 line-clamp-1">{row.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{formatPeriod(row)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(row.placements || []).slice(0, 3).map((p) => (
                              <Badge key={p} variant="secondary" className="text-[10px]">
                                {zones[p]?.label || p}
                              </Badge>
                            ))}
                            {(row.placements || []).length > 3 ? (
                              <Badge variant="outline">+{(row.placements || []).length - 3}</Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.isActive ? "default" : "secondary"}>
                            {row.isActive ? "Activ" : "Inactiv"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(row.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editează promovarea" : "Firmă parteneră nouă"}</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Nume firmă</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Logo / imagine</label>
                  <Input
                    value={form.logoUrl}
                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                    placeholder="URL imagine sau încarcă fișier"
                  />
                  <Input type="file" accept="image/*" onChange={handleLogoFile} disabled={logoUploading} />
                  {logoUploading ? <p className="text-xs text-slate-500">Se încarcă logo…</p> : null}
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Descriere scurtă</label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    maxLength={200}
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Link</label>
                    <Input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Tip link</label>
                    <select
                      className="h-10 rounded-md border border-slate-200 px-3 text-sm"
                      value={form.linkType}
                      onChange={(e) => setForm({ ...form, linkType: e.target.value })}
                    >
                      <option value="website">Website</option>
                      <option value="store">Magazin online</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="offer">Pagină ofertă</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Început afișare</label>
                    <Input
                      type="datetime-local"
                      value={form.displayStartAt}
                      onChange={(e) => setForm({ ...form, displayStartAt: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Sfârșit afișare</label>
                    <Input
                      type="datetime-local"
                      value={form.displayEndAt}
                      onChange={(e) => setForm({ ...form, displayEndAt: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Prioritate (sort)</label>
                    <Input
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Limbă</label>
                    <select
                      className="h-10 rounded-md border border-slate-200 px-3 text-sm"
                      value={form.locale}
                      onChange={(e) => setForm({ ...form, locale: e.target.value })}
                    >
                      <option value="all">Toate</option>
                      <option value="ro">Română</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Status</label>
                    <select
                      className="h-10 rounded-md border border-slate-200 px-3 text-sm"
                      value={form.isActive ? "active" : "inactive"}
                      onChange={(e) => setForm({ ...form, isActive: e.target.value === "active" })}
                    >
                      <option value="active">Activ</option>
                      <option value="inactive">Inactiv</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Zone de afișare</label>
                  <div className="grid max-h-48 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
                    {zoneList.map((zone) => (
                      <label key={zone.id} className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.placements.includes(zone.id)}
                          onChange={() => togglePlacement(zone.id)}
                          className="mt-1"
                        />
                        <span>
                          <span className="font-medium">{zone.label}</span>
                          <span className="block text-xs text-slate-500">{zone.id}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                  Anulează
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Se salvează…" : "Salvează"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CustomDrawer>
      </LocalPasswordGate>
    </>
  );
}
