import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDayRo } from "./video-stats/formatVideoStatsDelta";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload || {};
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-slate-900">{point.dayLabel || point.day}</p>
      <p className="mt-0.5 text-slate-600">
        Vizualizări:{" "}
        <span className="font-semibold tabular-nums text-slate-900">
          {payload[0].value}
        </span>
      </p>
    </div>
  );
}

/**
 * @param {"bar"|"line"|"area"} [variant]
 */
export default function VideoViewsAreaChart({ data = [], variant = "area", height = 288 }) {
  const chartData = useMemo(
    () =>
      (Array.isArray(data) ? data : []).map((point) => ({
        day: point.day,
        dayLabel: formatDayRo(point.day),
        label: formatDayRo(point.day),
        views: Number(point.views) || 0,
      })),
    [data]
  );

  const commonAxis = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
      <XAxis
        dataKey="label"
        tick={{ fontSize: 11, fill: "#64748b" }}
        tickLine={false}
        axisLine={{ stroke: "#e2e8f0" }}
        minTickGap={20}
      />
      <YAxis
        allowDecimals={false}
        tick={{ fontSize: 11, fill: "#64748b" }}
        tickLine={false}
        axisLine={false}
        width={36}
      />
      <Tooltip content={<CustomTooltip />} />
    </>
  );

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {variant === "bar" ? (
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            {commonAxis}
            <Bar dataKey="views" fill="#0f172a" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        ) : variant === "line" ? (
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            {commonAxis}
            <Line
              type="linear"
              dataKey="views"
              stroke="#0f172a"
              strokeWidth={2}
              dot={{ r: 3, fill: "#0f172a" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        ) : (
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="videoViewsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f172a" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#0f172a" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            {commonAxis}
            <Area
              type="linear"
              dataKey="views"
              stroke="#0f172a"
              strokeWidth={2}
              fill="url(#videoViewsFill)"
              activeDot={{ r: 4, fill: "#0f172a" }}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
