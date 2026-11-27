"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useGridWatch } from "@/context/GridWatchContext";
import { formatDateTimeWIB, formatWatts } from "@/lib/format";
import { AlertIcon, BellIcon, BoltIcon } from "@/components/Icons";

export default function AlertsPage() {
  const {
    alerts,
    resolveAlert,
    clearResolvedAlerts,
    notificationPermission,
    enableNotifications,
    sendTestNotification,
    triggerPowerSpike,
    spikeActive,
    settings,
    totalPowerW,
  } = useGridWatch();

  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");

  const filteredAlerts = useMemo(() => {
    if (filter === "active") return alerts.filter((a) => !a.resolved);
    if (filter === "resolved") return alerts.filter((a) => a.resolved);
    return alerts;
  }, [alerts, filter]);

  const permissionLabel =
    notificationPermission === "granted"
      ? "Notifikasi browser aktif"
      : notificationPermission === "denied"
        ? "Izin notifikasi diblokir browser"
        : notificationPermission === "unsupported"
          ? "Browser tidak mendukung Notification API"
          : "Izin notifikasi belum diaktifkan";

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-gw-text-header-muted uppercase">
          PERINGATAN & NOTIFIKASI
        </p>
        <h1 className="font-serif-display mt-0.5 text-[28px] leading-tight text-gw-text-header sm:text-[36px]">
          Pusat Peringatan Daya
        </h1>
        <p className="mt-1 text-[14px] text-gw-text-header-muted">
          Notifikasi otomatis aktif saat total daya melebihi{" "}
          <strong>{formatWatts(settings.totalThresholdW)}</strong> atau batas
          tiap kanal terlampaui.
        </p>
      </div>

      {/* PWA Notification & Live Demo Controls */}
      <section className="gw-glass-readable p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                notificationPermission === "granted"
                  ? "bg-[#E3E9DA] text-[#526B42]"
                  : notificationPermission === "denied"
                    ? "bg-[#F9E3DE] text-[#B83220]"
                    : "bg-[#F5EBD2] text-[#78591C]"
              }`}
            >
              <BellIcon size={21} />
            </span>
            <div>
              <h2 className="text-[16px] font-semibold text-[#242821]">
                {permissionLabel}
              </h2>
              <p className="mt-0.5 text-[13px] text-[#5E655A]">
                Daya saat ini{" "}
                <strong className="tabular-nums text-[#242821]">
                  {formatWatts(totalPowerW)}
                </strong>{" "}
                / batas total {formatWatts(settings.totalThresholdW)} · Jeda
                anti-spam {settings.cooldownSeconds} detik.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {notificationPermission !== "granted" &&
              notificationPermission !== "unsupported" && (
                <button
                  type="button"
                  onClick={() => void enableNotifications()}
                  className="min-h-[44px] rounded-full bg-[#526B42] px-4 text-[13px] font-semibold text-[#F7F5EF] transition-opacity hover:opacity-95"
                >
                  Aktifkan Notifikasi
                </button>
              )}

            <button
              type="button"
              onClick={() => void sendTestNotification()}
              className="min-h-[44px] rounded-full border border-[#35462F]/25 bg-[#F7F5EF] px-4 text-[13px] font-semibold text-[#242821] transition-colors hover:bg-white"
            >
              Tes Notifikasi
            </button>

            <button
              type="button"
              onClick={triggerPowerSpike}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#D7B36A] px-4 text-[13px] font-semibold text-[#242821] transition-opacity hover:opacity-95"
            >
              <BoltIcon size={16} />
              <span>
                {spikeActive
                  ? "Lonjakan Aktif (15 dtk)"
                  : "Simulasikan Lonjakan Daya"}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Alert List */}
      <section className="gw-glass-readable p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full bg-[#35462F]/10 p-1">
            {(
              [
                ["all", "Semua"],
                ["active", "Aktif"],
                ["resolved", "Selesai"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setFilter(val)}
                className={`min-h-[36px] rounded-full px-4 text-[13px] font-semibold transition-colors ${
                  filter === val
                    ? "bg-[#F7F5EF] text-[#242821] shadow-xs"
                    : "text-[#5E655A] hover:text-[#242821]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-[13px]">
            <Link
              href="/settings"
              className="font-semibold text-[#526B42] hover:underline"
            >
              Ubah Batas Daya
            </Link>
            {alerts.some((a) => a.resolved) && (
              <button
                type="button"
                onClick={clearResolvedAlerts}
                className="font-medium text-[#5E655A] hover:text-[#242821]"
              >
                Bersihkan Selesai
              </button>
            )}
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="rounded-2xl bg-[#F7F5EF]/70 px-5 py-10 text-center">
            <p className="text-[15px] font-semibold text-[#242821]">
              Tidak ada peringatan pada filter ini.
            </p>
            <p className="mt-1 text-[13px] text-[#5E655A]">
              Kondisi daya saat ini normal di bawah batas. Klik{" "}
              <strong>Simulasikan Lonjakan Daya</strong> di atas untuk menguji
              peringatan batas daya secara langsung.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredAlerts.map((item) => (
              <li
                key={item.id}
                className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${
                  item.resolved
                    ? "border-[#35462F]/10 bg-[#F7F5EF]/60 opacity-75"
                    : item.severity === "critical"
                      ? "border-[#E8412C]/40 bg-[#F9E3DE]/90"
                      : "border-[#D7B36A]/55 bg-[#F5EBD2]/90"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      item.severity === "critical"
                        ? "bg-[#E8412C]/15 text-[#B83220]"
                        : "bg-[#D7B36A]/25 text-[#78591C]"
                    }`}
                  >
                    <AlertIcon size={18} />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-semibold text-[#242821]">
                        {item.title}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          item.resolved
                            ? "bg-[#E3E9DA] text-[#35462F]"
                            : item.severity === "critical"
                              ? "bg-[#E8412C] text-white"
                              : "bg-[#D7B36A] text-[#242821]"
                        }`}
                      >
                        {item.resolved
                          ? "Selesai"
                          : item.severity === "critical"
                            ? "Kritis"
                            : "Peringatan"}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-[#35462F]">
                      {item.description}
                    </p>
                    <p className="tabular-nums mt-1 text-[12px] text-[#5E655A]">
                      {formatDateTimeWIB(item.occurredAt)} · Terukur{" "}
                      {formatWatts(item.measuredW)} (Batas{" "}
                      {formatWatts(item.thresholdW)})
                    </p>
                  </div>
                </div>

                {!item.resolved && (
                  <button
                    type="button"
                    onClick={() => resolveAlert(item.id)}
                    className="min-h-[40px] shrink-0 self-start rounded-full bg-[#F7F5EF] px-4 text-[13px] font-semibold text-[#242821] shadow-xs transition-colors hover:bg-white sm:self-center"
                  >
                    Tandai Selesai
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
