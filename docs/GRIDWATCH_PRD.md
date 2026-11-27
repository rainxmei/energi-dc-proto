# GRIDWATCH — PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Produk:** GridWatch — Smart Home Energy Monitoring & Remote Control  
**Versi:** 1.0 (MVP Planning)  
**Tanggal:** 27 November 2026  
**Status:** Draft untuk pengembangan dan sinkronisasi tim  
**Platform:** Responsive Web + Progressive Web App (PWA)  
**Bahasa antarmuka:** Bahasa Indonesia  
**Acuan visual:** `GRIDWATCH_DESIGN.md` (glassmorphism desktop & mobile)

> **Batas penting:** PRD ini menjelaskan **produk web/PWA**. Rancangan perangkat yang disepakati adalah **1 ESP32, 4 sensor INA219, 4 relay, dan TFT**. Prototipe awal memantau **beban DC pada miniatur**, bukan instalasi PLN 220 V AC. Tidak menggunakan machine learning pada MVP.

---

## 1. Ringkasan Eksekutif

GridWatch adalah aplikasi monitoring energi dan kontrol beban untuk miniatur rumah modern. Pengguna dapat melihat kondisi empat kanal listrik secara real-time, memeriksa konsumsi energi dan riwayat, menerima peringatan, serta mengirim perintah ON/OFF relay dari browser atau PWA yang diinstal di HP.

**Arah produk:** satu codebase frontend Next.js yang dapat diakses melalui browser desktop dan HP serta dapat diinstal sebagai PWA. Backend menggunakan **Vercel Serverless Functions** dan database **Supabase (PostgreSQL)** sebagai pusat data bersama. Alur utama: **ESP32 → Supabase ← Website (Next.js + Vercel)**.

**Nilai utama:** pemantauan terpusat yang mudah dibaca, kontrol jarak jauh yang terkonfirmasi, dan pengalaman antarmuka yang nyaman serta konsisten di desktop maupun mobile.

### 1.1 Pernyataan masalah

Pengguna perlu mengetahui perangkat mana yang sedang mengonsumsi daya, seberapa besar energi yang digunakan, serta apakah beban menyala atau mati. Tanpa tampilan terpadu, data sensor sulit dipantau dan kontrol perangkat dari luar jaringan rumah tidak praktis.

### 1.2 Hipotesis produk

Jika data sensor disajikan sebagai dashboard yang mudah dipahami dan setiap perintah relay memiliki umpan balik jelas, pengguna dapat memantau empat kanal dan mengelola beban miniatur lebih cepat dan lebih percaya diri.

### 1.3 Sasaran MVP

1. Menampilkan data live dari **4 kanal** dengan satuan yang benar.
2. Memungkinkan **kontrol ON/OFF per kanal** dengan hasil yang dikonfirmasi perangkat.
3. Menyimpan dan menampilkan **riwayat energi serta aktivitas**.
4. Memberi tahu pengguna ketika **perangkat/server offline** atau ambang pengukuran terlampaui.
5. Berfungsi sebagai **web responsif dan PWA yang dapat diinstal**, dengan identitas visual yang sama.

### 1.4 Non-goals

- Tidak membangun model ML, AI, prediksi konsumsi, atau deteksi anomali berbasis ML.
- Tidak mengklaim penghematan biaya otomatis atau akurasi setara meter resmi.
- Tidak memonitor instalasi PLN 220 V AC secara langsung menggunakan INA219.
- Tidak mendukung multi-rumah, multi-gateway, atau skala komersial pada MVP.
- Tidak melakukan pembayaran tagihan listrik atau integrasi provider PLN.
- Tidak menjamin kontrol relay bekerja ketika server/perangkat sedang offline.

---

## 2. Pengguna dan Skenario Utama

### 2.1 Persona

| Persona | Kebutuhan | Prioritas |
|---|---|---|
| Pemilik/pengguna rumah demo | Melihat pemakaian daya serta ON/OFF empat kanal | Utama |
| Anggota tim pengembang/penguji | Memantau sensor, status jaringan, riwayat, dan hasil uji | Utama |
| Pengunjung landing page | Memahami manfaat produk dan membuka demo/login | Sekunder |

### 2.2 User journey

**A. Monitoring:** Buka PWA → login → lihat status server dan ESP32 → baca total daya, energi hari ini, kanal aktif → pilih periode grafik → lihat detail kanal.

**B. Kontrol relay:** Pilih kanal → tekan switch → muncul status *Mengirim perintah…* → backend meneruskan perintah → ESP32 mengirim status aktual → UI menampilkan *Berhasil* atau *Gagal/Timeout*. UI **tidak langsung menganggap sukses hanya karena tombol ditekan**.

**C. Pemeriksaan kejadian:** Buka Peringatan → lihat kanal, parameter, nilai dan ambang, waktu → buka detail terkait → periksa riwayat pengukuran.

**D. Akses dari HP:** Buka website lewat HTTPS → instal PWA jika browser mendukung → jalankan dari home screen → pengalaman sama dengan web mobile.

---

## 3. Cakupan Produk & Prioritas

Prioritas menggunakan **P0 = wajib MVP**, **P1 = penyempurnaan setelah MVP**, **P2 = roadmap lanjutan**.

| Area | Fitur | Prioritas |
|---|---|---|
| Akses | Login, logout, sesi dan halaman terlindungi | P0 |
| Dashboard | 4 KPI, grafik daya, kontrol 4 kanal, aktivitas terakhir | P0 |
| Monitoring | V, A, W, status relay, timestamp, status online/offline | P0 |
| Kontrol | Perintah ON/OFF beserta ACK/timeout/error | P0 |
| Riwayat | Grafik periode, tabel data historis & aktivitas | P0 |
| Alert | Threshold sederhana, daftar alert, kondisi offline | P0 |
| PWA | Manifest, ikon, instalasi, standalone, shell offline | P0 |
| Public | Landing page ringkas dengan CTA masuk/buka demo | P0 (ringkas) |
| Pengaturan | Label kanal, threshold, tarif estimasi (opsional) | P1 |
| Notifikasi | Push browser ketika diizinkan, preferensi notifikasi | P1 |
| Ekspor | Unduh riwayat CSV | P1 |
| Analitik | Perbandingan periode dan insight non-ML | P1 |
| Skalabilitas | Banyak pengguna, rumah, dan perangkat fisik | P2 |
| Kecerdasan buatan | ML/anomaly prediction | P2, **bukan MVP** |

> **Keputusan lingkup:** jika waktu praktikum terbatas, selesaikan P0 terlebih dahulu. Fitur P1 tidak boleh menghambat monitoring dan kontrol dasar yang dapat didemonstrasikan.

---

## 4. Struktur Halaman / Information Architecture

```text
/                        Landing Page (publik)
/login                   Login
/dashboard               Ringkasan monitoring & kontrol
/devices                 Daftar 4 kanal + detail
/devices/[channel]       Detail kanal dan riwayatnya
/history                 Riwayat energi & aktivitas
/alerts                  Peringatan dan status offline
/settings                Pengaturan dasar (P1)
/offline                 Informasi koneksi (fallback PWA)
```

**Navigasi desktop:** sidebar `Dashboard · Perangkat · Riwayat · Peringatan · Pengaturan`.  
**Navigasi mobile:** bottom navigation dengan label dan urutan sama.  
**Perlindungan:** semua halaman selain `/`, `/login`, dan shell `/offline` memerlukan sesi yang sah.

### 4.1 Landing page

Tujuan: memperkenalkan GridWatch, menampilkan 3–4 manfaat, preview dashboard, penjelasan singkat cara kerja, serta tombol **Mulai Sekarang / Buka Dashboard**. Visual konsisten dengan tema cozy, elegant, modern. Tidak perlu pricing dan klaim fitur yang belum tersedia.

### 4.2 Dashboard overview

Urutan konten mengikuti `GRIDWATCH_DESIGN.md`:

1. Header greeting, informasi sinkronisasi/status, notifikasi/profil.
2. **Empat KPI**: Total Daya (W), Energi Hari Ini (kWh), Estimasi Biaya* (Rp), Kanal Aktif (x/4).
3. Grafik utama **Penggunaan Daya (W)** dengan pilihan `Hari Ini`, `7 Hari`, `30 Hari`.
4. Panel **Kontrol Kanal** berisi empat kanal dan switch ON/OFF.
5. **Distribusi Penggunaan**, **Tren Energi**, **Aktivitas Terakhir**.

\*Estimasi biaya hanya ditampilkan sebagai estimasi bila tarif/kWh dikonfigurasi. Pada miniatur 12 V DC, **jangan menyebutnya tagihan PLN aktual**. Jika tarif belum tersedia, tampilkan `Belum diatur` atau sembunyikan KPI biaya sesuai keputusan desain; bila tetap wajib empat kartu, gunakan placeholder informatif.

---

## 5. Kebutuhan Fungsional (Functional Requirements)

Setiap ID dapat langsung digunakan sebagai issue pengembangan dan acuan pengujian.

### 5.1 Akun dan akses

| ID | Kebutuhan | Prioritas | Kriteria penerimaan |
|---|---|---|---|
| FR-01 | Login untuk dashboard | P0 | Tanpa login, URL privat diarahkan ke login; setelah login berhasil pengguna masuk dashboard. |
| FR-02 | Logout dan proteksi sesi | P0 | Logout mengakhiri sesi; halaman privat tidak menampilkan data perangkat tanpa akses sah. |
| FR-03 | Status server dan ESP32 | P0 | UI membedakan `Server Offline`, `ESP32 Offline`, dan `Online`; pembacaan terakhir memiliki timestamp. |

### 5.2 Monitoring

| ID | Kebutuhan | Prioritas | Kriteria penerimaan |
|---|---|---|---|
| FR-04 | Empat kanal tetap | P0 | Dashboard menampilkan Kanal 1–4 dengan identitas unik, nama, status relay, dan pengukuran. |
| FR-05 | Pembacaan per kanal | P0 | Menampilkan tegangan V, arus A, daya W, dan waktu terakhir data diterima; data kosong tidak dianggap 0. |
| FR-06 | Total daya | P0 | Total W = penjumlahan daya valid dari 4 kanal pada pembacaan terkini; bila data tidak lengkap, tampilkan penanda `parsial`/`tidak tersedia`, bukan total pasti yang menyesatkan. |
| FR-07 | Energi kumulatif | P0 | Menampilkan energi Wh/kWh berdasarkan akumulasi pembacaan daya terhadap waktu dengan penanganan gap data. |
| FR-08 | Grafik historis | P0 | Opsi Hari Ini, 7 Hari, 30 Hari; satuan dan rentang waktu jelas; bila kosong tampilkan empty state. |
| FR-09 | Ringkasan kanal aktif | P0 | Angka aktif sesuai konfirmasi relay aktual (misalnya 3/4), tidak berdasarkan posisi switch lokal semata. |
| FR-10 | Distribusi pemakaian | P0 | Donut/legenda menjumlahkan porsi empat kanal dari data valid dalam periode yang sama; nilai tidak ada ditandai. |
| FR-11 | Riwayat aktivitas | P0 | Minimal menampilkan perubahan relay, alert, dan status online/offline dengan timestamp. |
| FR-12 | Detail setiap kanal | P0 | Pengguna dapat melihat pengukuran, status dan ringkasan riwayat kanal terpilih. |

### 5.3 Remote control relay

| ID | Kebutuhan | Prioritas | Kriteria penerimaan |
|---|---|---|---|
| FR-13 | ON/OFF per kanal | P0 | Klik/tap mengirim perintah untuk kanal yang dipilih; kontrol memiliki label yang dapat diakses. |
| FR-14 | Status perintah | P0 | Ada tahapan `Idle → Pending → Confirmed` atau `Failed/Timeout`; saat pending tidak dapat mengirim perintah yang bertabrakan pada kanal sama. |
| FR-15 | Konfirmasi dari ESP32 | P0 | Status ON/OFF di UI hanya diperbarui sebagai status pasti setelah ACK/status aktual dari perangkat; jika timeout, tampilkan hasil tidak pasti dan minta refresh/cek ulang. |
| FR-16 | Pembatasan saat offline | P0 | Ketika device/backend offline, switch dinonaktifkan dan pengguna menerima alasan jelas. Tidak mengantre perintah berisiko untuk dieksekusi otomatis setelah reconnect. |
| FR-17 | Jejak audit | P0 | Perubahan relay mencatat kanal, target ON/OFF, waktu, hasil, dan identitas pengguna bila tersedia. |

### 5.4 Alert dan insight

| ID | Kebutuhan | Prioritas | Kriteria penerimaan |
|---|---|---|---|
| FR-18 | Threshold tanpa ML | P0 | Saat pengukuran melampaui ambang yang dikonfigurasi, alert terkait kanal tercatat lengkap dengan nilai aktual dan ambang; gunakan mekanisme anti-flapping (mis. histeresis/durasi). |
| FR-19 | Alert koneksi | P0 | Tidak ada data melewati timeout yang disepakati menghasilkan status offline; ketika pulih, ada event recovery. |
| FR-20 | Daftar peringatan | P0 | Halaman menampilkan waktu, tingkat, judul, kanal, status dan detail; bisa diurutkan terbaru. |
| FR-21 | Notifikasi push | P1 | Dengan izin pengguna, event terpilih dapat mengirim web push pada perangkat/browser yang mendukung; tanpa izin, alert in-app tetap tersedia. |
| FR-22 | Insight sederhana | P1 | Perbandingan energi antarperiode menggunakan perhitungan statistik biasa, bukan prediksi berbasis ML. |

### 5.5 PWA, responsivitas, dan pengaturan

| ID | Kebutuhan | Prioritas | Kriteria penerimaan |
|---|---|---|---|
| FR-23 | Installable PWA | P0 | App manifest dan ikon tersedia; pada browser pendukung, aplikasi bisa ditambahkan ke home screen/dibuka standalone. |
| FR-24 | Responsive layout | P0 | Desktop mengikuti sidebar dan panel berdampingan; mobile KPI 2×2, chart vertikal, bottom navigation; tidak ada horizontal overflow. |
| FR-25 | Offline shell | P0 | Saat browser offline, halaman fallback/shell masih dapat dibuka; data historis terakhir yang ditampilkan diberi label `data tersimpan`, bukan live. |
| FR-26 | Empty/loading/error states | P0 | Skeleton saat loading; empty state untuk periode tanpa data; error state dapat dipahami dan menyediakan retry. |
| FR-27 | Nama kanal dan threshold | P1 | Pengguna berwenang dapat mengubah nama tampilan kanal serta batas alert dengan validasi. |
| FR-28 | Tarif estimasi biaya | P1 | Pengguna dapat memasukkan tarif per kWh; angka estimasi diberi label simulasi/estimasi, bukan tagihan terverifikasi. |
| FR-29 | Ekspor CSV | P1 | Data historis sesuai rentang waktu dapat diunduh sebagai CSV dengan timestamp dan satuan pada header. |

---

## 6. Aturan Data dan Perhitungan

### 6.1 Data minimum per pembacaan

`device_id`, `channel_id`, `voltage_v`, `current_a`, `power_w`, `relay_state`, `measured_at`, dan `received_at`.

- `device_id`: satu identitas ESP32 untuk MVP.
- `channel_id`: salah satu dari 1, 2, 3, 4.
- `measured_at`: waktu pengukuran; jika jam ESP32 belum sinkron, server harus dapat menggunakan waktu penerimaan dengan penanda kualitas timestamp.
- `received_at`: timestamp pada backend, diperlukan untuk deteksi keterlambatan/offline.
- Nilai yang tidak valid ditolak/ditandai; **null tidak sama dengan 0**.

### 6.2 Definisi metrik

| Metrik | Definisi |
|---|---|
| Daya kanal (W) | Nilai daya sesaat terukur pada kanal (bukan energi). |
| Total daya (W) | Jumlah daya empat kanal dari sampel terbaru yang masih valid. |
| Energi (Wh) | Integral/aproksimasi daya (W) terhadap waktu (jam). |
| Energi (kWh) | Wh ÷ 1.000. |
| Estimasi biaya | kWh × tarif yang disetel, ditampilkan sebagai **estimasi** saja. |
| Kanal aktif | Banyak relay yang dilaporkan dalam keadaan ON. |
| Online ESP32 | Ada heartbeat/data dalam jangka waktu yang disetujui. |

Untuk interval dalam detik, aproksimasi energi:

\[
E_{\mathrm{kWh}} = \frac{\sum_i P_i\,\Delta t_i}{3{,}600{,}000}
\]

**Catatan kualitas data:** jangan mengintegrasikan kesenjangan sangat panjang seolah daya konstan sepanjang laptop/server offline. Tandai periode data hilang dan pertimbangkan pembulatan/interval pengambilan yang disepakati tim hardware. Setiap grafik harus menampilkan zona waktu lokal secara konsisten (**Asia/Jakarta**).

### 6.3 Status kanal dan sinkronisasi

- **ON/OFF** = keadaan relay yang terakhir **dikonfirmasi ESP32**.
- **Pending** = perintah terkirim, menunggu konfirmasi; bukan ON/OFF baru.
- **Unknown/Stale** = keadaan aktual tidak dapat dipastikan karena data terlalu lama.
- **Server Offline** = API/back-end tidak dapat dijangkau, terpisah dari **ESP32 Offline**.
- Data *stale* wajib memiliki teks waktu pembacaan terakhir, misalnya `Terakhir diperbarui 13.20 WIB`.

### 6.4 Usulan awal parameter operasional (harus diuji)

| Parameter | Target awal untuk pengujian | Catatan |
|---|---|---|
| Interval kirim telemetri | 2–5 detik | Final disepakati tim hardware. |
| Indikator offline ESP32 | Tidak ada data/heartbeat selama 15 detik | Sesuaikan interval dan jitter jaringan. |
| Timeout command ACK relay | 5–10 detik | Setelah timeout, status `Tidak terkonfirmasi`, bukan sukses. |
| Refresh UI live | ≤ 5 detik setelah telemetri diterima backend pada koneksi normal | Sasaran prototipe, bukan SLA internet. |
| Rentang grafik | Hari ini, 7 hari, 30 hari | Agregasi data disesuaikan jumlah sampel. |

**Jangan memakai angka di screenshot desain sebagai data sensor nyata.** Angka besar seperti 542 W adalah mockup visual; nilai operasional harus berasal dari perangkat atau dataset simulasi yang jelas ditandai.

---

## 7. UX, Visual, dan Aksesibilitas

**Sumber kebenaran desain:** `GRIDWATCH_DESIGN.md` v2.0 dan gambar desktop/mobile yang menyertainya. PRD tidak menggantikan atau mengubah desain yang disepakati.

### 7.1 Identitas visual

| Token | Hex | Peran |
|---|---|---|
| Sage | `#9CAF88` | Brand, indikator normal/ON, grafik utama |
| Cream | `#F7F5EF` | Latar dan kartu kaca |
| Alert Red | `#E8412C` | Error/kritis |
| Info Blue | `#7FA8B8` | Informasi/pembanding |
| Golden Yellow | `#D7B36A` | Insight/perhatian ringan |

**Typography:** **DM Serif Display** untuk judul editorial; **DM Sans** untuk menu, angka, grafik, tombol, dan body.  
**Gaya:** cozy, elegant, modern, minimalist glassmorphism, latar interior rumah warm, panel frosted glass dengan kontras yang tetap nyaman.

### 7.2 Desktop

Sidebar kiri; header; empat KPI satu baris; grafik dan panel kontrol berdampingan; tiga kartu sekunder untuk distribusi, tren, dan aktivitas. Hover/focus state jelas.

### 7.3 Mobile

Header ringkas; KPI 2×2; grafik full width; kontrol empat kanal tersusun vertikal; section sekunder satu kolom; bottom navigation floating dengan safe-area. Target sentuh minimal sekitar **44×44 px**.

### 7.4 States wajib dirancang

`Initial loading`, `No data`, `Online`, `Server offline`, `ESP32 offline`, `Data stale`, `Relay pending`, `Relay confirmed`, `Relay failed`, `Threshold warning`, `Critical alert`, `PWA offline`, `Permission denied` (notifikasi).

**Prinsip:** warna bukan satu-satunya pembawa informasi; tambahkan ikon, teks, dan timestamp. Kontrol relay tidak boleh tampak berhasil sebelum menerima konfirmasi.

---

## 8. Arsitektur Produk Tingkat Tinggi

```text
ESP32 (1 unit)
 ├─ INA219 x4 : tegangan, arus, daya DC
 ├─ Relay x4  : kontrol beban
 └─ TFT       : tampilan lokal
        │
        │ Wi-Fi + HTTPS (REST API / Supabase)
        ▼
Cloud Backend (Vercel Serverless + Supabase)
 ├─ Vercel Serverless API (autentikasi, validasi, ingest & kontrol)
 └─ Supabase PostgreSQL (data telemetri, status perangkat, perintah, alert)
        ▲
        │ HTTPS (REST Polling / Supabase Realtime)
        │
Next.js PWA (Vercel)
 ├─ Desktop browser
 └─ Mobile browser / PWA terinstal
```

### 8.1 Keputusan teknologi

| Lapisan | Rencana | Catatan |
|---|---|---|
| Frontend | Next.js + React + TypeScript | Satu codebase web + mobile PWA. |
| UI | Tailwind CSS + komponen reusable | Ikuti file desain; tanpa UI mobile native terpisah. |
| Grafik | Recharts atau library setara | Responsif dan ringan. |
| PWA | Web App Manifest + service worker | Installable, cache shell dan offline fallback. |
| Backend | Vercel Serverless Functions (Node.js) | Menangani auth, validasi input, dan akses aman ke Supabase. |
| Realtime frontend | Polling berkala (REST) atau Supabase Realtime | Menggantikan WebSocket server persisten karena arsitektur serverless. |
| Komunikasi perangkat | HTTPS POST ke API Vercel / Supabase | ESP32 mengirim telemetri dan mengambil status perintah terbaru. |
| Database | Supabase (PostgreSQL + RLS) | Pusat data bersama yang dibaca/tulis oleh ESP32 (via API) dan website. |
| Hosting | Vercel | Frontend dan Serverless API dalam satu deployment atau terpisah. |

### 8.2 Prinsip akses

- Kedua sisi (ESP32 dan Website) membaca dan menulis data yang sama melalui **Supabase** sebagai *single source of truth*.
- Secret key Supabase hanya disimpan di environment variable **Vercel Serverless**, tidak pernah diekspos ke kode frontend atau ESP32.
- ESP32 mengirim telemetri dan mengambil perintah menggunakan token perangkat (`x-device-token`) melalui HTTPS.
- Website berkomunikasi ke backend melalui HTTPS; akses ke halaman privat dan kontrol relay dilindungi sesi autentikasi.
- Jika frontend dan API beda origin, kebijakan origin, cookie/sesi, CSRF dan CORS harus dikonfigurasi secara aman.

---

## 9. Keamanan, Keandalan, dan Batas Keselamatan

### 9.1 Security requirements

1. Akses dashboard dan command relay harus diautentikasi; pengguna tanpa izin tidak dapat mengontrol perangkat.
2. Gunakan HTTPS/WSS untuk akses publik; jangan membuka langsung PostgreSQL/MQTT ke internet.
3. Validasi skema input, kanal 1–4, target status relay, izin pengguna, dan batas frekuensi perintah.
4. Gunakan `command_id`/correlation ID untuk mencocokkan request dan ACK; cegah duplikasi dan balapan status.
5. Simpan log aktivitas penting tanpa membocorkan kredensial atau token.
6. Simpan rahasia di environment/secret store; jangan commit ke repository.
7. Jadwalkan backup database di lokasi berbeda dari laptop.
8. Logout dan sesi kadaluarsa perlu ditangani; jangan mengandalkan menyembunyikan menu sebagai keamanan.

### 9.2 Reliability requirements

- UI harus menunjukkan error dan retry ketika backend/tunnel tidak tersedia.
- Reconnect WebSocket harus memulihkan snapshot status terbaru, bukan hanya menerima event masa depan.
- Data ganda/out-of-order harus tidak merusak grafik/riwayat.
- Server restart tidak otomatis mengeksekusi ulang perintah kontrol yang kedaluwarsa.
- Status perangkat setelah restart harus disinkronkan ulang dari ESP32.
- Perlu backup/restore yang diuji untuk data lokal.

### 9.3 Safety requirements

- INA219 adalah sensor untuk pengukuran **DC**; MVP hanya miniatur sesuai rentang aman perangkat.
- GridWatch **bukan sistem proteksi listrik tersertifikasi**; tidak menggantikan fuse/MCB atau perlindungan rangkaian.
- State aman relay saat boot, reset, hilang komunikasi, dan gagal daya harus ditentukan tim hardware berdasarkan karakteristik beban.
- Jangan menjalankan switching beban 220 V AC sebagai bagian dari MVP tanpa desain dan supervisi keselamatan yang memadai.

---

## 10. Non-Functional Requirements (NFR)

| ID | Kategori | Target MVP |
|---|---|---|
| NFR-01 | Responsif | Layak pakai pada desktop dan layar HP kecil; tanpa horizontal overflow. |
| NFR-02 | Keterbacaan | Glassmorphism tidak mengorbankan kontras; seluruh kontrol dapat dioperasikan via keyboard/touch. |
| NFR-03 | Performa | Halaman dashboard tidak bergantung pada gambar interior berukuran berlebihan; lazy-load grafik/detail bila perlu. |
| NFR-04 | Latensi | Perubahan telemetri tampil dalam target ≤5 detik setelah backend menerima pesan pada jaringan normal. |
| NFR-05 | Status perangkat | Data yang terlambat tidak ditampilkan sebagai data live tanpa penanda. |
| NFR-06 | PWA | Dapat dipasang di browser pendukung; shell offline tersedia; kontrol tidak tersedia saat offline. |
| NFR-07 | Privasi | Tidak ada kredensial atau data sensitif pada client log/public repo. |
| NFR-08 | Observabilitas | Log backend memuat status koneksi, command ID, error, dan proses sinkronisasi. |
| NFR-09 | Kompatibilitas | Uji versi browser modern yang digunakan tim pada desktop, Android, dan iOS. |
| NFR-10 | Kualitas | Lint/typecheck/build lulus; alur monitoring, login, dan relay diuji sebelum demo. |

---

## 11. Data Model Konseptual

**Bukan skema SQL final.** Struktur berikut menggambarkan entitas produk yang diperlukan.

| Entitas | Kolom inti yang dibutuhkan | Tujuan |
|---|---|---|
| `users` | id, email/username, password_hash, role, created_at | Hak akses dashboard. |
| `devices` | id, name, last_seen_at, status | ESP32 tunggal pada MVP. |
| `channels` | id, device_id, number, display_name, last_relay_state | Empat kanal. |
| `sensor_readings` | id, channel_id, voltage_v, current_a, power_w, measured_at, received_at | Riwayat pengukuran. |
| `energy_aggregates` | channel_id, period_start, period_end, energy_wh, quality | Ringkasan energi yang efisien. |
| `relay_commands` | id, channel_id, desired_state, requested_by, issued_at, ack_at, status | Perintah dan hasil konfirmasi. |
| `alerts` | id, channel_id, type, severity, measured_value, threshold, occurred_at, resolved_at | Peringatan berbasis aturan. |
| `activity_logs` | id, actor, event_type, description, occurred_at | Timeline aktivitas. |
| `settings` | key, value, updated_at | Threshold, tarif, preferensi. |

**Kebijakan data untuk diputuskan:** lama penyimpanan sampel mentah vs agregat, format timezone, backup, ukuran database, dan kebutuhan data historis untuk demo.

---

## 12. Alur Kegagalan dan Penanganan UI

| Kondisi | Apa yang dilihat pengguna | Perilaku sistem |
|---|---|---|
| API / Supabase tidak terjangkau | Banner `Server tidak terhubung`; nilai terakhir diberi timestamp | Nonaktifkan seluruh remote control. |
| ESP32 offline, server hidup | Banner `Perangkat offline`; riwayat tetap tersedia | Nonaktifkan relay command; tampilkan last seen. |
| Browser pengguna offline | Offline fallback/versi cache dengan penanda jelas | Tidak mengirim/menyimpan antrean perintah kontrol. |
| ACK relay terlambat/tidak tiba | Status `Tidak terkonfirmasi` atau `Timeout` | Refresh status dari perangkat bila kembali online; jangan mengklaim ON/OFF baru. |
| Sampel sensor tidak valid | Tanda `Data tidak tersedia` pada kanal tertentu | Jangan masukkan data invalid sebagai nol ke agregat. |
| Tidak ada data dalam periode | Empty state | Sediakan opsi ubah periode. |
| Threshold terlampaui | Peringatan berwarna sesuai severity + detail nilai | Simpan alert; hindari spam karena fluktuasi. |
| Gagal login/akses | Pesan netral dan aman | Tidak membocorkan detail akun/kredensial. |

---

## 13. Rencana Delivery dan Milestone

Tidak menetapkan tanggal atau durasi tanpa jadwal kelompok; urutan berikut adalah **dependency-based roadmap**.

### M1 — Fondasi produk + UI simulasi

- [ ] Buat proyek Next.js TypeScript, design tokens dan komponen reusable.
- [ ] Implementasi landing page singkat, login, layout dashboard desktop/mobile.
- [ ] Kartu KPI, grafik, kontrol kanal, distribusi, aktivitas dengan **data simulasi berlabel**.
- [ ] State loading, empty, offline, pending, error, dan critical dalam UI.

**Exit criteria:** pengguna dapat menjelajahi seluruh halaman utama dengan konsisten pada desktop dan mobile; seluruh data simulasi jelas bukan data nyata.

### M2 — Backend Serverless + Supabase + data riwayat

- [ ] Siapkan skema tabel Supabase (`pengukuran`, `status_perangkat`, `perintah`, `alerts`, dll.) dengan RLS aktif.
- [ ] Implementasi Vercel Serverless API untuk ingest ESP32, agregasi energi, snapshot perangkat, dan status offline.
- [ ] Integrasi REST polling / Supabase Realtime ke PWA.
- [ ] Dokumentasi environment variable untuk tim.

**Exit criteria:** data nyata dari ESP32 masuk ke Supabase dan tampil pada dashboard tanpa refresh manual.

### M3 — Remote control yang aman

- [ ] Implementasi alur ON/OFF → Supabase → ESP32 → ACK/status aktual.
- [ ] Timeout, no-ACK, duplicate command, reconnect, audit log.
- [ ] Threshold alert dan riwayat event.
- [ ] Validasi autentikasi sesi admin dan token perangkat pada seluruh endpoint.

**Exit criteria:** pengguna dapat menyalakan/mematikan setiap kanal dari jaringan luar dengan konfirmasi yang benar, termasuk saat error.

### M4 — PWA dan quality assurance

- [ ] Web manifest, ikon, service worker/offline shell, uji instalasi.
- [ ] Uji Chrome/Edge desktop, Chrome Android, Safari iOS yang tersedia.
- [ ] Uji UI responsive, performance, keyboard, kontras dan status koneksi.
- [ ] Uji demo saat ESP32 offline, internet putus, dan online kembali.

**Exit criteria:** dashboard dapat diakses melalui browser atau PWA terinstal, dan menampilkan status yang dapat dipercaya.

### Setelah MVP (P1)

- [ ] Label kanal yang dapat diubah, threshold melalui UI, tarif estimasi.
- [ ] Web push notification dengan izin pengguna dan fallback in-app.
- [ ] Ekspor CSV dan analisis perbandingan periode.
- [ ] Pengelolaan penyimpanan/agregasi jangka panjang.

---

## 14. Acceptance Test / Definition of Done

### 14.1 Uji utama (wajib lulus sebelum demo)

| ID | Skenario | Hasil diharapkan |
|---|---|---|
| AT-01 | Login tanpa kredensial valid | Dashboard tidak dapat diakses. |
| AT-02 | Empat kanal mengirim nilai berbeda | Nilai masing-masing kanal dan total daya tampil benar. |
| AT-03 | Ubah satu relay ke ON | Muncul pending, kemudian confirmed sesuai status aktual ESP32. |
| AT-04 | ACK relay sengaja tidak dikirim | Timeout, perintah tidak ditampilkan berhasil. |
| AT-05 | Cabut koneksi ESP32 | Status `ESP32 Offline`, kontrol dinonaktifkan, data lama diberi timestamp. |
| AT-06 | Layanan API / Supabase tidak terjangkau | Frontend tetap dapat dibuka (shell PWA); monitoring dan kontrol offline. |
| AT-07 | Data sensor hilang/invalid | Nilai kosong ditandai; tidak berubah menjadi 0 palsu. |
| AT-08 | Ganti periode grafik | Grafik dan label waktu mengikuti rentang; empty state bila data belum ada. |
| AT-09 | Lebar layar mobile | KPI tidak terpotong, kontrol mudah disentuh, bottom nav tidak menutup konten. |
| AT-10 | Instal PWA di browser pendukung | Ikon dapat dipasang dan aplikasi tampil standalone. |
| AT-11 | Aktifkan threshold terlampaui | Alert masuk daftar dengan kanal, nilai, batas dan waktu. |
| AT-12 | Koneksi pulih setelah terputus | UI mengambil snapshot terkini; tidak menjalankan otomatis perintah lama. |
| AT-13 | Uji dari internet berbeda | Dashboard dapat menerima data dan kontrol relay melalui HTTPS Vercel + Supabase. |

### 14.2 Definition of Done

Sebuah fitur dinyatakan selesai jika UI desktop/mobile sesuai desain; state loading/empty/error ditangani; keamanan dasar dan validasi tersedia; jalur sukses serta gagal diuji; tidak ada error build/typecheck; dan dapat didemonstrasikan pada perangkat target.

---

## 15. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Koneksi internet / API terputus | Monitoring jarak jauh tidak tersedia | Reconnect/retry otomatis, status jelas, waktu pembacaan terakhir. |
| Perintah relay tanpa ACK | UI mengklaim status yang salah | State pending/unknown dan ACK dari ESP32. |
| Sampel terlalu rapat | Database cepat membesar | Retensi dan agregasi periode, indeks timestamp. |
| Data pengukuran kurang akurat | Grafik/estimasi menyesatkan | Kalibrasi, label demonstrasi, validasi terhadap pengukuran pembanding. |
| Glassmorphism kontras rendah | Dashboard susah dibaca | Permukaan lebih solid, uji kontras, fallback saat backdrop-filter tidak didukung. |
| Penggunaan INA219 pada listrik rumah AC | Risiko keselamatan dan salah spesifikasi | Batas eksplisit MVP pada miniatur DC; desain AC terpisah jika diperlukan. |
| Kredensial/RLS salah konfigurasi | Risiko akses tidak sah | Autentikasi, HTTPS, pembatasan origin, validasi command, aktifkan RLS tanpa policy publik. |

---

## 16. Keputusan Terbuka untuk Sinkronisasi Tim

Keputusan di bawah **belum disepakati**, tidak boleh diasumsikan telah siap:

1. **Tegangan dan jenis beban miniatur aktual:** rancangan awal menunjukkan 12 V DC; konfirmasi wiring dan batas sensor/relay.
2. **Nama empat kanal:** misalnya Ruang Keluarga, Ruang Kerja, Kamar Tidur, Taman — saat ini **contoh UI**, bukan pemetaan kabel definitif.
3. **Frekuensi sensor, offline timeout, dan ACK timeout:** gunakan angka sementara pada §6.4 sampai diuji.
4. **Autentikasi:** satu akun demo atau beberapa akun; siapa berhak mengontrol relay.
5. **Tarif estimasi:** perlu atau tidak di MVP, karena miniatur DC bukan tagihan rumah nyata.
6. **Threshold:** parameter mana yang wajib dipantau dan bagaimana level warning/critical ditentukan dari pengujian.
7. **Penyimpanan:** retensi data sensor mentah, backup, dan ukuran disk laptop.
8. **Domain dan hosting:** penetapan domain frontend, subdomain API, serta konfigurasi Cloudflare Tunnel.
9. **Push notification:** apakah diperlukan pada demo awal atau cukup alert in-app.
10. **Perilaku relay saat power loss/boot:** ditentukan oleh tim hardware untuk keselamatan beban.

---

## 17. Referensi dan Hubungan Dokumen

### Referensi internal

- **`GRIDWATCH_DESIGN.md` versi 2.0** — sumber utama untuk layout glassmorphism, tokens warna, typography, komponen, desktop/mobile dan accessibility visual.
- **Flowchart 1 ESP32 / 4 INA219 / 4 relay / TFT** — sumber arah aliran proses perangkat yang disepakati tim. **Langkah ML pada diagram lama tidak digunakan di MVP.**
- **Dokumen proposal GridWatch sebelumnya** — rujukan latar belakang IoT; konfigurasi 3 ESP32 dalam draf tersebut telah **digantikan** oleh keputusan 1 ESP32 dari tim.

### Referensi platform

- Next.js: Progressive Web Apps — https://nextjs.org/docs/app/guides/progressive-web-apps
- MDN: Making PWAs installable — https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- Cloudflare: Tunnel concepts — https://developers.cloudflare.com/tunnel/concepts/

**Aturan penggunaan dokumen:** PRD ini adalah sumber kebutuhan produk dan acceptance criteria. `GRIDWATCH_DESIGN.md` adalah sumber gaya visual. Rincian implementasi teknis dapat disusun dalam dokumen arsitektur/technical design terpisah tanpa mengubah tujuan produk.
