"use client";

import React from "react";
import Link from "next/link";
import { WifiOffIcon } from "@/components/Icons";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[65dvh] items-center justify-center">
      <section className="gw-glass-readable max-w-md p-6 text-center sm:p-8">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5EBD2] text-[#78591C]">
          <WifiOffIcon size={26} />
        </span>
        <h1 className="font-serif-display mt-4 text-[28px] text-[#242821]">
          Sedang Offline
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#5E655A]">
          Koneksi internet tidak terdeteksi. Halaman shell PWA GridWatch tetap
          dapat dibuka, tetapi pembaruan data live dan kontrol relay
          dinonaktifkan sementara sampai koneksi pulih.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-[44px] rounded-full bg-[#526B42] px-5 text-[14px] font-semibold text-[#F7F5EF]"
          >
            Coba Muat Ulang
          </button>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-full border border-[#35462F]/25 bg-[#F7F5EF] px-5 text-[14px] font-semibold text-[#242821]"
          >
            Ke Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
