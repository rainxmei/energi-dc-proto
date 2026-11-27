"use client";

import React, { useState } from "react";
import { useGridWatch } from "@/context/GridWatchContext";
import { formatDateTimeWIB, formatKwh, formatWatts } from "@/lib/format";
import { DownloadIcon } from "@/components/Icons";
import { PowerChart } from "@/components/PowerChart";

export default function HistoryPage() {
  const {
    chartSeries,
    timeRange,
    setTimeRange,
    activities,
    channels,
    settings,
  } = useGridWatch();

  const [activeTab, setActiveTab] = useState<"readings" | "activities">(
    "readings"
  );

  const exportCsv = () => {
    const headers = [
      "Waktu (WIB)",
      "Total Daya (W)",
      `${channels[0]?.name || "Kanal 1"} (W)`,
      `${channels[1]?.name || "Kanal 2"} (W)`,
      `${channels[2]?.name || "Kanal 3"} (W)`,
      `${channels[3]?.name || "Kanal 4"} (W)`,
      "Energi (kWh)",
    ];

    const rows = chartSeries.map((pt) => [
      pt.label,
      pt.totalW,
      pt.ch1W,
      pt.ch2W,
      pt.ch3W,
      pt.ch4W,
      pt.energyKwh,
    ]);

    const csvBody = [headers, ...rows]
      .map((line) => line.map((cell) => `"${String(cell)}"`).join(","))
      .join("\n");

    const blob = new Blob([`\uFEFF${csvBody}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gridwatch-riwayat-${timeRange}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-gw-text-header-muted uppercase">
            RIWAYAT ENERGI
          </p>
          <h1 className="font-serif-display mt-0.5 text-[28px] leading-tight text-gw-text-header sm:text-[36px]">
            Grafik & Log Pengukuran
          </h1>
          <p className="mt-1 text-[14px] text-gw-text-header-muted">
            Telusuri riwayat konsumsi daya dan aktivitas relay dalam zona waktu
            WIB.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          disabled={chartSeries.length === 0}
          className="inline-flex min-h-[44px] items-center gap-2 self-start rounded-full bg-[#526B42] px-5 text-[14px] font-semibold text-[#F7F5EF] shadow-xs transition-opacity hover:opacity-95 disabled:opacity-50 sm:self-auto"
        >
          <DownloadIcon size={17} />
          <span>Unduh CSV</span>
        </button>
      </div>

      <PowerChart
        data={chartSeries}
        timeRange={timeRange}
        onRangeChange={setTimeRange}
        thresholdW={settings.totalThresholdW}
        height={260}
      />

      <section className="gw-glass-readable p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Jenis tabel riwayat"
            className="inline-flex rounded-full bg-[#35462F]/10 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "readings"}
              onClick={() => setActiveTab("readings")}
              className={`min-h-[38px] rounded-full px-4 text-[13px] font-semibold transition-colors ${
                activeTab === "readings"
                  ? "bg-[#F7F5EF] text-[#242821] shadow-xs"
                  : "text-[#5E655A] hover:text-[#242821]"
              }`}
            >
              Data Pengukuran ({chartSeries.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "activities"}
              onClick={() => setActiveTab("activities")}
              className={`min-h-[38px] rounded-full px-4 text-[13px] font-semibold transition-colors ${
                activeTab === "activities"
                  ? "bg-[#F7F5EF] text-[#242821] shadow-xs"
                  : "text-[#5E655A] hover:text-[#242821]"
              }`}
            >
              Log Aktivitas ({activities.length})
            </button>
          </div>
        </div>

        {activeTab === "readings" ? (
          chartSeries.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-[#5E655A]">
              Belum ada data pengukuran untuk periode ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#35462F]/15 text-[12px] font-semibold text-[#5E655A]">
                    <th className="py-2.5 pr-3">Waktu (WIB)</th>
                    <th className="py-2.5 pr-3">Total Daya</th>
                    <th className="py-2.5 pr-3">{channels[0]?.name}</th>
                    <th className="py-2.5 pr-3">{channels[1]?.name}</th>
                    <th className="py-2.5 pr-3">{channels[2]?.name}</th>
                    <th className="py-2.5 pr-3">{channels[3]?.name}</th>
                    <th className="py-2.5 text-right">Energi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#35462F]/10">
                  {[...chartSeries].reverse().map((row, idx) => (
                    <tr key={`${row.label}-${idx}`} className="text-[#242821]">
                      <td className="tabular-nums py-2.5 pr-3 font-medium">
                        {row.label}
                      </td>
                      <td className="tabular-nums py-2.5 pr-3 font-semibold text-[#35462F]">
                        {formatWatts(row.totalW)}
                      </td>
                      <td className="tabular-nums py-2.5 pr-3">
                        {formatWatts(row.ch1W)}
                      </td>
                      <td className="tabular-nums py-2.5 pr-3">
                        {formatWatts(row.ch2W)}
                      </td>
                      <td className="tabular-nums py-2.5 pr-3">
                        {formatWatts(row.ch3W)}
                      </td>
                      <td className="tabular-nums py-2.5 pr-3">
                        {formatWatts(row.ch4W)}
                      </td>
                      <td className="tabular-nums py-2.5 text-right text-[#5E655A]">
                        {formatKwh(row.energyKwh)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : activities.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-[#5E655A]">
            Belum ada log aktivitas tercatat.
          </p>
        ) : (
          <ul className="divide-y divide-[#35462F]/10">
            {activities.map((act) => (
              <li
                key={act.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-[14px]"
              >
                <span className="flex items-center gap-2.5 text-[#242821]">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      act.tone === "critical"
                        ? "bg-[#E8412C]"
                        : act.tone === "warning"
                          ? "bg-[#D7B36A]"
                          : act.tone === "info"
                            ? "bg-[#7FA8B8]"
                            : "bg-[#526B42]"
                    }`}
                  />
                  <span>{act.message}</span>
                </span>
                <span className="tabular-nums text-[12px] text-[#5E655A]">
                  {formatDateTimeWIB(act.occurredAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
