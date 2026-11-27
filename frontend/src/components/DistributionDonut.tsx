"use client";

import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ChannelReading } from "@/types/gridwatch";
import { formatWatts } from "@/lib/format";
import { LayersIcon } from "./Icons";

const SEGMENT_COLORS = ["#5E7A4B", "#7FA8B8", "#D7B36A", "#B5C4A1"];

interface DistributionDonutProps {
  channels: ChannelReading[];
  totalPowerW: number | null;
}

export const DistributionDonut = React.memo(function DistributionDonut({
  channels,
  totalPowerW,
}: DistributionDonutProps) {
  const safeTotal = totalPowerW && totalPowerW > 0 ? totalPowerW : 0;

  const items = channels.map((ch, idx) => {
    const power = ch.powerW ?? 0;
    const pct = safeTotal > 0 ? Math.round((power / safeTotal) * 100) : 0;
    return {
      id: ch.id,
      name: ch.name,
      value: power,
      pct,
      color: SEGMENT_COLORS[idx % SEGMENT_COLORS.length],
    };
  });

  const chartData =
    safeTotal > 0
      ? items.filter((item) => item.value > 0)
      : [
          {
            id: 0,
            name: "Tidak ada beban",
            value: 1,
            pct: 0,
            color: "#D6D2C8",
          },
        ];

  return (
    <section
      aria-label="Distribusi Penggunaan"
      className="gw-glass-readable flex h-full flex-col px-5 py-4"
    >
      <div className="mb-2.5 flex min-h-[26px] items-center gap-2.5">
        <LayersIcon size={32} className="text-[#526B42]" />
        <h2 className="text-[16px] font-semibold tracking-tight text-gw-text-card">
          Distribusi Penggunaan
        </h2>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 sm:flex-row sm:items-center">
        <div className="relative h-[120px] w-[120px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={38}
                outerRadius={54}
                paddingAngle={safeTotal > 0 ? 2 : 0}
                stroke="none"
                isAnimationActive={false}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const row = payload[0].payload as (typeof chartData)[number];
                  return (
                    <div className="rounded-xl border border-white/70 bg-[#F7F5EF]/95 px-3 py-1.5 text-[12px] shadow-sm">
                      <p className="font-medium text-[#242821]">{row.name}</p>
                      <p className="tabular-nums text-[#5E655A]">
                        {formatWatts(row.value)} ({row.pct}%)
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="tabular-nums text-[16px] font-bold text-[#242821]">
              {formatWatts(totalPowerW)}
            </span>
            <span className="text-[11px] text-[#5E655A]">Total</span>
          </div>
        </div>

        <ul className="w-full space-y-2 text-[13px]">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2"
            >
              <span className="flex min-w-0 items-center gap-2 text-[#242821]">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="tabular-nums shrink-0 font-semibold text-[#35462F]">
                {item.pct}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
});
