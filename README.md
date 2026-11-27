# GridWatch — Smart Home Energy Monitoring & Remote Control

Monorepo proyek GridWatch dengan arsitektur **ESP32 → Supabase ← Website (Next.js + Vercel Serverless)**.

## Struktur Folder

| Folder | Isi & Tanggung Jawab |
|---|---|
| `frontend/` | Aplikasi web & PWA (**Next.js + React + TypeScript + Tailwind CSS**) |
| `backend/` | **Vercel Serverless Functions** (`api/`, `lib/`) & skema database **Supabase** (`supabase/`) |
| `firmware/` | Sketch Arduino IDE untuk **ESP32** (`esp32_energi_dc`, `esp32_led_dashboard`) & `PINOUT.md` |
| `docs/` | Dokumen perencanaan (`GRIDWATCH_PRD.md`, `GRIDWATCH_DESIGN.md`, aset referensi) |
| `archive/` | Komponen di luar scope MVP saat ini (mis. skrip ML Python) |

## Pembagian Kerja Tim

- **Frontend (`frontend/`)**: UI/UX, PWA, state management, integrasi ke API backend / Supabase.
- **Backend (`backend/`)**: Endpoint Vercel Serverless, autentikasi, validasi perintah relay, dan konfigurasi tabel/RLS Supabase.
- **Firmware (`firmware/`)**: Pembacaan sensor INA219, kontrol 4 relay, layar TFT, dan komunikasi HTTPS ke backend.
