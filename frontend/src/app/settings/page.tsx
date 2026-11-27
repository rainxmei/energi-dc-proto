"use client";

import React, { useEffect, useState } from "react";
import { useGridWatch } from "@/context/GridWatchContext";
import type { ChannelId, GridWatchSettings } from "@/types/gridwatch";
import { formatWatts } from "@/lib/format";
import { BellIcon, DownloadIcon } from "@/components/Icons";
import { ToggleSwitch } from "@/components/ToggleSwitch";

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    resetSettings,
    connectionState,
    refreshNow,
    notificationPermission,
    enableNotifications,
    sendTestNotification,
    canInstallPwa,
    isPwaInstalled,
    promptInstallPwa,
  } = useGridWatch();

  const [form, setForm] = useState<GridWatchSettings>(settings);
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#35462F] uppercase">
          PENGATURAN
        </p>
        <h1 className="font-serif-display mt-0.5 text-[28px] leading-tight text-[#242821] sm:text-[36px]">
          Batas Daya, Notifikasi & PWA
        </h1>
        <p className="mt-1 text-[14px] text-[#35462F]">
          Sesuaikan ambang peringatan daya, nama kanal, tarif estimasi, dan
          sumber data backend.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Power Threshold & Notification Settings */}
        <section className="gw-glass-readable p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif-display text-[22px] text-[#242821]">
                Batas Daya & Notifikasi
              </h2>
              <p className="text-[13px] text-[#5E655A]">
                Atur batas total maupun per kanal (mendukung desimal 0,1 W untuk
                miniatur 12V DC).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-[#242821]">
                Notifikasi Otomatis
              </span>
              <ToggleSwitch
                checked={form.notificationsEnabled}
                label="Aktifkan notifikasi otomatis saat batas daya terlampaui"
                onChange={() =>
                  setForm((prev) => ({
                    ...prev,
                    notificationsEnabled: !prev.notificationsEnabled,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="total-threshold"
                className="block text-[13px] font-semibold text-[#35462F]"
              >
                Batas Total Daya (W)
              </label>
              <input
                id="total-threshold"
                type="number"
                min="0.1"
                step="0.1"
                value={form.totalThresholdW}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    totalThresholdW: Math.max(0.1, Number(e.target.value) || 0),
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-[#35462F]/20 bg-[#F7F5EF] px-3.5 py-2.5 text-[14px] text-[#242821]"
              />
              <p className="mt-1 text-[12px] text-[#5E655A]">
                Contoh: 600 W untuk demo rumah, atau 15 W untuk miniatur 12V DC.
              </p>
            </div>

            <div>
              <label
                htmlFor="cooldown-sec"
                className="block text-[13px] font-semibold text-[#35462F]"
              >
                Jeda Anti-Spam Notifikasi (detik)
              </label>
              <input
                id="cooldown-sec"
                type="number"
                min="5"
                max="3600"
                step="5"
                value={form.cooldownSeconds}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    cooldownSeconds: Math.max(5, Number(e.target.value) || 30),
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-[#35462F]/20 bg-[#F7F5EF] px-3.5 py-2.5 text-[14px] text-[#242821]"
              />
              <p className="mt-1 text-[12px] text-[#5E655A]">
                Mencegah notifikasi berulang terus-menerus saat daya berfluktuasi.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-2xl bg-[#F7F5EF]/80 p-3.5">
            <BellIcon size={18} className="text-[#526B42]" />
            <span className="flex-1 text-[13px] text-[#242821]">
              Status izin browser:{" "}
              <strong>
                {notificationPermission === "granted"
                  ? "Diizinkan"
                  : notificationPermission === "denied"
                    ? "Diblokir (ubah di izin situs browser)"
                    : notificationPermission === "unsupported"
                      ? "Tidak didukung"
                      : "Belum diminta"}
              </strong>
            </span>
            {notificationPermission !== "granted" &&
              notificationPermission !== "unsupported" && (
                <button
                  type="button"
                  onClick={() => void enableNotifications()}
                  className="min-h-[38px] rounded-full bg-[#526B42] px-4 text-[13px] font-semibold text-[#F7F5EF]"
                >
                  Izinkan Notifikasi
                </button>
              )}
            <button
              type="button"
              onClick={() => void sendTestNotification()}
              className="min-h-[38px] rounded-full border border-[#35462F]/25 bg-white px-4 text-[13px] font-semibold text-[#242821]"
            >
              Tes Notifikasi
            </button>
          </div>
        </section>

        {/* Channel Names & Per-Channel Thresholds */}
        <section className="gw-glass-readable p-5 sm:p-6">
          <h2 className="font-serif-display text-[22px] text-[#242821]">
            Label & Batas per Kanal
          </h2>
          <p className="mt-1 text-[13px] text-[#5E655A]">
            Ubah nama ruangan/beban dan batas daya masing-masing dari 4 kanal.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {([1, 2, 3, 4] as ChannelId[]).map((id) => (
              <div
                key={id}
                className="rounded-2xl border border-[#35462F]/12 bg-[#F7F5EF]/80 p-4"
              >
                <p className="text-[12px] font-semibold text-[#526B42] uppercase">
                  Kanal {id}
                </p>
                <div className="mt-2 space-y-2.5">
                  <div>
                    <label
                      htmlFor={`ch-name-${id}`}
                      className="block text-[12px] font-medium text-[#5E655A]"
                    >
                      Nama Tampilan
                    </label>
                    <input
                      id={`ch-name-${id}`}
                      type="text"
                      value={form.channelNames[id]}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          channelNames: {
                            ...prev.channelNames,
                            [id]: e.target.value,
                          },
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-[#35462F]/20 bg-white px-3 py-2 text-[14px] text-[#242821]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`ch-limit-${id}`}
                      className="block text-[12px] font-medium text-[#5E655A]"
                    >
                      Batas Daya (W)
                    </label>
                    <input
                      id={`ch-limit-${id}`}
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={form.channelThresholds[id]}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          channelThresholds: {
                            ...prev.channelThresholds,
                            [id]: Math.max(0.1, Number(e.target.value) || 0),
                          },
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-[#35462F]/20 bg-white px-3 py-2 text-[14px] text-[#242821]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Data Source & Tariff */}
        <section className="gw-glass-readable p-5 sm:p-6">
          <h2 className="font-serif-display text-[22px] text-[#242821]">
            Sumber Data Backend & Tarif Estimasi
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="data-source"
                className="block text-[13px] font-semibold text-[#35462F]"
              >
                Mode Sumber Data
              </label>
              <select
                id="data-source"
                value={form.dataSource}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    dataSource: e.target.value as GridWatchSettings["dataSource"],
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-[#35462F]/20 bg-[#F7F5EF] px-3.5 py-2.5 text-[14px] text-[#242821]"
              >
                <option value="auto">
                  Otomatis (Live API jika tersedia, fallback Simulasi)
                </option>
                <option value="simulation">Selalu Mode Simulasi (Demo)</option>
                <option value="live">Selalu Live API Backend</option>
              </select>
              <p className="mt-1 text-[12px] text-[#5E655A]">
                Status saat ini: <strong>{connectionState}</strong>
              </p>
            </div>

            <div>
              <label
                htmlFor="api-base-url"
                className="block text-[13px] font-semibold text-[#35462F]"
              >
                URL Backend API (Vercel)
              </label>
              <input
                id="api-base-url"
                type="url"
                placeholder="https://energi-dc-proto.vercel.app"
                value={form.apiBaseUrl}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, apiBaseUrl: e.target.value }))
                }
                className="mt-1.5 w-full rounded-xl border border-[#35462F]/20 bg-[#F7F5EF] px-3.5 py-2.5 text-[14px] text-[#242821]"
              />
              <p className="mt-1 text-[12px] text-[#5E655A]">
                Kosongkan untuk demo penuh memakai Mode Simulasi.
              </p>
            </div>

            <div>
              <label
                htmlFor="tariff-kwh"
                className="block text-[13px] font-semibold text-[#35462F]"
              >
                Tarif Simulasi (Rp per kWh)
              </label>
              <input
                id="tariff-kwh"
                type="number"
                min="0"
                step="50"
                value={form.tariffPerKwh}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    tariffPerKwh: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-[#35462F]/20 bg-[#F7F5EF] px-3.5 py-2.5 text-[14px] text-[#242821]"
              />
              <p className="mt-1 text-[12px] text-[#5E655A]">
                Hanya angka estimasi simulasi, bukan tagihan PLN resmi.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#35462F]/10 pt-4">
            <div className="flex flex-wrap gap-2.5">
              <button
                type="submit"
                className="min-h-[44px] rounded-full bg-[#526B42] px-6 text-[14px] font-semibold text-[#F7F5EF] transition-opacity hover:opacity-95"
              >
                Simpan Pengaturan
              </button>
              <button
                type="button"
                onClick={() => void refreshNow()}
                className="min-h-[44px] rounded-full border border-[#35462F]/25 bg-[#F7F5EF] px-4 text-[13px] font-semibold text-[#242821]"
              >
                Segarkan Data
              </button>
            </div>

            <button
              type="button"
              onClick={resetSettings}
              className="min-h-[44px] rounded-full px-4 text-[13px] font-semibold text-[#8E2618] hover:bg-[#F9E3DE]"
            >
              Reset Default
            </button>
          </div>

          {savedBanner && (
            <p
              role="status"
              className="mt-3 rounded-xl bg-[#E3E9DA] px-3.5 py-2 text-[13px] font-medium text-[#35462F]"
            >
              Pengaturan berhasil disimpan. Batas total aktif:{" "}
              {formatWatts(form.totalThresholdW)}.
            </p>
          )}
        </section>
      </form>

      {/* PWA Installation Card */}
      <section className="gw-glass-readable flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <h2 className="font-serif-display text-[22px] text-[#242821]">
            Aplikasi Web Progresif (PWA)
          </h2>
          <p className="mt-1 text-[13px] text-[#5E655A]">
            {isPwaInstalled
              ? "GridWatch sudah berjalan dalam mode aplikasi terpasang (standalone)."
              : canInstallPwa
                ? "Browser Anda mendukung instalasi langsung. Klik tombol di kanan untuk memasang ke layar utama."
                : "Buka menu browser Anda lalu pilih 'Install app' atau 'Add to Home Screen' untuk memasang GridWatch."}
          </p>
        </div>

        {canInstallPwa && (
          <button
            type="button"
            onClick={() => void promptInstallPwa()}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-2 self-start rounded-full bg-[#526B42] px-5 text-[14px] font-semibold text-[#F7F5EF] sm:self-auto"
          >
            <DownloadIcon size={17} />
            <span>Install GridWatch</span>
          </button>
        )}
      </section>
    </div>
  );
}
