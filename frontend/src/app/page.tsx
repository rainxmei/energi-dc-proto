"use client";

import React from "react";
import Link from "next/link";
import { useGridWatch } from "@/context/GridWatchContext";
import {
  formatDatePillID,
  formatKwh,
  formatRupiah,
  formatTimeWIB,
  formatWatts,
} from "@/lib/format";
import {
  AlertIcon,
  ArrowRightIcon,
  BellIcon,
  BoltIcon,
  CalendarIcon,
  ChannelTypeIcon,
  ClockIcon,
  DownloadIcon,
  LayersIcon,
  LeafOutlineIcon,
  PlugIcon,
} from "@/components/Icons";
import { ToggleSwitch } from "@/components/ToggleSwitch";
import { PowerChart } from "@/components/PowerChart";
import { DistributionDonut } from "@/components/DistributionDonut";
import { EnergyTrendMini } from "@/components/EnergyTrendMini";

export default function DashboardPage() {
  const {
    isLoading,
    isSimulation,
    connectionState,
    lastSyncedAt,
    channels,
    totalPowerW,
    activeChannelsCount,
    todayEnergyKwh,
    yesterdayEnergyKwh,
    estimatedCostRp,
    timeRange,
    setTimeRange,
    chartSeries,
    activities,
    unreadAlertsCount,
    settings,
    toggleChannel,
    toggleAllChannels,
    canInstallPwa,
    promptInstallPwa,
    notificationPermission,
    enableNotifications,
  } = useGridWatch();

  const allOn = activeChannelsCount === channels.length;
  const isOverTotalThreshold =
    totalPowerW !== null &&
    settings.totalThresholdW > 0 &&
    totalPowerW > settings.totalThresholdW;
  const controlLocked = !isSimulation && connectionState !== "online";

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Editorial Dashboard Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#35462F] uppercase">
            DASHBOARD
          </p>
          <h1 className="font-serif-display mt-0.5 text-[30px] leading-tight text-[#242821] sm:text-[40px]">
            Halo, <em className="italic">Rumah Modern</em>
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-[#35462F]">
            <span>Pantau penggunaan energi rumah Anda secara real-time.</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F7F5EF]/75 px-2.5 py-0.5 text-[12px] font-medium text-[#35462F]">
              <span
                className={`h-2 w-2 rounded-full ${
                  connectionState === "online"
                    ? "bg-[#526B42]"
                    : isSimulation
                      ? "bg-[#7FA8B8]"
                      : "bg-[#D7B36A]"
                }`}
              />
              {isSimulation
                ? "Mode Simulasi"
                : connectionState === "online"
                  ? `Online · ${formatTimeWIB(lastSyncedAt)} WIB`
                  : "Offline"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/history"
            className="gw-pill-glass inline-flex min-h-[44px] items-center gap-2 px-4 text-[13px] font-medium text-[#242821] transition-colors hover:bg-[#F7F5EF]"
          >
            <CalendarIcon size={16} className="text-[#526B42]" />
            <span>{formatDatePillID()}</span>
          </Link>

          {canInstallPwa && (
            <button
              type="button"
              onClick={() => void promptInstallPwa()}
              className="hidden min-h-[44px] items-center gap-2 rounded-full bg-[#526B42] px-4 text-[13px] font-semibold text-[#F7F5EF] shadow-xs transition-opacity hover:opacity-95 lg:inline-flex"
            >
              <DownloadIcon size={16} />
              <span>Install PWA</span>
            </button>
          )}

          <Link
            href="/alerts"
            aria-label="Buka peringatan dan notifikasi"
            className="gw-pill-glass relative hidden h-[44px] w-[44px] items-center justify-center text-[#242821] transition-colors hover:bg-[#F7F5EF] lg:inline-flex"
          >
            <BellIcon size={19} />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[#E8412C]" />
            )}
          </Link>

          <Link
            href="/settings"
            className="gw-pill-glass inline-flex min-h-[44px] items-center gap-2 px-3.5 text-[13px] font-medium text-[#242821] transition-colors hover:bg-[#F7F5EF]"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#526B42] text-[12px] font-bold text-[#F7F5EF]">
              RM
            </span>
            <span className="hidden sm:inline">
              Batas {formatWatts(settings.totalThresholdW)}
            </span>
          </Link>
        </div>
      </div>

      {/* Subtle Notification Prompt when permission not yet granted */}
      {notificationPermission === "default" && (
        <div className="gw-glass-readable flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[13px]">
          <div className="flex items-center gap-2.5 text-[#242821]">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5EBD2] text-[#78591C]">
              <BellIcon size={16} />
            </span>
            <p>
              Aktifkan notifikasi browser agar GridWatch langsung memberi tahu
              saat daya melewati{" "}
              <strong className="font-semibold">
                {formatWatts(settings.totalThresholdW)}
              </strong>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={() => void enableNotifications()}
            className="min-h-[38px] rounded-full bg-[#526B42] px-4 text-[13px] font-semibold text-[#F7F5EF] transition-opacity hover:opacity-95"
          >
            Aktifkan Notifikasi
          </button>
        </div>
      )}

      {/* Threshold Exceeded Live Alert Banner */}
      {isOverTotalThreshold && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[#E8412C]/45 bg-[#F9E3DE]/95 px-4 py-3 text-[#6E1F14] shadow-xs"
        >
          <div className="flex items-center gap-2.5 text-[14px]">
            <AlertIcon size={19} className="shrink-0 text-[#E8412C]" />
            <span>
              <strong>Peringatan Batas Daya:</strong> Total daya saat ini{" "}
              <strong className="tabular-nums">
                {formatWatts(totalPowerW)}
              </strong>{" "}
              melebihi batas {formatWatts(settings.totalThresholdW)}.
            </span>
          </div>
          <Link
            href="/alerts"
            className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-[#E8412C] px-3.5 text-[12px] font-semibold text-white"
          >
            Detail Peringatan
            <ArrowRightIcon size={14} />
          </Link>
        </div>
      )}

      {/* Row 1: Four KPI Cards (4-col desktop, 2x2 mobile) */}
      <section
        aria-label="Ringkasan metrik utama"
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      >
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="gw-glass-kpi h-[128px] animate-pulse p-4 sm:p-5"
            />
          ))
        ) : (
          <>
            {/* KPI 1: Total Daya */}
            <article className="gw-glass-kpi flex min-h-[124px] flex-col justify-between p-4 sm:min-h-[138px] sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      isOverTotalThreshold
                        ? "bg-[#F9E3DE] text-[#B83220]"
                        : "bg-[#E3E9DA] text-[#526B42]"
                    }`}
                  >
                    <BoltIcon size={22} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#5E655A]">
                      Total Daya
                    </p>
                    <p
                      className={`tabular-nums mt-0.5 text-[24px] font-bold leading-tight sm:text-[32px] ${
                        isOverTotalThreshold
                          ? "text-[#B83220]"
                          : "text-[#242821]"
                      }`}
                    >
                      {formatWatts(totalPowerW)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-end">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:text-[12px] ${
                    isOverTotalThreshold
                      ? "bg-[#F9E3DE] text-[#8E2618]"
                      : "bg-[#E3E9DA] text-[#35462F]"
                  }`}
                >
                  {isOverTotalThreshold
                    ? `Di atas ${formatWatts(settings.totalThresholdW)}`
                    : `Batas ${formatWatts(settings.totalThresholdW)}`}
                </span>
              </div>
            </article>

            {/* KPI 2: Energi Hari Ini */}
            <article className="gw-glass-kpi flex min-h-[124px] flex-col justify-between p-4 sm:min-h-[138px] sm:p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E2EDF1] text-[#3C687A]">
                  <LayersIcon size={22} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#5E655A]">
                    Energi Hari Ini
                  </p>
                  <p className="tabular-nums mt-0.5 text-[22px] font-bold leading-tight text-[#242821] sm:text-[30px]">
                    {formatKwh(todayEnergyKwh)}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-end">
                <span className="rounded-full bg-[#E2EDF1] px-2.5 py-0.5 text-[11px] font-semibold text-[#2F5362] sm:text-[12px]">
                  Akumulasi WIB
                </span>
              </div>
            </article>

            {/* KPI 3: Estimasi Biaya */}
            <article className="gw-glass-kpi flex min-h-[124px] flex-col justify-between p-4 sm:min-h-[138px] sm:p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F5EBD2] text-[#826120]">
                  <LeafOutlineIcon size={22} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#5E655A]">
                    Estimasi Biaya
                  </p>
                  <p className="tabular-nums mt-0.5 text-[22px] font-bold leading-tight text-[#242821] sm:text-[30px]">
                    {formatRupiah(estimatedCostRp)}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-end">
                <span className="rounded-full bg-[#F5EBD2] px-2.5 py-0.5 text-[11px] font-semibold text-[#6F531D] sm:text-[12px]">
                  Simulasi tarif
                </span>
              </div>
            </article>

            {/* KPI 4: Kanal Aktif */}
            <article className="gw-glass-kpi flex min-h-[124px] flex-col justify-between p-4 sm:min-h-[138px] sm:p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E3E9DA] text-[#526B42]">
                  <PlugIcon size={22} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#5E655A]">
                    Kanal Aktif
                  </p>
                  <p className="tabular-nums mt-0.5 text-[24px] font-bold leading-tight text-[#242821] sm:text-[32px]">
                    {activeChannelsCount} / {channels.length}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-end">
                <span className="rounded-full bg-[#E3E9DA] px-2.5 py-0.5 text-[11px] font-semibold text-[#35462F] sm:text-[12px]">
                  Relay terkonfirmasi
                </span>
              </div>
            </article>
          </>
        )}
      </section>

      {/* Row 2: Main Chart (Left) + Channel Controls (Right) */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-7">
          <PowerChart
            data={chartSeries}
            timeRange={timeRange}
            onRangeChange={setTimeRange}
            thresholdW={settings.totalThresholdW}
          />
        </div>

        <section
          aria-label="Kontrol Kanal"
          className="gw-glass-kpi flex flex-col justify-between p-5 sm:p-6 xl:col-span-5"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#F7F5EF]/70 text-[#35462F]">
                <LayersIcon size={18} />
              </span>
              <h2 className="font-serif-display text-[21px] text-[#242821] sm:text-[24px]">
                Kontrol Kanal
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-[#35462F]">
                Kelola Semua
              </span>
              <ToggleSwitch
                checked={allOn}
                disabled={controlLocked}
                label={allOn ? "Matikan semua kanal" : "Nyalakan semua kanal"}
                onChange={() => void toggleAllChannels(!allOn)}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {channels.map((ch) => {
              const overChLimit =
                ch.powerW !== null &&
                ch.thresholdW > 0 &&
                ch.powerW > ch.thresholdW;
              return (
                <div
                  key={ch.id}
                  className="gw-inner-row flex min-h-[56px] items-center justify-between gap-3 px-3.5 py-2"
                >
                  <Link
                    href={`/devices/${ch.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-1 transition-opacity hover:opacity-80"
                  >
                    <span
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        overChLimit
                          ? "bg-[#F9E3DE] text-[#B83220]"
                          : ch.relayOn
                            ? "bg-[#E3E9DA] text-[#526B42]"
                            : "bg-[#EAE6DC] text-[#7A756A]"
                      }`}
                    >
                      <ChannelTypeIcon kind={ch.icon} size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-[#242821]">
                        Kanal {ch.id} - {ch.name}
                      </p>
                      <p className="truncate text-[12px] text-[#5E655A]">
                        {ch.commandMessage
                          ? ch.commandMessage
                          : ch.relayOn
                            ? overChLimit
                              ? `Melewati batas ${formatWatts(ch.thresholdW)}`
                              : "Aktif"
                            : "Nonaktif"}
                      </p>
                    </div>
                  </Link>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <span
                      className={`tabular-nums text-[14px] font-semibold ${
                        overChLimit
                          ? "text-[#B83220]"
                          : ch.relayOn
                            ? "text-[#242821]"
                            : "text-[#5E655A]"
                      }`}
                    >
                      {formatWatts(ch.powerW)}
                    </span>
                    <ToggleSwitch
                      checked={ch.relayOn}
                      pending={ch.commandState === "pending"}
                      disabled={controlLocked}
                      label={`Ubah status Kanal ${ch.id} ${ch.name}`}
                      onChange={() => void toggleChannel(ch.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Row 3: Distribution, Energy Trend, Recent Activity */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        <DistributionDonut channels={channels} totalPowerW={totalPowerW} />

        <EnergyTrendMini
          todayKwh={todayEnergyKwh}
          yesterdayKwh={yesterdayEnergyKwh}
        />

        <section
          aria-label="Aktivitas Terakhir"
          className="gw-glass-readable flex flex-col justify-between p-5"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ClockIcon size={18} className="text-[#526B42]" />
              <h2 className="font-serif-display text-[20px] text-[#242821]">
                Aktivitas Terakhir
              </h2>
            </div>
            <Link
              href="/history"
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#526B42] hover:underline"
            >
              Lihat Semua
              <ArrowRightIcon size={14} />
            </Link>
          </div>

          {activities.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-[#5E655A]">
              Belum ada aktivitas tercatat hari ini.
            </p>
          ) : (
            <ul className="divide-y divide-[#35462F]/10">
              {activities.slice(0, 3).map((act) => (
                <li
                  key={act.id}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-0"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
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
                    <span className="truncate text-[13px] font-medium text-[#242821]">
                      {act.message}
                    </span>
                  </span>
                  <span className="tabular-nums shrink-0 text-[12px] text-[#5E655A]">
                    {formatTimeWIB(act.occurredAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
