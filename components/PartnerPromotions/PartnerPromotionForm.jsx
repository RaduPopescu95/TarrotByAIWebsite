import React from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const SELECT_CLASS =
  "h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200";

function PlacementZoneGroup({
  title,
  description,
  zones,
  selectedIds,
  onTogglePlacement,
  zonesMaxHeight,
}) {
  if (!zones.length) return null;

  return (
    <div className="grid gap-2">
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        {description ? <p className="text-xs text-gray-500">{description}</p> : null}
      </div>
      <div
        className={`grid ${zonesMaxHeight} gap-2 overflow-y-auto rounded-lg border border-gray-200 p-3`}
      >
        {zones.map((zone) => (
          <label key={zone.id} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedIds.includes(zone.id)}
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
  );
}

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
  showActions = true,
  zonesMaxHeight = "max-h-48",
}) {
  const webZones = zoneList.filter((zone) => zone.platform === "web");
  const mobileZones = zoneList.filter((zone) => zone.platform === "mobile");

  return (
    <>
      <div className="grid gap-4 py-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-900">Nume firmă</label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-900">Logo / imagine</label>

          <div className="rounded-lg border border-sky-100 bg-sky-50/80 px-3 py-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">Cum arată logo-ul după încărcare</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Pe site și în aplicație, logo-ul apare într-un pătrat mic (ca o iconiță), alături de
              numele firmei. Nu trebuie imagini diferite pentru fiecare zonă — același logo se
              folosește peste tot.
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-slate-600">
              <li>
                <strong>Formă recomandată:</strong> pătrat (ex. 512×512 pixeli)
              </li>
              <li>
                <strong>Format:</strong> PNG cu fundal transparent sau JPG simplu
              </li>
              <li>
                <strong>Evită:</strong> banner lat sau înalt — în pătrat va arăta foarte mic, cu
                mult spațiu gol
              </li>
              <li>
                <strong>Mărime fișier:</strong> sub ~500 KB (se comprimă automat la upload)
              </li>
            </ul>
          </div>

          <Input
            value={form.logoUrl}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
            placeholder="URL imagine sau încarcă fișier mai jos"
          />
          <Input type="file" accept="image/*" onChange={onLogoFile} disabled={logoUploading} />
          {logoUploading ? (
            <p className="text-xs text-gray-500">Se încarcă logo…</p>
          ) : (
            <p className="text-xs text-gray-500">
              Poți lipi un link sau alege un fișier de pe calculator / telefon.
            </p>
          )}

          {form.logoUrl ? (
            <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.logoUrl}
                  alt="Previzualizare logo"
                  className="h-16 w-16 rounded-xl border border-white bg-white object-contain p-1 shadow-sm"
                />
                <p className="mt-1 text-[10px] text-gray-500">Pe site</p>
              </div>
              <div className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.logoUrl}
                  alt="Previzualizare logo app"
                  className="h-14 w-14 rounded-xl border border-white bg-white object-contain p-1 shadow-sm"
                />
                <p className="mt-1 text-[10px] text-gray-500">În app</p>
              </div>
              <p className="min-w-0 flex-1 text-xs leading-relaxed text-gray-600">
                Previzualizare aproximativă. Dacă logo-ul pare prea mic sau cu mult spațiu liber,
                folosește o variantă mai pătrată.
              </p>
            </div>
          ) : null}
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

        <div className="grid gap-4">
          <label className="text-sm font-medium text-gray-900">Zone de afișare</label>

          <PlacementZoneGroup
            title="Site web"
            description="Zonele în care promoția apare pe cristinazurba.com"
            zones={webZones}
            selectedIds={form.placements}
            onTogglePlacement={onTogglePlacement}
            zonesMaxHeight={zonesMaxHeight}
          />

          <PlacementZoneGroup
            title="Aplicație mobilă"
            description="Zonele în care promoția apare în app iOS / Android"
            zones={mobileZones}
            selectedIds={form.placements}
            onTogglePlacement={onTogglePlacement}
            zonesMaxHeight={zonesMaxHeight}
          />
        </div>
      </div>

      {showActions ? (
        <div className="flex items-center justify-end gap-3 px-6 py-4">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Anulează
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Se salvează…" : "Salvează"}
          </Button>
        </div>
      ) : null}
    </>
  );
}
