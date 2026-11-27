"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGridWatchShell } from "@/context/GridWatchContext";
import {
  ArrowRightIcon,
  BellIcon,
  BoltIcon,
  ChartBarIcon,
  CloseIcon,
  DownloadIcon,
  HomeIcon,
  LeafLogoIcon,
  SettingsIcon,
  WifiOffIcon,
} from "./Icons";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: HomeIcon },
  { href: "/devices", label: "Perangkat", icon: BoltIcon },
  { href: "/history", label: "Riwayat", icon: ChartBarIcon },
  { href: "/alerts", label: "Peringatan", icon: BellIcon },
  { href: "/settings", label: "Pengaturan", icon: SettingsIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    unreadAlertsCount,
    connectionState,
    isSimulation,
    isBrowserOffline,
    toasts,
    dismissToast,
    canInstallPwa,
    promptInstallPwa,
  } = useGridWatchShell();

  const isNavActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="relative min-h-[100dvh] w-full">
      {/* Persistent Interior Backdrop (GPU-promoted static layer) */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        style={{ transform: "translateZ(0)" }}
      >
        <img
          src="/images/bg-interior.jpg"
          alt=""
          width={1600}
          height={900}
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover object-[75%_center] md:object-center"
        />
        <div
          className="absolute inset-0 md:hidden"
          style={{
            background:
              "linear-gradient(150deg, rgba(66,82,55,0.28) 0%, rgba(247,245,239,0.16) 55%, rgba(247,245,239,0.24) 100%)",
          }}
        />
        <div
          className="absolute inset-0 hidden md:block"
          style={{
            background:
              "linear-gradient(110deg, rgba(66,82,55,0.34) 0%, rgba(247,245,239,0.14) 55%, rgba(247,245,239,0.22) 100%)",
          }}
        />
      </div>

      {/* Live Toast Notifications Stack */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed top-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2.5"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-3.5 shadow-lg backdrop-blur-xl ${
              toast.tone === "critical"
                ? "border-[#E8412C]/40 bg-[#F9E3DE]/95 text-[#6E1F14]"
                : toast.tone === "warning"
                  ? "border-[#D7B36A]/55 bg-[#F5EBD2]/95 text-[#5D4415]"
                  : "border-white/70 bg-[#F7F5EF]/95 text-[#242821]"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold leading-snug">
                {toast.title}
              </p>
              <p className="mt-0.5 text-[13px] leading-snug opacity-90">
                {toast.body}
              </p>
              {toast.href && (
                <Link
                  href={toast.href}
                  onClick={() => dismissToast(toast.id)}
                  className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold underline underline-offset-2"
                >
                  Lihat peringatan
                  <ArrowRightIcon size={13} />
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Tutup notifikasi"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-black/10"
            >
              <CloseIcon size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col lg:flex-row lg:gap-6 lg:p-6">
        {/* Desktop Sidebar */}
        <aside
          aria-label="Navigasi utama"
          className="gw-sidebar relative z-10 hidden overflow-y-auto lg:sticky lg:top-6 lg:flex lg:h-[calc(100dvh-3rem)] lg:w-[244px] lg:shrink-0 lg:flex-col lg:justify-between lg:rounded-[26px] lg:p-4"
        >
          <div>
            <Link
              href="/"
              className="mb-5 flex items-center gap-2.5 px-2.5 pt-1.5 text-[#F7F5EF] xl:mb-7"
            >
              <LeafLogoIcon size={28} className="text-[#F7F5EF]" />
              <span className="font-serif-display text-[25px] tracking-tight">
                GridWatch
              </span>
            </Link>

            <nav className="space-y-1.5">
              {NAV_ITEMS.map((item) => {
                const active = isNavActive(item.href);
                const Icon = item.icon;
                const showAlertDot =
                  item.href === "/alerts" && unreadAlertsCount > 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[48px] items-center justify-between rounded-[16px] px-4 text-[15px] transition-colors duration-200 ${
                      active
                        ? "bg-[#F7F5EF]/95 font-semibold text-[#35462F] shadow-sm"
                        : "font-medium text-[#F7F5EF]/92 hover:bg-white/14"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon
                        size={19}
                        className={
                          active ? "text-[#526B42]" : "text-[#F7F5EF]/90"
                        }
                      />
                      <span>{item.label}</span>
                    </span>
                    {showAlertDot && (
                      <span
                        aria-label={`${unreadAlertsCount} peringatan aktif`}
                        className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#D7B36A] px-1.5 text-[11px] font-bold text-[#242821]"
                      >
                        {unreadAlertsCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar Action Card */}
          <div className="mt-4 mb-10 rounded-[20px] border border-white/28 bg-[#8A9A78]/40 p-4 text-[#F7F5EF] xl:mb-14">
            <p className="text-[13px] leading-relaxed text-[#F7F5EF]/95">
              {canInstallPwa
                ? "Pasang GridWatch ke layar utama untuk akses cepat seperti aplikasi."
                : "Kontrol energi rumah lebih cerdas dengan GridWatch."}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wide text-[#F7F5EF]/85">
                {isSimulation ? "Mode Simulasi" : "Mode Live API"}
              </span>
              {canInstallPwa ? (
                <button
                  type="button"
                  onClick={() => void promptInstallPwa()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#F7F5EF] px-3 text-[12px] font-semibold text-[#35462F] transition-opacity hover:opacity-90"
                >
                  <DownloadIcon size={14} />
                  <span>Pasang</span>
                </button>
              ) : (
                <Link
                  href="/settings"
                  aria-label="Buka pengaturan batas daya"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F5EF] text-[#35462F] transition-opacity hover:opacity-90"
                >
                  <ArrowRightIcon size={16} />
                </Link>
              )}
            </div>
          </div>
        </aside>

        {/* Foreground Botanical Leaf Overlay (z-index higher than sidebar z-10) */}
        <img
          src="/images/daun-kiri-opt.png"
          alt=""
          width={260}
          height={260}
          decoding="async"
          aria-hidden="true"
          className="pointer-events-none fixed bottom-0 left-0 z-30 hidden max-h-[26dvh] w-[175px] select-none object-contain object-left-bottom lg:block xl:max-h-[34dvh] xl:w-[235px]"
        />

        {/* Main Content Column */}
        <div className="flex min-w-0 flex-1 flex-col px-4 pt-4 pb-28 sm:px-6 lg:px-2 lg:pt-1 lg:pb-6">
          {/* Mobile Compact Header */}
          <header className="mb-4 flex items-center justify-between gap-2 lg:hidden">
            <Link
              href="/"
              className="flex min-h-[44px] items-center gap-2 text-[#242821]"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#526B42] text-[#F7F5EF]">
                <LeafLogoIcon size={20} className="text-[#F7F5EF]" />
              </span>
              <span className="font-serif-display text-[22px] tracking-tight">
                GridWatch
              </span>
            </Link>

            <div className="flex items-center gap-2">
              {canInstallPwa && (
                <button
                  type="button"
                  onClick={() => void promptInstallPwa()}
                  className="gw-pill-glass inline-flex min-h-[44px] items-center gap-1.5 px-3 text-[13px] font-semibold text-[#35462F]"
                >
                  <DownloadIcon size={16} />
                  <span>Install</span>
                </button>
              )}
              <Link
                href="/alerts"
                aria-label="Buka halaman peringatan"
                className="gw-pill-glass relative inline-flex h-[44px] w-[44px] items-center justify-center text-[#242821]"
              >
                <BellIcon size={19} />
                {unreadAlertsCount > 0 && (
                  <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[#E8412C]" />
                )}
              </Link>
            </div>
          </header>

          {/* Connection / Offline Status Banner */}
          {(isBrowserOffline ||
            connectionState === "server_offline" ||
            connectionState === "esp32_offline") && (
            <div
              role="status"
              className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#D7B36A]/65 bg-[#F5EBD2]/95 px-4 py-3 text-[13px] text-[#5D4415] shadow-xs"
            >
              <span className="flex items-center gap-2 font-medium">
                <WifiOffIcon size={17} />
                {isBrowserOffline
                  ? "Perangkat Anda sedang offline. Data yang tampil adalah data tersimpan terakhir."
                  : connectionState === "server_offline"
                    ? "Server API tidak dapat dijangkau. Kontrol relay dinonaktifkan sementara."
                    : "ESP32 sedang offline. Menunggu heartbeat terbaru dari perangkat."}
              </span>
              <Link
                href="/settings"
                className="font-semibold underline underline-offset-2"
              >
                Cek koneksi
              </Link>
            </div>
          )}

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>

      {/* Mobile Floating Bottom Navigation */}
      <nav
        aria-label="Navigasi bawah mobile"
        className="gw-glass-readable fixed right-3 bottom-3 left-3 z-40 rounded-[24px] px-2 py-1.5 shadow-lg lg:hidden"
        style={{
          paddingBottom: "calc(0.375rem + env(safe-area-inset-bottom))",
        }}
      >
        <ul className="grid grid-cols-5 gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item.href);
            const Icon = item.icon;
            const showDot = item.href === "/alerts" && unreadAlertsCount > 0;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch={true}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-[18px] px-1 text-[11px] font-medium transition-colors ${
                    active
                      ? "bg-[#F7F5EF] font-semibold text-[#35462F] shadow-xs"
                      : "text-[#5E655A] hover:text-[#242821]"
                  }`}
                >
                  <Icon
                    size={19}
                    className={active ? "text-[#526B42]" : "text-[#5E655A]"}
                  />
                  <span className="truncate">{item.label}</span>
                  {showDot && (
                    <span className="absolute top-2 right-3 h-2 w-2 rounded-full bg-[#D7B36A]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
