"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGridWatch } from "@/context/GridWatchContext";
import type { ChannelId, PowerPoint } from "@/types/gridwatch";
import {
  formatCurrent,
  formatDateTimeWIB,
  formatTimeWIB,
  formatVoltage,
  formatWatts,
} from "@/lib/format";
import { ChannelTypeIcon } from "@/components/Icons";
import { ToggleSwitch } from "@/components/ToggleSwitch";
import { PowerChart } from "@/components/PowerChart";

export default function ChannelDetailPage() {
  const params = useParams();
  const rawId = Number(params?.channel);
  const validId = (
    rawId >= 1 && rawId <= 4 ? rawId : 1
  ) as ChannelId;

  const {
    channels,
    chartSeries,
    timeRange,
    setTimeRange,
    activities,
    connectionState,
    isSimulation,
    toggleChannel,
    settings,
    updateSettings,
  } = useGridWatch();

  const channel = channels.find((c) => c.id === validId) || channels[0];
  const [thresholdDraft, setThresholdDraft] = useState<string>(
    String(settings.channelThresholds[validId])
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const channelSeries: PowerPoint[] = useMemo(() => {
    const key = `ch${validId}W` as "ch1W" | "ch2W" | "ch3W" | "ch4W";
    return chartSeries.map((pt) => ({
      ...pt,
      totalW: pt[key],
    }));
  }, [chartSeries, validId]);

  const channelActivities = useMemo(
    () =>
      activities.filter(
        (act) => act.channelId === validId || act.channelId === null
      ),
    [activities, validId]
  );

  const controlLocked = !isSimulation && connectionState !== "online";

  const handleSaveThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(thresholdDraft);
    if (Number.isNaN(numeric) || numeric <= 0) return;
    updateSettings({
      channelThresholds: {
        ...settings.channelThresholds,
        [validId]: numeric,
      },
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/devices"
            className="inline-flex min-h-[36px] items-center text-[13px] font-semibold text-[#526B42] hover:underline"
          >
            Kembali ke Perangkat
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E3E9DA] text-[#526B42]">
              <ChannelTypeIcon kind={channel.icon} size={22} />
            </span>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-gw-text-header-muted uppercase">
                KANAL {channel.id}
              </p>
              <h1 className="font-serif-display text-[28px] leading-tight text-gw-text-header sm:text-[34px]">
                {channel.name}
              </h1>
            </div>
          </div>
        </div>

        <div className="gw-pill-glass inline-flex items-center gap-3 px-4 py-1.5">
          <span className="text-[13px] font-semibold text-[#242821]">
            {channel.commandMessage || (channel.relayOn ? "Relay ON" : "Relay OFF")}
          </span>
          <ToggleSwitch
            checked={channel.relayOn}
            pending={channel.commandState === "pending"}
            disabled={controlLocked}
            label={`Ubah status Kanal ${channel.id}`}
            onChange={() => void toggleChannel(channel.id)}
          />
        </div>
      </div>

      {/* Live Telemetry Metrics */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="gw-glass-readable p-5">
          <p className="text-[13px] font-medium text-[#5E655A]">Daya Sesaat</p>
          <p className="tabular-nums mt-1 text-[30px] font-bold text-[#242821]">
            {formatWatts(channel.powerW)}
          </p>
          <p className="mt-1 text-[12px] text-[#5E655A]">
            Diperbarui {formatDateTimeWIB(channel.lastUpdatedAt)}
          </p>
        </div>
        <div className="gw-glass-readable p-5">
          <p className="text-[13px] font-medium text-[#5E655A]">Tegangan</p>
          <p className="tabular-nums mt-1 text-[30px] font-bold text-[#242821]">
            {formatVoltage(channel.voltageV)}
          </p>
          <p className="mt-1 text-[12px] text-[#5E655A]">Sensor INA219 / kanal</p>
        </div>
        <div className="gw-glass-readable p-5">
          <p className="text-[13px] font-medium text-[#5E655A]">Arus</p>
          <p className="tabular-nums mt-1 text-[30px] font-bold text-[#242821]">
            {formatCurrent(channel.currentA)}
          </p>
          <p className="mt-1 text-[12px] text-[#5E655A]">
            Batas aktif {formatWatts(channel.thresholdW)}
          </p>
        </div>
      </section>

      <PowerChart
        data={channelSeries}
        timeRange={timeRange}
        onRangeChange={setTimeRange}
        thresholdW={channel.thresholdW}
        title={`Riwayat Daya Kanal ${channel.id} (W)`}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Quick Per-Channel Threshold Editor */}
        <section className="gw-glass-readable p-5">
          <h2 className="font-serif-display text-[21px] text-[#242821]">
            Batas Peringatan Kanal {channel.id}
          </h2>
          <p className="mt-1 text-[13px] text-[#5E655A]">
            Notifikasi akan muncul otomatis saat daya {channel.name} melewati
            nilai ini. Mendukung nilai desimal untuk sensor 12V DC.
          </p>
          <form
            onSubmit={handleSaveThreshold}
            className="mt-4 flex flex-wrap items-end gap-3"
          >
            <div className="min-w-[160px] flex-1">
              <label
                htmlFor="ch-threshold"
                className="block text-[12px] font-semibold text-[#35462F]"
              >
                Batas Daya (Watt)
              </label>
              <input
                id="ch-threshold"
                type="number"
                min="0.1"
                step="0.1"
                value={thresholdDraft}
                onChange={(e) => setThresholdDraft(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#35462F]/20 bg-[#F7F5EF] px-3.5 py-2.5 text-[14px] text-[#242821]"
              />
            </div>
            <button
              type="submit"
              className="min-h-[44px] rounded-full bg-[#526B42] px-5 text-[14px] font-semibold text-[#F7F5EF] transition-opacity hover:opacity-95"
            >
              Simpan Batas
            </button>
          </form>
          {savedNotice && (
            <p className="mt-2.5 text-[13px] font-medium text-[#526B42]">
              Batas daya Kanal {channel.id} diperbarui ke{" "}
              {formatWatts(Number(thresholdDraft))}.
            </p>
          )}
        </section>

        {/* Channel Activity */}
        <section className="gw-glass-readable p-5">
          <h2 className="font-serif-display text-[21px] text-[#242821]">
            Aktivitas Terkait
          </h2>
          {channelActivities.length === 0 ? (
            <p className="mt-4 text-[13px] text-[#5E655A]">
              Belum ada aktivitas terbaru pada kanal ini.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[#35462F]/10">
              {channelActivities.slice(0, 5).map((act) => (
                <li
                  key={act.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-[13px]"
                >
                  <span className="text-[#242821]">{act.message}</span>
                  <span className="tabular-nums shrink-0 text-[12px] text-[#5E655A]">
                    {formatTimeWIB(act.occurredAt)} WIB
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
