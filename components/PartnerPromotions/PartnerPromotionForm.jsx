import React from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const SELECT_CLASS =
  "h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200";

export default function PartnerPromotionForm({
  form,
  setForm,
  zoneList,
  onTogglePlacement,
  onLogoFile,
  logoUploading,
  onCancel,
  onSave,
  saving,
}) {
  return (
    <>
      <div className="grid gap-4 py-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-900">Nume firmă</label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-900">Logo / imagine</label>
          <Input
            value={form.logoUrl}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
            placeholder="URL imagine sau încarcă fișier"
          />
          <Input type="file" accept="image/*" onChange={onLogoFile} disabled={logoUploading} />
          {logoUploading ? <p className="text-xs text-gray-500">Se încarcă logo…</p> : null}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-900">Descriere scurtă</label>
          <Input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={200}
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-900">Link</label>
            <Input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-900">Tip link</label>
            <select
              className={SELECT_CLASS}
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
            <label className="text-sm font-medium text-gray-900">Început afișare</label>
            <Input
              type="datetime-local"
              value={form.displayStartAt}
              onChange={(e) => setForm({ ...form, displayStartAt: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-900">Sfârșit afișare</label>
            <Input
              type="datetime-local"
              value={form.displayEndAt}
              onChange={(e) => setForm({ ...form, displayEndAt: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-900">Prioritate (sort)</label>
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-900">Limbă</label>
            <select
              className={SELECT_CLASS}
              value={form.locale}
              onChange={(e) => setForm({ ...form, locale: e.target.value })}
            >
              <option value="all">Toate</option>
              <option value="ro">Română</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-900">Status</label>
            <select
              className={SELECT_CLASS}
              value={form.isActive ? "active" : "inactive"}
              onChange={(e) => setForm({ ...form, isActive: e.target.value === "active" })}
            >
              <option value="active">Activ</option>
              <option value="inactive">Inactiv</option>
            </select>
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-900">Zone de afișare</label>
          <div className="grid max-h-48 gap-2 overflow-y-auto rounded-lg border border-gray-200 p-3 sm:grid-cols-2">
            {zoneList.map((zone) => (
              <label key={zone.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.placements.includes(zone.id)}
                  onChange={() => onTogglePlacement(zone.id)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                />
                <span>
                  <span className="font-medium text-gray-900">{zone.label}</span>
                  <span className="block text-xs text-gray-500">{zone.id}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Anulează
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? "Se salvează…" : "Salvează"}
        </Button>
      </div>
    </>
  );
}
