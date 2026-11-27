<<<<<<< HEAD
# Prototipe: ESP32 → Vercel → Supabase → Dashboard

Tujuan: membuktikan dulu seluruh rantai data sebelum komponen (INA219, relay) datang.

- ESP32 mengirim data **simulasi** 4 kanal lewat HTTPS ke Vercel.
- Vercel menyimpan ke Supabase dan membalas dengan perintah terbaru.
- Dashboard (HTML biasa) menampilkan data untuk siapa saja. Admin yang login bisa menyalakan/mematikan **LED bawaan ESP32**.

```
ESP32 ──POST /api/ingest──▶ Vercel ──▶ Supabase
  ▲   (data + token perangkat)   │
  └──── respons berisi perintah ◀┘
Browser ──GET /api/pengukuran──▶ Vercel ──▶ Supabase   (publik, hanya baca)
Admin ──POST /api/login, /api/perintah──▶ Vercel ──▶ Supabase   (butuh login)
```

## Isi folder

| Path | Fungsi |
|---|---|
| `supabase/setup.sql` | Membuat 3 tabel + mengaktifkan keamanan (RLS) |
| `api/ingest.js` | Dipanggil ESP32: simpan data, balas perintah |
| `api/pengukuran.js` | Dipanggil dashboard: ambil data (publik) |
| `api/login.js` | Login admin, menghasilkan token 12 jam |
| `api/perintah.js` | Ubah perintah LED (khusus admin) |
| `lib/helpers.js` | Fungsi bersama (akses Supabase, token, validasi) |
| `public/index.html` | Dashboard |
| `esp32/esp32_led_dashboard/` | Sketch Arduino IDE |

## Langkah 1 — Supabase (pertama kali)

1. Buka <https://supabase.com>, daftar/masuk, lalu **New project**. Isi nama proyek dan password database (simpan), pilih region terdekat (mis. Singapore), klik Create. Tunggu beberapa menit sampai siap.
2. Menu **SQL Editor → New query**. Tempel seluruh isi `supabase/setup.sql`, klik **Run**. Cek di **Table Editor** harus ada tabel `pengukuran`, `status_perangkat`, `perintah`.
3. Ambil dua nilai (nama menu bisa sedikit berbeda karena dashboard Supabase sering diperbarui):
   - **Project URL**, bentuknya `https://xxxxxxxx.supabase.co`.
   - **Secret key**, bentuknya `sb_secret_...`, di **Project Settings → API Keys**. Kalau proyekmu masih menampilkan kunci lama, `service_role` juga bisa dipakai.
4. **Secret key itu rahasia.** Jangan masuk ke GitHub, kode HTML, atau sketch ESP32. Hanya boleh ada di environment variable Vercel.

## Langkah 2 — Deploy ke Vercel

Buat 5 nilai berikut. Dua string acak bisa dibuat dengan perintah:
`node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`

| Nama environment variable | Isi |
|---|---|
| `SUPABASE_URL` | Project URL dari langkah 1 |
| `SUPABASE_SECRET_KEY` | Secret key dari langkah 1 |
| `DEVICE_TOKEN` | String acak (akan ditempel juga di sketch ESP32) |
| `ADMIN_PASSWORD` | Password admin dashboard (yang kuat) |
| `SESSION_SECRET` | String acak lain |

**Cara A — Vercel CLI**
```
npm i -g vercel
cd energi-dc-proto
vercel login
vercel            # Framework: Other, build command kosong
# tambahkan kelima variabel di Vercel > Project > Settings > Environment Variables
vercel --prod
```

**Cara B — GitHub**: unggah folder ini ke repo (file `.gitignore` sudah menjaga `.env`), lalu <https://vercel.com/new> → import repo → Framework Preset **Other** → isi Environment Variables → Deploy.

Setiap kali mengubah environment variable, **deploy ulang** supaya berlaku.

## Langkah 3 — Tes tanpa ESP32

Ganti `URL` dengan alamat Vercel-mu.

```
# token salah -> harus 401
curl -i -X POST URL/api/ingest -H "x-device-token: salah" -H "Content-Type: application/json" -d "{}"

# token benar -> harus 200 + ada "perintah"
curl -i -X POST URL/api/ingest -H "x-device-token: DEVICE_TOKEN_KAMU" -H "Content-Type: application/json" \
  -d "{\"kanal\":[{\"ch\":1,\"v\":12,\"i\":0.2,\"p\":2.4}],\"led_on\":false}"
```
Buka `URL` di browser: kartu Kanal 1 harus menampilkan 2,40 W. Login admin dan coba tombol LED (belum ada ESP32, jadi statusnya "menunggu ESP32").

## Langkah 4 — ESP32 (Arduino IDE)

1. Pasang paket board **esp32 by Espressif** (Boards Manager) dan library **ArduinoJson 7.x** (Library Manager).
2. Buka `esp32/esp32_led_dashboard/esp32_led_dashboard.ino`. Isi `WIFI_SSID`, `WIFI_PASS`, `API_URL` (alamat Vercel + `/api/ingest`), dan `DEVICE_TOKEN` (sama persis dengan di Vercel).
3. Board: **ESP32 Dev Module**, upload, buka Serial Monitor 115200. Log yang diharapkan: `OK (200). LED=OFF` tiap 3 detik.
4. Di dashboard, login admin lalu tekan **Nyalakan LED**. Dalam ±3 detik LED bawaan menyala dan badge berubah menjadi online.

## Kalau ada masalah

| Gejala | Kemungkinan penyebab |
|---|---|
| API membalas `konfigurasi_belum_lengkap` | Ada environment variable yang belum diisi, atau belum deploy ulang |
| API membalas `server_error` | Lihat Vercel > Deployments > Logs. Tambah variabel `DEBUG_ERRORS=1` sementara untuk melihat detail |
| Log Vercel: `Supabase 401/403` atau "Invalid API key" | `SUPABASE_SECRET_KEY` salah atau salah salin |
| Log Vercel: tabel tidak ditemukan | `setup.sql` belum dijalankan |
| ESP32: `DITOLAK (401)` | `DEVICE_TOKEN` di sketch ≠ di Vercel |
| ESP32: `Gagal terhubung` | Hotspot tidak punya internet, atau URL salah |
| LED tidak berubah | Cek pin LED papanmu (`LED_PIN`), dan pastikan badge dashboard "online" |

## Catatan keamanan dan batasan prototipe

- Sketch memakai `client.setInsecure()` (sertifikat server tidak diperiksa). Cukup untuk uji coba, ganti dengan sertifikat root di versi final.
- Tabel dilindungi RLS tanpa policy, jadi hanya server Vercel (secret key) yang bisa membaca/menulis. Dashboard tidak pernah memegang kunci Supabase.
- Data masuk tiap 3 detik × 4 kanal ≈ 115 ribu baris per hari. Hapus data lama secara berkala (perintah SQL-nya ada di bagian bawah `setup.sql`) atau perbesar `INTERVAL_MS`.
- Login admin sederhana (satu password, token 12 jam). Cukup untuk prototipe; untuk versi final pertimbangkan Supabase Auth.
- Kolom status relay per kanal belum ada di tabel `pengukuran`; tambahkan saat relay dipasang.

## Versi sketch dengan INA219 + relay

Sketch `esp32/esp32_energi_dc/esp32_energi_dc.ino` memakai pin sesuai skematik KiCad (lihat `esp32/PINOUT.md`).
Pasang library "Adafruit INA219" dan "ArduinoJson", isi 4 konstanta di bagian atas, lalu upload.
Untuk uji relay tanpa sensor, ubah `PAKAI_SENSOR` menjadi `false`.

## Layar TFT (opsional)

Pasang library **Adafruit ILI9341** dan **Adafruit GFX Library** lewat Library Manager. Sketch `esp32_energi_dc` mendeteksinya otomatis. Layar menampilkan 4 kanal (V, A, W, status, lampu relay), total daya, dan status online. Kalau layar tetap gelap, cek kabel RST dan LED modul ke 3V3 (lihat `esp32/PINOUT.md`).

## Deteksi anomali (ML di laptop)

1. Di Supabase > SQL Editor, jalankan **sekali** isi `supabase/tambah_anomali.sql`. Lalu deploy ulang Vercel (file `api/pengukuran.js` berubah).
2. Di laptop, dari folder `ml/`:
   ```
   pip install -r requirements.txt
   copy .env.example .env        (Windows)  /  cp .env.example .env  (Mac/Linux), lalu isi URL dan kunci secret
   python anomali.py sim         # uji pipeline dengan data tiruan, tanpa Supabase
   ```
3. Biarkan sistem merekam beban yang bekerja **normal** minimal 1–2 jam (makin banyak dan makin beragam makin baik), lalu:
   ```
   python anomali.py train --jam 24
   python anomali.py run         # biarkan terbuka; hasil tampil di kartu kanal dashboard
   ```
Cara kerja: tiap kanal dinilai per jendela 30 detik (10 sampel). Dua lapis penilaian: Isolation Forest untuk pola gabungan, dan aturan statistik untuk pergeseran rata-rata arus/tegangan atau arus yang tiba-tiba bergejolak. Sebuah kanal ditandai anomali bila 2 dari 3 jendela berturut-turut mencurigakan. Jendela saat beban mati atau sedang dinyalakan/dimatikan tidak dinilai. Hasil lebih dari 60 detik tidak diperbarui dianggap basi, dan dashboard kembali menulis "Belum aktif".

Latih ulang (`train`) setiap kali beban atau cara pakainya berubah, karena model hanya tahu apa yang pernah dilihatnya.
=======
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
>>>>>>> frontend
