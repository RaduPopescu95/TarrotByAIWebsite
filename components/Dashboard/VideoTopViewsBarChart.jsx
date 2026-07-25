import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function truncateTitle(title, max = 28) {
  const value = typeof title === "string" && title.trim() ? title.trim() : "Fără titlu";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload || {};
  return (
    <div className="max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-slate-900">{item.fullTitle || item.name}</p>
      <p className="mt-0.5 text-slate-600">
        Vizualizări:{" "}
        <span className="font-semibold tabular-nums text-slate-900">{item.views}</span>
      </p>
    </div>
  );
}

export default function VideoTopViewsBarChart({
  data = [],
  highlightedVideoId = null,
  onSelect,
}) {
  const chartData = useMemo(
    () =>
      (Array.isArray(data) ? data : []).map((row) => ({
        videoId: row.videoId,
        name: truncateTitle(row.title),
        fullTitle: row.title || "Fără titlu",
        views: Number(row.viewsCount) || 0,
      })),
    [data]
  );

  const height = Math.max(256, chartData.length * 36);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
        >
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 11, fill: "#475569" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip cursor={{ fill: "rgba(148, 163, 184, 0.12)" }} content={<CustomTooltip />} />
          <Bar
            dataKey="views"
            radius={[0, 6, 6, 0]}
            cursor="pointer"
            onClick={(entry) => {
              const videoId = entry?.videoId || entry?.payload?.videoId;
              if (typeof onSelect === "function" && videoId) {
                onSelect(videoId);
              }
            }}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.videoId}
                fill={
                  highlightedVideoId && entry.videoId === highlightedVideoId
                    ? "#d97706"
                    : "#0f172a"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
