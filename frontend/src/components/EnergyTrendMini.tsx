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

export const EnergyTrendMini = React.memo(function EnergyTrendMini({
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
      className="gw-glass-readable flex h-full flex-col px-5 py-4"
    >
      <div className="mb-2.5 flex min-h-[26px] items-center gap-2.5">
        <LeafOutlineIcon size={32} className="text-[#526B42]" />
        <h2 className="text-[16px] font-semibold tracking-tight text-gw-text-card">
          Tren Energi
        </h2>
      </div>

      <div className="flex flex-1  justify-between gap-2.5">
        <div className="flex min-w-0 items-start gap-3 mt-5.5">
          <div className="shrink-0">
            <p className="font-serif-display tabular-nums whitespace-nowrap text-[23px] leading-none text-[#242821] xl:text-[26px]">
              {formatKwh(todayKwh)}
            </p>
            <p className="mt-1.5 text-[12px] font-medium text-[#5E655A]">
              Hari ini
            </p>
          </div>

          <div className="min-w-0">
            <span
              className={`tabular-nums inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                isLower
                  ? "bg-[#E3E9DA] text-[#35462F]"
                  : "bg-[#E2EDF1] text-[#2F5362]"
              }`}
            >
              <span aria-hidden="true">{isLower ? "↓" : "↑"}</span>
              <span>{deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`}</span>
            </span>
            <p className="mt-1.5 whitespace-nowrap text-[11px] leading-snug text-[#5E655A] xl:text-[12px]">
              dibanding kemarin
              <br />({formatKwh(yesterdayKwh)})
            </p>
          </div>
        </div>

        <div
          className="flex h-[124px] shrink-0 items-end gap-1.5"
          aria-label="Grafik batang 5 hari terakhir"
        >
          {MINI_BARS.map((bar, idx) => (
            <div
              key={bar.label}
              className={`w-2.5 rounded-md transition-all xl:w-3 ${
                idx === 3 ? "bg-[#5E7A4B]" : "bg-[#9CAF88]/75"
              }`}
              style={{ height: `${Math.round((bar.h / 100) * 92)}px` }}
              title={bar.label}
            />
          ))}
        </div>
      </div>
    </section>
  );
});
