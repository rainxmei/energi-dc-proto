"use client";

import React from "react";
import { formatKwh } from "@/lib/format";
import { LeafOutlineIcon } from "./Icons";

interface EnergyTrendMiniProps {
  todayKwh: number;
  yesterdayKwh: number;
}

const MINI_BARS = [
  { label: "Sen", h: 40 },
  { label: "Sel", h: 52 },
  { label: "Rab", h: 66 },
  { label: "Kam", h: 92 },
  { label: "Jum", h: 62 },
];

export function EnergyTrendMini({
  todayKwh,
  yesterdayKwh,
}: EnergyTrendMiniProps) {
  const deltaPct =
    yesterdayKwh > 0
      ? Math.round(((todayKwh - yesterdayKwh) / yesterdayKwh) * 100)
      : 0;
  const isLower = deltaPct <= 0;

  return (
    <section
      aria-label="Tren Energi"
      className="gw-glass-readable flex flex-col justify-between p-5"
    >
      <div className="mb-3 flex items-center gap-2">
        <LeafOutlineIcon size={18} className="text-[#526B42]" />
        <h2 className="font-serif-display text-[20px] text-[#242821]">
          Tren Energi
        </h2>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="tabular-nums text-[26px] font-bold leading-none text-[#242821]">
              {formatKwh(todayKwh)}
            </p>
            <span
              className={`tabular-nums rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                isLower
                  ? "bg-[#E3E9DA] text-[#35462F]"
                  : "bg-[#E2EDF1] text-[#2F5362]"
              }`}
            >
              {deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`}
            </span>
          </div>
          <p className="mt-1 text-[13px] font-medium text-[#5E655A]">
            Hari ini
          </p>
          <p className="mt-2 text-[12px] leading-snug text-[#5E655A]">
            dibanding kemarin ({formatKwh(yesterdayKwh)})
          </p>
        </div>

        <div
          className="flex h-[96px] items-end gap-2"
          aria-label="Grafik batang 5 hari terakhir"
        >
          {MINI_BARS.map((bar, idx) => (
            <div
              key={bar.label}
              className="flex h-full flex-col items-center justify-end gap-1"
            >
              <div
                className={`w-3.5 rounded-t-md transition-all ${
                  idx === 3 ? "bg-[#5E7A4B]" : "bg-[#9CAF88]/75"
                }`}
                style={{ height: `${bar.h}%` }}
                title={`${bar.label}`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
