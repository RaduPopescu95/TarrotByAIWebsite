import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Video, CheckCircle2, FileText, CalendarClock, Archive } from "lucide-react";

export default function CoursesOverview({ stats, lastUpdated }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Prezentare generală</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <Video className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Total cursuri</p>
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
              <p className="text-sm font-medium text-gray-900">Publicate</p>
              <p className="text-xs text-gray-500">Active acum</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-emerald-600">{stats.published}</span>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
              <FileText className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Ciorne</p>
              <p className="text-xs text-gray-500">În așteptare</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-amber-600">{stats.draft}</span>
        </div>

        {"scheduled" in stats && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                  <CalendarClock className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Programate</p>
                  <p className="text-xs text-gray-500">În așteptare</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-purple-600">{stats.scheduled}</span>
            </div>
          </>
        )}

        {"archived" in stats && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                  <Archive className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Arhivate</p>
                  <p className="text-xs text-gray-500">Retrase din magazin</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-600">{stats.archived}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
