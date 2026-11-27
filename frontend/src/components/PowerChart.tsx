"use client";

import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PowerPoint, TimeRange } from "@/types/gridwatch";
import { formatWatts } from "@/lib/format";
import { ChartBarIcon } from "./Icons";

interface PowerChartProps {
  data: PowerPoint[];
  timeRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  thresholdW?: number;
  title?: string;
  height?: number;
}

const RANGE_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: "today", label: "Hari Ini" },
  { value: "7d", label: "7 Hari" },
  { value: "30d", label: "30 Hari" },
];

export const PowerChart = React.memo(function PowerChart({
  data,
  timeRange,
  onRangeChange,
  thresholdW,
  title = "Penggunaan Daya (W)",
  height = 240,
}: PowerChartProps) {
  const maxPower = Math.max(
    ...data.map((d) => d.totalW),
    thresholdW ? thresholdW * 1.12 : 0,
    100,
  );
  const yMax = Math.ceil(maxPower / 100) * 100;

  return (
    <section
      aria-label={title}
      className="gw-glass-kpi flex h-full flex-col justify-between p-5 sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#F7F5EF]/70 text-[#35462F]">
            <ChartBarIcon size={18} />
          </span>
          <h2 className="font-serif-display text-[21px] leading-tight text-[#242821] sm:text-[24px]">
            {title}
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="Pilih rentang waktu grafik"
          className="inline-flex items-center rounded-full bg-[#35462F]/12 p-1"
        >
          {RANGE_OPTIONS.map((opt) => {
            const active = timeRange === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onRangeChange(opt.value)}
                className={`min-h-[36px] rounded-full px-3.5 text-[13px] font-medium transition-colors duration-200 ${
                  active
                    ? "bg-[#F7F5EF] text-[#242821] shadow-xs"
                    : "text-[#35462F] hover:bg-[#F7F5EF]/45"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[220px] flex-col items-center justify-center rounded-2xl bg-[#F7F5EF]/55 px-4 text-center">
          <p className="text-[15px] font-medium text-[#35462F]">
            Belum ada data untuk periode ini.
          </p>
          <p className="mt-1 text-[13px] text-[#5E655A]">
            Pilih rentang waktu lain atau aktifkan Mode Simulasi di Pengaturan.
          </p>
        </div>
      ) : (
        <div className="w-full flex-1" style={{ minHeight: height }}>
          <ResponsiveContainer
            width="100%"
            height="100%"
            minHeight={height}
            debounce={60}
          >
            <AreaChart
              data={data}
              margin={{ top: 14, right: 12, left: -12, bottom: 4 }}
            >
              <defs>
                <linearGradient id="gwPowerFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#526B42" stopOpacity={0.34} />
                  <stop offset="95%" stopColor="#9CAF88" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 4"
                vertical={false}
                stroke="rgba(53, 70, 47, 0.14)"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#35462F", fontSize: 12 }}
                minTickGap={22}
              />
              <YAxis
                domain={[0, yMax]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#35462F", fontSize: 12 }}
                width={48}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const val = Number(payload[0].value ?? 0);
                  const overLimit =
                    thresholdW && thresholdW > 0 && val > thresholdW;
                  return (
                    <div className="rounded-2xl border border-white/75 bg-[#F7F5EF]/95 px-3.5 py-2 shadow-md backdrop-blur-md">
                      <p className="text-[12px] font-medium text-[#5E655A]">
                        {label} WIB
                      </p>
                      <p
                        className={`tabular-nums text-[15px] font-semibold ${
                          overLimit ? "text-[#B83220]" : "text-[#242821]"
                        }`}
                      >
                        {formatWatts(val)}
                      </p>
                      {overLimit && (
                        <p className="text-[11px] font-medium text-[#B83220]">
                          Melewati batas {formatWatts(thresholdW)}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              {thresholdW && thresholdW > 0 && (
                <ReferenceLine
                  y={thresholdW}
                  stroke="#C4963D"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  label={{
                    value: `Batas ${formatWatts(thresholdW)}`,
                    position: "insideTopRight",
                    fill: "#6F531D",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="totalW"
                stroke="#526B42"
                strokeWidth={2.5}
                fill="url(#gwPowerFill)"
                activeDot={{
                  r: 5.5,
                  fill: "#F7F5EF",
                  stroke: "#526B42",
                  strokeWidth: 2.5,
                }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
});
