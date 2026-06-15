import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Building2, CheckCircle2, XCircle, CalendarClock, Clock } from "lucide-react";

export default function PartnerPromotionsOverview({ stats }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Prezentare generală</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Total firme</p>
              <p className="text-xs text-gray-500">În sistem</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Active acum</p>
              <p className="text-xs text-gray-500">În perioada de afișare</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-emerald-600">{stats.active}</span>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
              <XCircle className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Inactive</p>
              <p className="text-xs text-gray-500">Dezactivate manual</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-gray-600">{stats.inactive}</span>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
              <CalendarClock className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Programate</p>
              <p className="text-xs text-gray-500">Neîncepute încă</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-purple-600">{stats.scheduled}</span>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Expirate</p>
              <p className="text-xs text-gray-500">Perioadă încheiată</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-amber-600">{stats.expired}</span>
        </div>

        {"webZones" in stats && "mobileZones" in stats && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Zone web</p>
                <p className="text-lg font-semibold text-gray-900">{stats.webZones}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Zone app</p>
                <p className="text-lg font-semibold text-gray-900">{stats.mobileZones}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
