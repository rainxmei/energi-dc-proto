# GridWatch Frontend

Aplikasi Web Responsif & PWA untuk monitoring energi 4 kanal dan kontrol relay jarak jauh.

## Rencana Struktur `src/`

- `src/app/` — Halaman App Router (`/`, `/login`, `/dashboard`, `/devices`, `/devices/[channel]`, `/history`, `/alerts`, `/settings`, `/offline`)
- `src/components/` — Komponen UI reusable (KPI cards, grafik, switch relay, navigasi)
- `src/hooks/` — Custom React hooks (polling/realtime, auth, status perintah relay)
- `src/lib/` — API client, formatter satuan (W, kWh, WIB), konstanta
- `src/types/` — Definisi tipe TypeScript

## Acuan Desain & Kebutuhan

- PRD: `../docs/GRIDWATCH_PRD.md`
- Panduan Visual: `../docs/GRIDWATCH_DESIGN.md`
