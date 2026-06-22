import React from "react";
import { Card, CardContent } from "../ui/card";
import { Video, CheckCircle2, FileText, CalendarClock, Archive } from "lucide-react";

const STAT_ITEMS = [
  {
    key: "total",
    label: "Total cursuri",
    sub: "În sistem",
    icon: Video,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    valueColor: "text-gray-900",
  },
  {
    key: "published",
    label: "Publicate",
    sub: "Active acum",
    icon: CheckCircle2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    valueColor: "text-emerald-600",
  },
  {
    key: "draft",
    label: "Ciorne",
    sub: "În așteptare",
    icon: FileText,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    valueColor: "text-amber-600",
  },
  {
    key: "scheduled",
    label: "Programate",
    sub: "În așteptare",
    icon: CalendarClock,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    valueColor: "text-purple-600",
  },
  {
    key: "archived",
    label: "Arhivate",
    sub: "Retrase din magazin",
    icon: Archive,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    valueColor: "text-gray-600",
  },
];

export default function CoursesOverview({ stats }) {
  const visibleItems = STAT_ITEMS.filter((item) => {
    if (item.key === "scheduled" || item.key === "archived") {
      return item.key in stats;
    }
    return true;
  });

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="mb-3 text-base font-semibold">Prezentare generală</h3>
        <div
          className={`grid gap-3 ${
            visibleItems.length >= 5
              ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
              : visibleItems.length >= 4
                ? "grid-cols-2 sm:grid-cols-4"
                : "grid-cols-2 sm:grid-cols-3"
          }`}
        >
          {visibleItems.map(({ key, label, sub, icon: Icon, iconBg, iconColor, valueColor }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
                >
                  <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{label}</p>
                  <p className="truncate text-xs text-gray-500">{sub}</p>
                </div>
              </div>
              <span className={`shrink-0 text-xl font-bold ${valueColor}`}>{stats[key]}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
