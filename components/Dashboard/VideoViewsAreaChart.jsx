import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatDayLabel(day) {
  if (typeof day !== "string" || day.length < 10) return day || "";
  const [, month, date] = day.split("-");
  return `${date}.${month}`;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload || {};
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-slate-900">{point.day || point.label}</p>
      <p className="mt-0.5 text-slate-600">
        Vizualizări:{" "}
        <span className="font-semibold tabular-nums text-slate-900">
          {payload[0].value}
        </span>
      </p>
    </div>
  );
}

export default function VideoViewsAreaChart({ data = [] }) {
  const chartData = useMemo(
    () =>
      (Array.isArray(data) ? data : []).map((point) => ({
        day: point.day,
        label: formatDayLabel(point.day),
        views: Number(point.views) || 0,
      })),
    [data]
  );

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="videoViewsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f172a" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#0f172a" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="views"
            stroke="#0f172a"
            strokeWidth={2}
            fill="url(#videoViewsFill)"
            activeDot={{ r: 4, fill: "#0f172a" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
