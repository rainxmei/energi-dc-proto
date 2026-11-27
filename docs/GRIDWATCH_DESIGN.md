# GridWatch — Dashboard Visual Design Guide

> **Versi:** 2.0 · **Cakupan:** Desain dashboard desktop dan mobile saja  
> **Gaya:** Cozy · Elegant · Modern · Minimalist · Soft Glassmorphism  
> **Bahasa antarmuka:** Bahasa Indonesia  
> **Dokumen ini hanya membahas desain visual, tata letak, komponen, responsivitas, dan keadaan tampilan.**

---

## 1. Visi Visual

GridWatch adalah dashboard pemantauan energi untuk hunian modern. Tampilannya harus terasa seperti interior rumah yang hangat: **tenang, lapang, mewah tanpa berlebihan**, dengan panel kaca buram yang menyatu dengan suasana rumah. Bukan dashboard industri yang kaku, gelap, atau penuh angka.

**Kata kunci visual:** interior Japandi, cahaya sore yang lembut, olive/sage green, cream, tanaman hijau, frosted glass, bentuk organik, whitespace luas, tipografi editorial.

**Prioritas desain:**

1. Informasi penting langsung terlihat: daya saat ini, energi hari ini, estimasi biaya, dan kanal aktif.
2. Komposisi bersih: satu grafik utama, satu area kontrol kanal, lalu informasi sekunder.
3. Efek kaca terasa premium, tetapi tulisan tetap memiliki kontras yang baik.
4. Desktop dan mobile memiliki identitas visual yang sama, tetapi susunan layar disesuaikan.
5. Aksen warna digunakan berdasarkan maknanya, bukan sebagai dekorasi berlebihan.

### Referensi gambar

Bila tersedia bersama dokumen ini, gunakan berkas berikut sebagai acuan visual:

- `references/dashboard-desktop.png` — layout desktop, atmosfer ruangan, sidebar dan susunan kartu.
- `references/dashboard-mobile.png` — hierarki konten mobile, susunan KPI 2×2 dan bottom navigation.
- `references/landing-page.png` — karakter merek, perpaduan serif–sans, sage dan cream.

> Screenshot bersifat **referensi visual**, bukan spesifikasi angka. Angka, tanggal, nama ruang, dan data statistik adalah contoh tampilan saja.

---

## 2. Identitas Warna

### 2.1 Palet utama

| Token | Hex | Peran visual |
|---|---|---|
| `sage` | `#9CAF88` | Warna identitas, elemen aktif, grafik utama |
| `cream` | `#F7F5EF` | Background, permukaan kartu dan tombol terang |
| `red` | `#E8412C` | Alert/error yang memerlukan perhatian serius |
| `info-blue` | `#7FA8B8` | Informasi netral, perbandingan, indikator informatif |
| `warm-yellow` | `#D7B36A` | Insight, tips, perhatian ringan dan penekanan hangat |

### 2.2 Warna pendukung

| Token | Hex | Peran visual |
|---|---|---|
| `forest` | `#526B42` | Teks aksen, ikon aktif, garis grafik |
| `deep-olive` | `#35462F` | Heading gelap di permukaan terang |
| `ink` | `#242821` | Teks utama dan angka KPI |
| `muted-text` | `#5E655A` | Label, deskripsi dan metadata |
| `soft-sage` | `#E3E9DA` | Latar chip positif/normal |
| `soft-blue` | `#E2EDF1` | Latar chip informatif |
| `soft-yellow` | `#F5EBD2` | Latar tip/insight |
| `soft-red` | `#F9E3DE` | Latar alert/error |
| `off-neutral` | `#D6D2C8` | Toggle nonaktif dan metadata pasif |

### 2.3 Makna warna

- **Sage/hijau:** kondisi normal, pilihan aktif, grafik energi, indikator ON.
- **Biru lembut:** informasi, pembanding statistik, label netral.
- **Kuning keemasan:** insight, tips, highlight dan perhatian non-kritis.
- **Merah:** kegagalan, anomali serius atau peringatan kritis; gunakan hemat.
- **Cream/abu hangat:** elemen pasif, divider, latar, toggle OFF.

Gunakan komposisi visual kira-kira **75% neutral/cream, 20% sage/olive dan maksimal 5% warna aksen** dalam satu layar. Angka ini adalah arahan estetika, bukan rumus teknis.

---

## 3. Tipografi

Pasangan tipografi harus mempertahankan kesan editorial landing page GridWatch.

| Kegunaan | Font | Karakter |
|---|---|---|
| Logo dan heading besar | **DM Serif Display**; fallback Georgia | Hangat, elegan dan berkarakter |
| Body, menu, label, tombol | **DM Sans**; fallback system sans-serif | Bersih, ramah, mudah dibaca |
| Angka dan statistik | DM Sans SemiBold / Bold | Tegas, rapi, konsisten |

### Skala tipografi

| Elemen | Desktop | Mobile | Berat/gaya |
|---|---:|---:|---|
| Judul halaman | 38–46 px | 28–34 px | Serif regular; boleh satu frasa italic |
| Judul section | 23–28 px | 21–24 px | Serif regular |
| Angka KPI | 30–38 px | 24–30 px | SemiBold / bold |
| Label KPI | 14–15 px | 12–14 px | Medium |
| Teks isi | 14–16 px | 14–15 px | Regular |
| Caption / metadata | 12–13 px | 12–13 px | Regular |
| Eyebrow uppercase | 11–12 px | 11–12 px | Medium, letter-spacing luas |

**Aturan:**

- Serif digunakan untuk memberi karakter pada **heading**, bukan untuk seluruh label atau tabel.
- Gunakan italic secara selektif, misalnya pada kata *Rumah Modern*.
- Angka pemantauan menggunakan angka tabular agar pembaruan nilai tidak mengubah lebar tampilan.
- Hindari huruf kapital penuh kecuali eyebrow kecil.
- Di atas glass gelap, gunakan putih krem; di atas glass terang gunakan `ink`/`deep-olive`.

---

## 4. Glassmorphism dan Atmosfer

### 4.1 Latar visual

Gunakan **foto interior rumah modern yang blur lembut** sebagai latar, bukan ilustrasi teknologi abstrak. Karakternya: sofa beige, dinding warm-white, elemen kayu, tanaman hijau, jendela besar, lampu kuning hangat, dan cahaya natural. Hindari detail latar yang terlalu sibuk.

- **Desktop:** foto memenuhi layar di belakang seluruh dashboard, dengan overlay sage/cream untuk meredam kontras.
- **Mobile:** tekstur interior lebih samar; overlay lebih kuat supaya layar sempit tidak terasa ramai.
- Foto boleh tampak jelas di area kosong, tetapi harus **diredupkan atau diburamkan di belakang teks**.
- Jangan gunakan banyak ornamen; satu elemen botani halus sudah cukup.

### 4.2 Spesifikasi panel kaca

| Properti | Desktop | Mobile |
|---|---|---|
| Transparansi panel utama | Cream 28–45% | Cream 48–70% |
| Transparansi panel angka/teks kecil | Cream 65–85% | Cream 70–90% |
| Blur belakang | 18–28 px | 20–30 px |
| Border | Putih 35–55%, 1 px | Putih 45–65%, 1 px |
| Shadow | Bayangan olive tipis, radius besar | Lebih halus dan lebih rendah |
| Radius kartu utama | 22–26 px | 20–24 px |
| Radius inner-row | 14–18 px | 14–18 px |
| Radius chip/tombol | Pill / 999 px | Pill / 999 px |

### 4.3 Design tokens contoh (khusus gaya visual)

```css
:root {
  --gw-sage: #9caf88;
  --gw-cream: #f7f5ef;
  --gw-red: #e8412c;
  --gw-blue: #7fa8b8;
  --gw-yellow: #d7b36a;
  --gw-forest: #526b42;
  --gw-ink: #242821;
  --gw-muted: #5e655a;

  --gw-glass: rgba(247, 245, 239, 0.38);
  --gw-glass-strong: rgba(247, 245, 239, 0.76);
  --gw-glass-border: rgba(255, 255, 255, 0.48);
  --gw-glass-shadow: 0 16px 44px rgba(39, 49, 33, 0.12);

  --gw-card-radius: 24px;
  --gw-inner-radius: 16px;
  --gw-pill-radius: 999px;
}

.glass-card {
  background: var(--gw-glass);
  border: 1px solid var(--gw-glass-border);
  border-radius: var(--gw-card-radius);
  box-shadow: var(--gw-glass-shadow);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

/* Permukaan lebih solid untuk teks kecil, tabel, dan kontrol. */
.glass-card--readable {
  background: var(--gw-glass-strong);
}
```

> Glassmorphism tidak berarti semua kartu harus setransparan mungkin. **Keterbacaan tetap lebih penting daripada efek blur.**

### 4.4 Spacing dan detail

- Grid spacing: kelipatan **4 px**; jarak favorit **8 / 12 / 16 / 20 / 24 / 32 px**.
- Padding kartu: **24–28 px desktop**, **16–20 px mobile**.
- Gap antarkartu: **16–22 px desktop**, **12–16 px mobile**.
- Ikon: outline halus, rounded, ukuran **18–22 px**; ikon KPI dapat **24–30 px**.
- Hindari garis pembatas tebal, gradient mencolok, glow neon, dan shadow hitam pekat.

---

## 5. Dashboard Desktop

### 5.1 Struktur utama

Komposisi desktop mengikuti referensi: **sidebar kiri**, **header editorial**, **empat kartu KPI**, **grafik daya + panel kontrol**, dan **tiga kartu informasi tambahan**.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR        │ DASHBOARD / Halo, Rumah Modern              [Tanggal] [🔔] │
│                │ Pantau penggunaan energi rumah ...             [Profil]     │
│  GridWatch     ├─────────────────────────────────────────────────────────────┤
│  Dashboard     │ [Total Daya] [Energi Hari Ini] [Estimasi] [Kanal Aktif]   │
│  Perangkat     ├─────────────────────────────────────────────────────────────┤
│  Riwayat       │ [   Grafik Penggunaan Daya   ] [    Kontrol Kanal     ]   │
│  Peringatan    │ [                       ] [ 1, 2, 3, 4         ]          │
│  Pengaturan    ├─────────────────────────────────────────────────────────────┤
│                │ [Distribusi]   [Tren Energi]   [Aktivitas Terakhir]        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Proporsi:** sidebar sekitar **232–252 px**; area dashboard memakai sisa lebar dengan padding horizontal **28–36 px**. Lebar konten ideal agar tidak terlalu renggang pada monitor besar: sekitar **1440 px**.

### 5.2 Sidebar desktop

- Frosted olive panel, agak lebih gelap dibanding kartu konten.
- Logo daun sederhana + `GridWatch` dalam serif putih krem.
- Navigasi: `Dashboard`, `Perangkat`, `Riwayat`, `Peringatan`, `Pengaturan`.
- Menu aktif: pill warna cream, teks forest/deep olive, ikon berwarna olive.
- Menu tidak aktif: teks putih krem dengan kontras memadai.
- Item menu: tinggi **48–52 px**, jarak vertikal lapang.
- Boleh ada dekorasi botani atau ilustrasi rumah kecil di bagian bawah; **jangan menggeser fokus dari navigasi**.

### 5.3 Header dashboard

Di sebelah kiri:

- Eyebrow: `DASHBOARD` dengan huruf kecil kapital renggang.
- Heading utama: `Halo, Rumah Modern 👋` — kata *Rumah Modern* dapat italic serif.
- Subtitle: `Pantau penggunaan energi rumah Anda secara real-time.`

Di sebelah kanan:

- Pill pemilih tanggal/periode, ikon lonceng, avatar bundar.
- Elemen header memiliki permukaan glass lebih tipis daripada KPI.
- Jangan memenuhi header dengan terlalu banyak filter.

### 5.4 Empat KPI utama

Urutan yang disarankan:

| Kartu | Judul | Aksen | Detail visual |
|---|---|---|---|
| 1 | **Total Daya** | Sage green | Ikon kilat dan angka berunit `W` |
| 2 | **Energi Hari Ini** | Info blue | Ikon layers/energi dan angka `kWh` |
| 3 | **Estimasi Biaya** | Warm yellow | Ikon daun/uang dan angka `Rp` |
| 4 | **Kanal Aktif** | Sage green | Ikon steker dan angka `3 / 4` (contoh) |

**Anatomi kartu:** icon badge bundar → label pendek → angka besar → keterangan kecil atau chip perubahan. Hindari lebih dari 2–3 baris informasi per kartu.

- Tinggi kartu desktop: sekitar **126–148 px**.
- Angka menggunakan warna terang pada kaca gelap; bila kartu menjadi cream opaque, gunakan teks gelap.
- Chip tren **biru** untuk informasi netral, **hijau** untuk perbaikan yang kontekstual, **kuning** untuk perhatian ringan; jangan otomatis memberi warna merah pada kenaikan angka biasa.

### 5.5 Grafik utama — `Penggunaan Daya (W)`

- Menjadi titik fokus layar, mengambil sekitar **60–64%** baris konten utama.
- Judul serif putih krem atau dark olive bergantung opasitas panel.
- Segmented pill: `Hari Ini`, `7 Hari`, `30 Hari` di sudut kanan atas.
- Line chart menggunakan **forest `#526B42`** dengan area fill sage transparan.
- Grid horizontal sangat halus, tanpa garis vertikal dominan.
- Tooltip glass/cream yang kecil, rounded, dan memiliki penunjuk titik pada kurva.
- Label sumbu ringkas, tipografi sans 12–13 px, satuan jelas.
- Tinggi isi grafik yang nyaman: **210–260 px**, tidak perlu memenuhi seluruh halaman.
- Jangan menumpuk legend jika tidak ada seri pembanding.

### 5.6 Kontrol kanal

Panel di kanan grafik, sekitar **36–40%** lebar baris tersebut.

- Judul: `Kontrol Kanal` dengan ikon layers/steker.
- Tautan kecil: `Kelola Semua` dengan panah kanan.
- Empat row lembut untuk `Kanal 1–4`; setiap row memuat ikon, nama perangkat, daya dan switch.
- Contoh nama perangkat: `Ruang Keluarga`, `Ruang Kerja`, `Kamar Tidur`, `Taman`.
- Row: cream transparan lebih solid daripada panel induk; tinggi sekitar **48–58 px**.
- **ON:** track sage/forest dengan knob putih di kanan. **OFF:** track neutral dengan knob putih di kiri.
- Warna kuning untuk status butuh perhatian; merah hanya untuk kondisi kritis.

### 5.7 Tiga kartu sekunder

Disusun **tiga kolom** pada layar desktop lebar:

**A. Distribusi Penggunaan**

- Donut chart di kiri dan legend di kanan.
- Segment menggunakan sage, muted blue, golden yellow dan tone hijau lebih muda.
- Nilai pusat dapat menunjukkan total daya; angka persentase per kanal sejajar rapi.

**B. Tren Energi**

- Angka energi besar di kiri dan mini bar chart di kanan.
- Satu chip tren berwarna hijau atau biru, sesuai konteks teks.
- Pertahankan banyak ruang kosong; jangan mengulang grafik utama dengan detail berlebihan.

**C. Aktivitas Terakhir**

- Daftar tiga aktivitas terbaru.
- Ikon/titik warna status, pesan satu baris, waktu di kanan.
- Row mempunyai permukaan cream tipis dan divider halus.
- Tautan `Lihat Semua` ukuran kecil di header.

---

## 6. Dashboard Mobile

Mobile bukan desktop yang diperkecil. Konten harus disusun **secara vertikal dengan prioritas paling penting di bagian atas**.

### 6.1 Susunan halaman

```text
┌──────────────────────────────┐
│ 09:41                 ◔  ▰   │
│ 🍃 GridWatch           🔔 ◯ │
│ Halo, Rumah Modern 👋        │
│ Pantau penggunaan energi ... │
│ [ Kam, 26 Nov 2026     ▾ ]   │
│ ┌────────────┐ ┌───────────┐ │
│ │Total Daya  │ │Energi Hari│ │
│ └────────────┘ └───────────┘ │
│ ┌────────────┐ ┌───────────┐ │
│ │Estimasi    │ │Kanal Aktif│ │
│ └────────────┘ └───────────┘ │
│ ┌──────────────────────────┐ │
│ │ Penggunaan Daya (W)      │ │
│ │ [Hari Ini] [7] [30]      │ │
│ │         Line Chart       │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Kontrol Kanal            │ │
│ │ Kanal 1             ◉ ON │ │
│ │ Kanal 2             ◉ ON │ │
│ │ Kanal 3             ◉ ON │ │
│ │ Kanal 4           ◯ OFF  │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Distribusi Penggunaan    │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Aktivitas Terakhir       │ │
│ └──────────────────────────┘ │
│ [Home] [Device] [...]       │
└──────────────────────────────┘
```

> Sketsa menunjukkan **urutan konten saat di-scroll**, bukan bahwa seluruh section harus masuk dalam satu viewport.

### 6.2 Header mobile

- Logo daun + wordmark `GridWatch` di kiri; lonceng dan avatar di kanan.
- Heading menyambut pengguna ditampilkan dengan serif **28–34 px**.
- Subtitle cukup satu atau dua baris.
- Pill tanggal di bawah subtitle, bukan memaksa semua filter sejajar di satu baris.
- Padding samping halaman **16–20 px**.

### 6.3 KPI grid 2×2

- Dua kartu per baris untuk `Total Daya`, `Energi Hari Ini`, `Estimasi Biaya`, `Kanal Aktif`.
- Gap **10–12 px**; tinggi kartu sekitar **116–136 px**.
- Badge ikon kecil di kiri atas, label dan nilai di bawah; tren kecil opsional di kanan bawah.
- Angka tidak boleh terpotong. Jika layar sempit, ringkas label dan kecilkan angka **sedikit**, bukan mengecilkan seluruh kartu ekstrem.
- Pada lebar sangat kecil (mis. **320 px**), tetap 2 kolom bila teks aman; jika tidak, gunakan satu kolom.

### 6.4 Grafik mobile

- Panel penuh lebar di bawah KPI; tinggi keseluruhan sekitar **270–330 px**.
- Judul di kiri, segmented-control kecil di kanan atau baris kedua.
- Chart tanpa garis sumbu berlebihan; tampilkan lebih sedikit tick jam agar tidak bertabrakan.
- Tooltip tidak boleh keluar dari sisi layar.
- Warna grafik dan area fill sama persis dengan desktop.

### 6.5 Panel kontrol kanal mobile

- Satu panel full-width dengan **empat row vertikal**.
- Ukuran row **52–62 px**, tiap switch mudah disentuh.
- Struktur: ikon kecil → nama singkat → daya → switch.
- Nama panjang boleh dipotong dengan ellipsis tetapi status dan switch tidak boleh terpotong.
- Tidak gunakan empat panel terpisah; lebih rapi satu container kaca dengan empat inner-row.

### 6.6 Section tambahan mobile

- **Distribusi Penggunaan** dan **Aktivitas Terakhir** menggunakan **satu kolom penuh**, bukan dipaksa dua kolom seperti referensi mockup yang sangat lebar.
- Donut dapat berada di atas dengan legend di bawah atau di samping bila ruang cukup.
- Aktivitas terbaru tampil maksimal beberapa baris yang mudah discan.
- Jika ditampilkan, kartu `Tren Energi` ditempatkan sesudah distribusi atau sebelum aktivitas; hindari duplikasi berlebihan.

### 6.7 Bottom navigation

- Glass bar floating, fixed/sticky di bawah viewport dengan margin kiri/kanan **12–16 px**.
- Lima tab: `Dashboard`, `Perangkat`, `Riwayat`, `Peringatan`, `Pengaturan`.
- Tab aktif memiliki background cream lebih solid, ikon forest, dan teks olive gelap.
- Tab lain menggunakan ikon outline dengan kontras memadai; notification dot boleh warm-yellow.
- Tinggi bar sekitar **72–82 px** di luar area safe-area.
- Konten halaman perlu **ruang kosong ekstra di bawah** agar kartu terakhir tidak tertutup navigasi.

---

## 7. Komponen Visual Bersama

### 7.1 Ikon

- Gaya ikon **outline rounded**, konsisten, stroke sekitar **1.75–2 px**.
- Hindari perpaduan ikon outline dan 3D dalam komponen yang sama.
- Ikon yang relevan: rumah, petir, layers, daun, steker, chart, jam, bel, pengaturan, kalender.
- Lingkaran latar ikon menggunakan tint sage/blue/yellow beropasitas rendah.

### 7.2 Tombol dan chip

| Elemen | Gaya |
|---|---|
| Primary | Sage/forest fill, teks cream, bentuk pill |
| Secondary | Glass transparan, border putih halus |
| Selected segmented option | Cream solid, teks gelap |
| Info chip | Soft-blue fill, teks biru gelap |
| Insight chip | Soft-yellow fill, teks olive/amber gelap |
| Success chip | Soft-sage fill, teks forest |
| Error chip | Soft-red fill, teks merah gelap |

### 7.3 Toggle

- Switch panjang kira-kira **46–52 px**, tinggi **26–30 px**.
- ON hijau sage dan knob putih kanan; OFF abu hangat dan knob putih kiri.
- Di keadaan sedang diproses, gunakan visual loading halus dan buat interaksi tidak ambigu.
- **Jangan mengandalkan warna saja:** posisi knob dan label/status harus tetap menjelaskan keadaan.

### 7.4 Tabel/list aktivitas

- Gunakan row card transparan dengan garis pemisah halus.
- Informasi terpenting di kiri; waktu atau nilai tambahan rata kanan.
- Maksimalkan whitespace. Hindari tabel grid penuh pada halaman overview.

### 7.5 Grafik dan visualisasi

- Line utama: `forest #526B42`; fill sage transparan sekitar 10–22%.
- Pembanding: `info-blue #7FA8B8` dalam bentuk garis putus-putus.
- Donut: sage, biru, kuning dan warna sage lebih muda.
- Semua grafik menggunakan tooltip cream/glass dengan border ringan.
- Garis grid sangat lembut dan label satuan tetap terlihat.

---

## 8. Status Tampilan dan Feedback Visual

Bagian ini hanya mendefinisikan **bagaimana kondisi terlihat**, bukan bagaimana data diproses.

| Kondisi visual | Perlakuan desain |
|---|---|
| Normal / Online | Titik sage + label singkat |
| Informasi | Chip/boks soft-blue dengan ikon info |
| Insight / perhatian ringan | Chip/boks soft-yellow dengan ikon lembut |
| Error / kritis | Soft-red + ikon alert; gunakan seperlunya |
| Kanal OFF | Toggle abu netral, label/status nonaktif |
| Loading | Skeleton card ringan, jangan satu layar penuh spinner |
| Data kosong | Ilustrasi ikon kecil + kalimat `Belum ada data untuk periode ini.` |
| Tidak terhubung | Banner netral/kuning dengan pesan jelas dan ikon koneksi |
| Tombol tidak tersedia | Opasitas menurun, tetapi label tetap terbaca |

### Motion dan micro-interaction

- Hover/press: transisi **160–220 ms**, perubahan opacity dan sedikit elevasi.
- Toggle: perpindahan knob singkat, tanpa pantulan berlebihan.
- Grafik: animasi masuk satu kali yang lembut; hindari animasi terus-menerus.
- Panel kaca tidak perlu efek floating/gelombang berkala.
- Hormati pengguna yang memilih mengurangi motion.

---

## 9. Responsivitas dan Keterbacaan

| Lebar layar | Arahan layout |
|---|---|
| ≥ 1280 px | Sidebar penuh; KPI 4 kolom; chart + kontrol berdampingan; tiga kartu bawah |
| 1024–1279 px | Sidebar sedikit lebih ringkas; KPI tetap 4 kolom jika muat |
| 768–1023 px | Sidebar jadi ringkas/drawer; KPI 2×2; chart dan kontrol bisa bertumpuk |
| 360–767 px | Mobile penuh; 2×2 KPI; chart dan section bertumpuk; bottom nav |
| 320–359 px | Optimalkan label/angka; hindari overflow; satu kolom hanya jika diperlukan |

**Standar kualitas visual:**

- Tidak ada horizontal scrolling pada seluruh halaman.
- Elemen yang dapat disentuh memiliki area nyaman sekitar **44×44 px**.
- Teks utama dan label kecil tetap kontras terhadap glass dan foto.
- Panel glass memiliki fallback background lebih solid pada kondisi blur tidak tersedia.
- Focus state terlihat, misalnya outline forest atau blue yang lembut.
- Warna peringatan selalu dibantu ikon/teks.
- Panel tidak terlalu padat dan setiap section memiliki hierarchy yang jelas.

---

## 10. Checklist Persetujuan Desain

### Desktop

- [ ] Identitas GridWatch selaras dengan landing page: sage + cream, serif editorial, suasana rumah modern.
- [ ] Sidebar kaca olive dengan menu aktif berbentuk cream pill.
- [ ] Header lapang dengan greeting, tanggal, notifikasi dan profil.
- [ ] Empat kartu KPI seimbang dalam satu baris pada desktop lebar.
- [ ] Grafik utama menjadi fokus, kontrol kanal berada di sebelahnya.
- [ ] Distribusi, tren dan aktivitas membentuk baris informasi sekunder.
- [ ] Seluruh teks tetap terbaca di atas background interior.

### Mobile

- [ ] Branding dan greeting tetap kuat namun ringkas.
- [ ] KPI menggunakan grid 2×2 dengan angka yang tidak terpotong.
- [ ] Grafik utama full width dengan sumbu yang ringkas.
- [ ] Kontrol empat kanal tersusun vertikal dan mudah disentuh.
- [ ] Informasi sekunder tidak dipaksa masuk dalam dua kartu sempit.
- [ ] Floating bottom navigation terlihat jelas tanpa menutup konten.

### Konsistensi

- [ ] Hanya gunakan warna sesuai peran semantik yang ditentukan.
- [ ] Efek kaca konsisten tetapi tidak mengorbankan aksesibilitas.
- [ ] Font heading serif, font antarmuka sans, radius dan ikon seragam.
- [ ] Spacing lega dan tidak dipenuhi dekorasi nonfungsional.
- [ ] Tampilan desktop dan mobile terasa berasal dari satu design system.

---

## 11. Brief untuk UI Designer / AI Design Agent

> Desain **hanya halaman Dashboard GridWatch**, dalam **dua versi: desktop dan mobile**. Ikuti referensi `dashboard-desktop.png`, `dashboard-mobile.png`, dan identitas dari `landing-page.png`. Gunakan tema **cozy, elegant, modern, minimalist glassmorphism** dengan background interior rumah warm yang diburamkan, frosted-glass panels, sidebar olive di desktop, bottom navigation glass di mobile, heading **DM Serif Display**, dan teks UI **DM Sans**. Terapkan palet `#9CAF88` (sage), `#F7F5EF` (cream), `#E8412C` (error), `#7FA8B8` (informasi), `#D7B36A` (insight), dan warna pendukung forest. Dashboard mencakup greeting, empat KPI, grafik daya, kontrol empat kanal, distribusi penggunaan, tren energi, serta aktivitas terbaru. Prioritaskan layout yang lega, kontras yang baik, ikon outline konsisten, dan visual hierarchy yang jelas. **Jangan menambahkan halaman lain, fitur integrasi, arsitektur sistem, API, database, atau dokumentasi backend.**

---

**Batas dokumen:** Ini adalah panduan **visual design dashboard**. Urusan backend, jaringan, perangkat keras, penyimpanan data, dan integrasi tidak termasuk dalam cakupan.
