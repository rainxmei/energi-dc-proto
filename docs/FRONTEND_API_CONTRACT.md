# GridWatch — Dokumentasi Frontend & Kontrak API untuk Tim Backend

Dokumen ini menjelaskan cara kerja **Frontend Dashboard PWA GridWatch** (`frontend/`) serta format request/response API yang diharapkan agar tim backend dapat langsung menyambungkan endpoint tanpa menebak-nebak struktur data.

---

## 1. Ringkasan Arsitektur & Cara Frontend Mengambil Data

- **Stack Frontend:** Next.js (App Router) + React + TypeScript + Tailwind CSS + Recharts + PWA (`manifest.webmanifest` & `sw.js`).
- **Mekanisme Sinkronisasi:** REST Polling berkala setiap **3 detik** (`3000 ms`) ke endpoint `GET /api/pengukuran`.
- **Timeout Request:**
  - `GET /api/pengukuran`: timeout **5 detik**.
  - `POST /api/perintah`: timeout **7 detik**.
- **Mode Sumber Data (diatur di halaman `/settings`):**
  1. `Otomatis` (default): mencoba memanggil `NEXT_PUBLIC_API_URL`; jika kosong atau gagal terhubung, otomatis fallback ke **Mode Simulasi** agar demo tetap berjalan.
  2. `Mode Simulasi`: murni data simulasi lokal (tidak memanggil backend).
  3. `Live API`: selalu memanggil backend; jika gagal, menampilkan banner `Server API tidak dapat dijangkau` dan menonaktifkan kontrol relay.

---

## 2. Konfigurasi Base URL & CORS

### Environment Variable Frontend
Di file `frontend/.env.local` (atau Vercel Environment Variables):
```env
NEXT_PUBLIC_API_URL=https://domain-backend-anda.vercel.app
```
*(URL ini juga bisa diubah langsung saat runtime melalui menu **Pengaturan → URL Backend API** di dashboard.)*

### Header CORS (Wajib jika Frontend & Backend beda domain)
Karena frontend dan backend bisa dideploy sebagai dua project Vercel terpisah, backend **wajib** mengembalikan header CORS berikut (termasuk menangani preflight `OPTIONS`):
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```
*(Untuk produksi, ganti `*` dengan domain frontend Vercel spesifik.)*

---

## 3. Kontrak Endpoint Utama (Dipakai Frontend Saat Ini)

Implementasi client di frontend ada pada [`frontend/src/lib/api.ts`](../frontend/src/lib/api.ts) dan tipe datanya di [`frontend/src/types/gridwatch.ts`](../frontend/src/types/gridwatch.ts).

### 3.1 `GET /api/pengukuran?limit=240`

Dipanggil setiap 3 detik untuk mengisi 4 KPI, grafik `Penggunaan Daya (W)`, status 4 kanal (`V`, `A`, `W`), status ESP32 (`online/offline`, `rssi`, `uptime_s`), dan evaluasi notifikasi batas daya.

#### Contoh Response (`200 OK`)
```json
{
  "server_time": "2026-11-27T10:15:00.000Z",
  "status": {
    "online": true,
    "last_seen": "2026-11-27T10:14:58.000Z",
    "led_on": false,
    "rssi": -54,
    "uptime_s": 14820
  },
  "perintah": {
    "led": false,
    "relay1": true,
    "relay2": true,
    "relay3": true,
    "relay4": false
  },
  "data": [
    {
      "created_at": "2026-11-27T10:14:55.000Z",
      "channel": 1,
      "voltage_v": 12.1,
      "current_a": 0.45,
      "power_w": 5.45
    },
    {
      "created_at": "2026-11-27T10:14:55.000Z",
      "channel": 2,
      "voltage_v": 12.0,
      "current_a": 0.25,
      "power_w": 3.0
    }
  ]
}
```

#### Aturan Pemetaan Field ke UI
| Field | Tipe | Perilaku di Frontend |
|---|---|---|
| `server_time` | ISO 8601 string | Waktu sinkronisasi terakhir (dikonversi otomatis ke zona waktu `Asia/Jakarta` WIB). |
| `status.online` | `boolean` | Jika `false`, UI menampilkan status `ESP32 Offline` dan menonaktifkan switch kontrol relay. |
| `status.last_seen` | ISO 8601 string | Ditampilkan di halaman **Perangkat** sebagai waktu terakhir ESP32 terlihat. |
| `status.rssi` | `number \| null` | Ditampilkan sebagai kekuatan sinyal Wi-Fi (`dBm`) di halaman **Perangkat**. |
| `status.uptime_s` | `number \| null` | Diformat menjadi `X jam Y mnt` di halaman **Perangkat**. |
| `perintah.relay1..4` | `boolean` | Menentukan posisi switch ON/OFF untuk Kanal 1–4. |
| `data[].channel` | `1 \| 2 \| 3 \| 4` | Identitas kanal; nilai di luar `1..4` diabaikan frontend. |
| `data[].voltage_v` | `number` | Tegangan (`V`). Jika tidak ada data kanal, frontend menampilkan `--` (bukan `0`). |
| `data[].current_a` | `number` | Arus (`A`). |
| `data[].power_w` | `number` | Daya (`W`). Mendukung nilai desimal kecil (mis. `2,4 W` untuk 12V DC INA219) maupun ratusan watt. |
| `data[].created_at` | ISO 8601 string | Disarankan urut **lama ke baru (`ASC`)**. Frontend mengelompokkan per bucket 3 detik untuk grafik dan menghitung akumulasi energi `kWh`. |

---

### 3.2 `POST /api/perintah`

Dipanggil saat pengguna menekan switch ON/OFF salah satu kanal (atau tombol **Kelola Semua**) di Dashboard maupun halaman Perangkat.

#### Request Body
```json
{
  "target": "relay1",
  "nilai": true
}
```
- `target`: salah satu dari `"relay1"`, `"relay2"`, `"relay3"`, `"relay4"`, atau `"led"`.
- `nilai`: `boolean` (`true` = ON, `false` = OFF).

#### Response yang Diharapkan
- **Sukses (`200 OK`):**
  ```json
  {
    "ok": true,
    "perintah": {
      "led": false,
      "relay1": true,
      "relay2": true,
      "relay3": true,
      "relay4": false
    }
  }
  ```
- **Error (`400` / `401` / `500`):**
  - `401 Unauthorized`: Frontend menampilkan toast `"Backend memerlukan autentikasi admin untuk mengubah relay."`
  - Status non-2xx lainnya / timeout > 7 detik: Switch tidak berubah menjadi ON/OFF palsu dan menampilkan pesan gagal/timeout.

> **Catatan Penting Autentikasi untuk Tim Backend:**  
> Pada versi demo saat ini, frontend **belum mengaktifkan halaman `/login`** (langsung masuk ke Dashboard). Jika `backend/api/perintah.js` masih mewajibkan header `Authorization: Bearer <token>`, maka kontrol relay dari frontend akan menerima `401`.  
> Untuk demo, tim backend dapat memilih:
> 1. Menonaktifkan sementara pengecekan `tokenValid(...)` di `api/perintah.js`, **atau**
> 2. Memberi tahu tim frontend jika autentikasi admin ingin diaktifkan kembali (frontend siap mengirim header `Authorization: Bearer <token>`).

---

## 4. Fitur yang Saat Ini Berjalan di Sisi Frontend (Tanpa Endpoint Khusus)

Agar tim backend tidak perlu membuat endpoint yang belum mendesak untuk MVP:

1. **Notifikasi Batas Daya (PWA Notification & Toast):**
   - Evaluasi ambang batas (**Total Daya** dan **Per-Kanal**) dilakukan langsung di frontend setiap kali data baru diterima dari `GET /api/pengukuran`.
   - Jika `totalPowerW > totalThresholdW` atau `channel.powerW > channelThresholdW`, frontend otomatis mencatat alert di halaman `/alerts`, menampilkan toast, dan mengirim notifikasi browser/OS lewat Service Worker (dengan cooldown anti-spam).
2. **Pengaturan Pengguna (`/settings`):**
   - Nama 4 kanal, batas daya total & per kanal (presisi `0,1 W`), jeda cooldown notifikasi, dan tarif simulasi (`Rp/kWh`) disimpan di `localStorage` browser (`gridwatch.settings.v1`).
3. **Ekspor CSV (`/history`):**
   - Dihasilkan langsung di sisi client dari dataset grafik aktif.

---

## 5. Rekomendasi Pengembangan API Lanjutan (Opsional / P1)

Jika nanti ingin meningkatkan akurasi riwayat jangka panjang:

1. **Query Parameter Rentang Waktu pada `GET /api/pengukuran`:**
   - Tambahkan dukungan `?range=today|7d|30d` dengan agregasi per jam (`today`) atau per hari (`7d`, `30d`) dari PostgreSQL/Supabase agar payload tetap ringan.
2. **Konfirmasi ACK Relay Aktual dari ESP32:**
   - Tambahkan kolom/field status relay aktual (mis. `relay_actual: { relay1..4 }`) di `status_perangkat` agar UI bisa membedakan antara *perintah terkirim* dan *relay benar-benar sudah berpindah di ESP32*.

---

## 6. Cara Cepat Menguji Integrasi Backend dengan Frontend

1. Pastikan endpoint backend aktif dan merespons `GET /api/pengukuran`:
   ```bash
   curl -i https://domain-backend-anda.vercel.app/api/pengukuran?limit=20
   ```
2. Buka Dashboard Frontend → masuk menu **Pengaturan**.
3. Ubah **Mode Sumber Data** ke **Live API** (atau **Otomatis**), lalu masukkan URL backend pada kolom **URL Backend API**.
4. Klik **Simpan Pengaturan** lalu **Segarkan Data**.
5. Cek halaman **Dashboard** dan **Perangkat**: angka `V`, `A`, `W`, status ESP32, dan switch relay akan langsung mengikuti data backend Anda.
