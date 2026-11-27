"use client";

import React from "react";
import Link from "next/link";
import { useGridWatch } from "@/context/GridWatchContext";
import {
  formatCurrent,
  formatDateTimeWIB,
  formatUptime,
  formatVoltage,
  formatWatts,
} from "@/lib/format";
import {
  ArrowRightIcon,
  ChannelTypeIcon,
  WifiIcon,
  WifiOffIcon,
} from "@/components/Icons";
import { ToggleSwitch } from "@/components/ToggleSwitch";

export default function DevicesPage() {
  const {
    channels,
    deviceStatus,
    connectionState,
    isSimulation,
    lastSyncedAt,
    toggleChannel,
    toggleAllChannels,
    activeChannelsCount,
  } = useGridWatch();

  const controlLocked = !isSimulation && connectionState !== "online";
  const allOn = activeChannelsCount === channels.length;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#35462F] uppercase">
            PERANGKAT & KANAL
          </p>
          <h1 className="font-serif-display mt-0.5 text-[28px] leading-tight text-[#242821] sm:text-[36px]">
            Status 4 Kanal & Sensor
          </h1>
          <p className="mt-1 text-[14px] text-[#35462F]">
            Pantau tegangan, arus, daya sesaat, dan kontrol relay tiap kanal.
          </p>
        </div>

        <div className="gw-pill-glass inline-flex items-center gap-3 self-start px-4 py-1.5 sm:self-auto">
          <span className="text-[13px] font-semibold text-[#35462F]">
            Semua Kanal ({activeChannelsCount}/4)
          </span>
          <ToggleSwitch
            checked={allOn}
            disabled={controlLocked}
            label={allOn ? "Matikan semua kanal" : "Nyalakan semua kanal"}
            onChange={() => void toggleAllChannels(!allOn)}
          />
        </div>
      </div>

      {/* ESP32 Hardware Summary Bar */}
      <section
        aria-label="Status node ESP32"
        className="gw-glass-readable flex flex-wrap items-center justify-between gap-4 p-4 sm:px-5"
      >
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
              deviceStatus.online
                ? "bg-[#E3E9DA] text-[#526B42]"
                : "bg-[#F9E3DE] text-[#B83220]"
            }`}
          >
            {deviceStatus.online ? <WifiIcon size={20} /> : <WifiOffIcon size={20} />}
          </span>
          <div>
            <p className="text-[14px] font-semibold text-[#242821]">
              Node ESP32 Utama (4x INA219 + 4 Relay)
            </p>
            <p className="text-[12px] text-[#5E655A]">
              {isSimulation
                ? "Data simulasi aktif untuk demonstrasi"
                : deviceStatus.online
                  ? `Terhubung · Pembaruan terakhir ${formatDateTimeWIB(lastSyncedAt)}`
                  : `Offline · Terakhir terlihat ${formatDateTimeWIB(deviceStatus.lastSeen)}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-[12px]">
          <div className="rounded-xl bg-[#F7F5EF] px-3 py-1.5">
            <span className="text-[#5E655A]">Sinyal Wi-Fi: </span>
            <strong className="tabular-nums text-[#242821]">
              {deviceStatus.rssi !== null ? `${deviceStatus.rssi} dBm` : "--"}
            </strong>
          </div>
          <div className="rounded-xl bg-[#F7F5EF] px-3 py-1.5">
            <span className="text-[#5E655A]">Uptime: </span>
            <strong className="tabular-nums text-[#242821]">
              {formatUptime(deviceStatus.uptimeS)}
            </strong>
          </div>
        </div>
      </section>

      {/* 4 Channel Detailed Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {channels.map((ch) => {
          const pctLimit =
            ch.powerW !== null && ch.thresholdW > 0
              ? Math.min(100, Math.round((ch.powerW / ch.thresholdW) * 100))
              : 0;
          const overLimit =
            ch.powerW !== null && ch.thresholdW > 0 && ch.powerW > ch.thresholdW;

          return (
            <article
              key={ch.id}
              className="gw-glass-readable flex flex-col justify-between p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      overLimit
                        ? "bg-[#F9E3DE] text-[#B83220]"
                        : ch.relayOn
                          ? "bg-[#E3E9DA] text-[#526B42]"
                          : "bg-[#EAE6DC] text-[#7A756A]"
                    }`}
                  >
                    <ChannelTypeIcon kind={ch.icon} size={20} />
                  </span>
                  <div>
                    <p className="text-[12px] font-semibold tracking-wide text-[#5E655A] uppercase">
                      Kanal {ch.id}
                    </p>
                    <h2 className="font-serif-display text-[22px] leading-tight text-[#242821]">
                      {ch.name}
                    </h2>
                  </div>
                </div>

                <ToggleSwitch
                  checked={ch.relayOn}
                  pending={ch.commandState === "pending"}
                  disabled={controlLocked}
                  label={`Kontrol Kanal ${ch.id} ${ch.name}`}
                  onChange={() => void toggleChannel(ch.id)}
                />
              </div>

              {/* Telemetry Grid: V, A, W */}
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                <div className="rounded-2xl bg-[#F7F5EF]/85 p-3">
                  <p className="text-[11px] font-medium text-[#5E655A]">Daya</p>
                  <p
                    className={`tabular-nums mt-0.5 text-[18px] font-bold ${
                      overLimit ? "text-[#B83220]" : "text-[#242821]"
                    }`}
                  >
                    {formatWatts(ch.powerW)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F7F5EF]/85 p-3">
                  <p className="text-[11px] font-medium text-[#5E655A]">
                    Tegangan
                  </p>
                  <p className="tabular-nums mt-0.5 text-[18px] font-bold text-[#242821]">
                    {formatVoltage(ch.voltageV)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F7F5EF]/85 p-3">
                  <p className="text-[11px] font-medium text-[#5E655A]">Arus</p>
                  <p className="tabular-nums mt-0.5 text-[18px] font-bold text-[#242821]">
                    {formatCurrent(ch.currentA)}
                  </p>
                </div>
              </div>

              {/* Threshold Usage Bar */}
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[12px]">
                  <span className="text-[#5E655A]">
                    Batas daya kanal: {formatWatts(ch.thresholdW)}
                  </span>
                  <span
                    className={`tabular-nums font-semibold ${
                      overLimit ? "text-[#B83220]" : "text-[#35462F]"
                    }`}
                  >
                    {overLimit ? "Melebihi batas" : `${pctLimit}%`}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#35462F]/12">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      overLimit
                        ? "bg-[#E8412C]"
                        : pctLimit > 80
                          ? "bg-[#D7B36A]"
                          : "bg-[#5E7A4B]"
                    }`}
                    style={{ width: `${pctLimit}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#35462F]/10 pt-3 text-[13px]">
                <span className="text-[#5E655A]">
                  Status:{" "}
                  <strong className="text-[#242821]">
                    {ch.commandMessage || (ch.relayOn ? "ON" : "OFF")}
                  </strong>
                </span>
                <Link
                  href={`/devices/${ch.id}`}
                  className="inline-flex min-h-[36px] items-center gap-1 font-semibold text-[#526B42] hover:underline"
                >
                  Detail Kanal
                  <ArrowRightIcon size={15} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
