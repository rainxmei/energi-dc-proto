#!/usr/bin/env python3
"""
Deteksi anomali beban DC (Isolation Forest) untuk proyek Monitor Energi DC.

Alur:
  data Supabase (tabel pengukuran)  ->  fitur per jendela ~30 detik  ->  Isolation Forest per kanal
  ->  label 'normal' / 'anomali' ditulis ke tabel anomali  ->  tampil di kartu kanal dashboard.

Perintah:
  python anomali.py sim                 # uji pipeline dengan data tiruan, tanpa Supabase
  python anomali.py export --jam 24     # simpan data Supabase ke CSV (untuk dilihat / dilatih ulang)
  python anomali.py train  --jam 24     # latih model dari data normal di Supabase (atau --csv berkas.csv)
  python anomali.py run                 # loop: nilai data terbaru, tulis hasil ke Supabase
  python anomali.py run --dry --once    # sekali jalan, hanya cetak (tidak menulis ke Supabase)

Penting: latih HANYA dengan data saat beban bekerja normal. Model belajar "apa yang biasa",
jadi apa pun yang berbeda dari data latih akan ditandai anomali.
"""
from __future__ import annotations

import argparse
import math
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import requests
from sklearn.ensemble import IsolationForest

KANAL = [1, 2, 3, 4]
W = 10                 # sampel per jendela (10 x 3 detik = 30 detik)
MAX_GAP_S = 20         # jeda maksimum antar sampel dalam satu jendela (kalau lebih, jendela dibuang)
IDLE_A = 0.02          # jendela yang memuat arus <= ini dianggap beban mati / sedang dinyalakan-dimatikan (tidak dinilai)
CONTAMINATION = 0.005  # perkiraan porsi jendela "aneh" di data latih
MIN_WINDOWS = 200      # minimum jendela latih per kanal
STALE_S = 30           # data terbaru lebih tua dari ini -> hasil tidak ditulis
MODEL_DIR = Path(__file__).resolve().parent / "model"
Z_BATAS = 6.0          # aturan 1: rata-rata arus/tegangan menyimpang > 6 "simpangan kokoh" dari kebiasaan
FLOOR_I_REL, FLOOR_I_ABS, FLOOR_V_ABS = 0.05, 0.02, 0.10   # skala minimum agar fluktuasi kecil tak dianggap gangguan
Z_KOLOM = [0, 4, 1, 7]  # i_rata, v_rata (dua arah) | i_std, di_maks (hanya kenaikan)
FITUR = ["i_rata", "i_std", "i_maks", "i_min", "v_rata", "v_std", "p_rata", "di_maks"]


# --------------------------------------------------------------------------- Supabase
def muat_env() -> None:
    for folder in (Path.cwd(), Path(__file__).resolve().parent):
        f = folder / ".env"
        if not f.exists():
            continue
        for baris in f.read_text(encoding="utf-8").splitlines():
            baris = baris.strip()
            if not baris or baris.startswith("#") or "=" not in baris:
                continue
            k, v = baris.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip("'\""))


class Supabase:
    def __init__(self, url: str, kunci: str, timeout: float = 15.0):
        self.base = url.rstrip("/") + "/rest/v1/"
        self.timeout = timeout
        self.h = {"apikey": kunci}
        if not kunci.startswith("sb_"):          # kunci lama (JWT) juga perlu Authorization
            self.h["Authorization"] = "Bearer " + kunci

    @classmethod
    def dari_env(cls) -> "Supabase":
        muat_env()
        url, kunci = os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SECRET_KEY")
        if not url or not kunci:
            sys.exit("SUPABASE_URL dan SUPABASE_SECRET_KEY belum diisi. Salin .env.example menjadi .env lalu isi.")
        return cls(url, kunci)

    def _get(self, tabel: str, params: dict) -> list:
        r = requests.get(self.base + tabel, params=params, headers=self.h, timeout=self.timeout)
        if r.status_code >= 400:
            raise RuntimeError(f"GET {tabel} gagal: HTTP {r.status_code} {r.text[:200]}")
        return r.json()

    def ambil_rentang(self, jam: float, maks_baris: int = 400_000) -> pd.DataFrame:
        sejak = (datetime.now(timezone.utc) - timedelta(hours=jam)).strftime("%Y-%m-%dT%H:%M:%SZ")
        semua, offset = [], 0
        while offset < maks_baris:
            rows = self._get("pengukuran", {
                "select": "created_at,channel,voltage_v,current_a,power_w",
                "created_at": "gte." + sejak, "order": "created_at.asc",
                "limit": 1000, "offset": offset})
            semua += rows
            if len(rows) < 1000:
                break
            offset += 1000
            if offset % 20000 == 0:
                print(f"  ... {offset} baris")
        return rapikan(pd.DataFrame(semua))

    def ambil_terbaru(self, n: int) -> pd.DataFrame:
        rows = self._get("pengukuran", {
            "select": "created_at,channel,voltage_v,current_a,power_w",
            "order": "created_at.desc", "limit": n})
        return rapikan(pd.DataFrame(rows[::-1]))

    def tulis_anomali(self, baris: list[dict]) -> None:
        h = dict(self.h, **{"Content-Type": "application/json",
                            "Prefer": "resolution=merge-duplicates,return=minimal"})
        r = requests.post(self.base + "anomali", params={"on_conflict": "channel"},
                          json=baris, headers=h, timeout=self.timeout)
        if r.status_code >= 400:
            hint = " (sudah menjalankan supabase/tambah_anomali.sql?)" if r.status_code == 404 else ""
            raise RuntimeError(f"POST anomali gagal: HTTP {r.status_code} {r.text[:200]}{hint}")


def rapikan(df: pd.DataFrame) -> pd.DataFrame:
    """Ubah ke kolom: t (detik epoch), channel, v, i, p."""
    if df.empty:
        return pd.DataFrame(columns=["t", "channel", "v", "i", "p"])
    waktu = pd.to_datetime(df["created_at"], utc=True, format="ISO8601")
    detik = (waktu - pd.Timestamp("1970-01-01", tz="UTC")).dt.total_seconds()   # tak bergantung resolusi ns/us
    out = pd.DataFrame({
        "t": detik,
        "channel": df["channel"].astype(int),
        "v": df["voltage_v"].astype(float), "i": df["current_a"].astype(float), "p": df["power_w"].astype(float)})
    return out.sort_values(["channel", "t"]).reset_index(drop=True)


def muat_csv(path: str) -> pd.DataFrame:
    """Terima CSV hasil `export` (format panjang) atau CSV dari halaman Riwayat Log dashboard (format lebar)."""
    df = pd.read_csv(path)
    if "channel" in df.columns:
        return rapikan(df)
    if "waktu" in df.columns:
        t = pd.to_datetime(df["waktu"], utc=True, format="ISO8601")
        potongan = []
        for k in KANAL:
            potongan.append(pd.DataFrame({"created_at": t, "channel": k, "voltage_v": df[f"v{k}_V"],
                                          "current_a": df[f"i{k}_A"], "power_w": df[f"p{k}_W"]}).dropna())
        return rapikan(pd.concat(potongan, ignore_index=True))
    sys.exit("Format CSV tidak dikenali. Pakai hasil `export` atau unduhan dari halaman Riwayat Log.")


# --------------------------------------------------------------------------- fitur & model
def jendela(sub: pd.DataFrame):
    """Hitung fitur tiap jendela W sampel. Mengembalikan (X, waktu_akhir)."""
    n = len(sub)
    if n < W:
        return np.empty((0, len(FITUR))), np.empty(0)
    t, v, i, p = (sub[c].to_numpy() for c in ("t", "v", "i", "p"))
    sw = np.lib.stride_tricks.sliding_window_view
    ti, vi, ii, pi = (sw(a, W) for a in (t, v, i, p))
    ok = (ti[:, -1] - ti[:, 0]) <= (W - 1) * MAX_GAP_S
    di = np.abs(np.diff(ii, axis=1)).max(axis=1)
    X = np.column_stack([ii.mean(1), ii.std(1), ii.max(1), ii.min(1), vi.mean(1), vi.std(1), pi.mean(1), di])
    return X[ok], ti[ok, -1]


def latih(df: pd.DataFrame, contamination: float, min_windows: int) -> dict:
    MODEL_DIR.mkdir(exist_ok=True)
    hasil = {}
    for k in KANAL:
        X, _ = jendela(df[df.channel == k])
        aktif = X[X[:, 3] > IDLE_A] if len(X) else X   # kolom 3 = arus minimum jendela
        if len(aktif) < min_windows:
            print(f"  Kanal {k}: hanya {len(aktif)} jendela aktif (butuh {min_windows}). Dilewati. "
                  f"Kumpulkan lebih banyak data saat beban menyala.")
            continue
        model = IsolationForest(n_estimators=200, contamination=contamination, random_state=42).fit(aktif)
        s = model.decision_function(aktif)
        med = np.median(aktif[:, Z_KOLOM], axis=0)
        mad = np.median(np.abs(aktif[:, Z_KOLOM] - med), axis=0) * 1.4826
        f_i = max(FLOOR_I_REL * med[0], FLOOR_I_ABS)
        skala = np.maximum(mad, [f_i, FLOOR_V_ABS, f_i, f_i])
        joblib.dump({"model": model, "fitur": FITUR, "W": W, "n": len(aktif), "med": med, "skala": skala},
                    MODEL_DIR / f"kanal{k}.joblib")
        hasil[k] = len(aktif)
        print(f"  Kanal {k}: {len(aktif)} jendela aktif | arus rata-rata {aktif[:, 0].mean():.3f} A | "
              f"skor latih p1={np.percentile(s, 1):+.3f} median={np.median(s):+.3f}")
    return hasil


def muat_model() -> dict:
    out = {}
    for k in KANAL:
        f = MODEL_DIR / f"kanal{k}.joblib"
        if f.exists():
            out[k] = joblib.load(f)
    return out


def nilai_kanal(pack: dict, sub: pd.DataFrame):
    """Nilai semua jendela satu kanal. 'label' memakai aturan 2 dari 3 jendela berturut-turut."""
    X, t_akhir = jendela(sub)
    if len(X) == 0:
        return None
    idle = X[:, 3] <= IDLE_A
    mentah = np.zeros(len(X), dtype=bool)
    skor = np.full(len(X), np.nan)
    if (~idle).any():
        m = pack["model"]
        skor[~idle] = m.decision_function(X[~idle])
        mentah[~idle] = m.predict(X[~idle]) == -1
        if "med" in pack:      # aturan 1: pergeseran arus/tegangan atau arus yang tiba-tiba bergejolak
            z = (X[:, Z_KOLOM] - pack["med"]) / pack["skala"]
            z[:, :2] = np.abs(z[:, :2])
            mentah |= (z > Z_BATAS).any(axis=1) & ~idle
    label = np.convolve(mentah.astype(int), np.ones(3, dtype=int))[: len(mentah)] >= 2
    return {"t": t_akhir, "idle": idle, "skor": skor, "mentah": mentah, "label": label, "X": X}


# --------------------------------------------------------------------------- simulasi
BASE_I = [0.16, 0.31, 0.46, 0.62]


def buat_data_simulasi(jam: float = 2.0, seed: int = 0, interval: float = 3.0, t_akhir: float | None = None, periode_mati: int = 2) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = int(jam * 3600 / interval)
    t_akhir = time.time() if t_akhir is None else t_akhir
    t = t_akhir - (n - 1 - np.arange(n)) * interval
    potong = []
    for idx, k in enumerate(KANAL):
        base, no = BASE_I[idx], np.arange(n)
        arus = base * (1 + 0.05 * np.sin(2 * np.pi * no * interval / (900 + 130 * idx))) + rng.normal(0, 0.02 * base, n)
        for _ in range(periode_mati):                     # periode beban mati (5 menit)
            a = int(rng.integers(0, max(1, n - 100)))
            arus[a:a + 100] = 0.004
        volt = 12.1 - 0.2 * arus + 0.05 * np.sin(2 * np.pi * no * interval / 1300) + rng.normal(0, 0.03, n)
        potong.append(pd.DataFrame({"t": t, "channel": k, "v": volt, "i": arus, "p": volt * arus}))
    return pd.concat(potong, ignore_index=True)


def suntik(df: pd.DataFrame, k: int, jenis: str, t0: float, dur: float) -> pd.DataFrame:
    """Sisipkan gangguan buatan pada kanal k selama dur detik mulai t0."""
    d = df.copy()
    m = (d.channel == k) & (d.t >= t0) & (d.t < t0 + dur)
    if jenis == "lonjakan":                               # arus melonjak 2,2x
        d.loc[m, "i"] *= 2.2
    elif jenis == "drop_tegangan":                        # tegangan jatuh 1,5 V
        d.loc[m, "v"] -= 1.5
    elif jenis == "berosilasi":                           # arus naik-turun cepat +-50%
        n = int(m.sum())
        d.loc[m, "i"] *= np.where(np.arange(n) % 2 == 0, 1.5, 0.5)
    elif jenis == "arus_turun":                           # beban separuh rusak: arus tinggal 40%
        d.loc[m, "i"] *= 0.4
    d["p"] = d["v"] * d["i"]
    return d


def jalankan_sim(jam: float, seed: int) -> None:
    print(f"[sim] Membuat data latih {jam:g} jam dan data uji 1 jam (tiruan)...")
    latih_df = buat_data_simulasi(jam, seed)
    global MODEL_DIR
    MODEL_DIR = Path(os.environ.get("MODEL_DIR_SIM", MODEL_DIR.parent / "model_sim"))
    latih(latih_df, CONTAMINATION, MIN_WINDOWS)
    model = muat_model()
    uji = buat_data_simulasi(1.0, seed + 100, periode_mati=0)   # tanpa periode mati agar tiap gangguan teruji
    t_awal = uji.t.min()
    kejadian = [("lonjakan", 1, 600), ("drop_tegangan", 2, 1000), ("berosilasi", 3, 1400), ("arus_turun", 4, 1800),
                ("lonjakan", 3, 2200), ("drop_tegangan", 4, 2600)]
    durasi = 60.0
    for jenis, k, offs in kejadian:
        uji = suntik(uji, k, jenis, t_awal + offs, durasi)
    print("\n[sim] Hasil pada data uji (gangguan 60 detik, aturan 2-dari-3 jendela):")
    print(f"  {'gangguan':<14}{'kanal':>6}{'terdeteksi':>12}{'tunda':>9}")
    terdeteksi = 0
    for jenis, k, offs in kejadian:
        r = nilai_kanal(model[k], uji[uji.channel == k].sort_values("t"))
        t0 = t_awal + offs
        dalam = (r["t"] >= t0) & (r["t"] < t0 + durasi + 30) & r["label"]
        ada = bool(dalam.any())
        terdeteksi += ada
        tunda = f"{r['t'][dalam][0] - t0:.0f} d" if ada else "-"
        print(f"  {jenis:<14}{k:>6}{'ya' if ada else 'TIDAK':>12}{tunda:>9}")
    # positif palsu: data normal tanpa gangguan
    normal = buat_data_simulasi(1.0, seed + 200)
    total = fp = 0
    for k in KANAL:
        r = nilai_kanal(model[k], normal[normal.channel == k].sort_values("t"))
        aktif = ~r["idle"]
        total += int(aktif.sum())
        fp += int((r["label"] & aktif).sum())
    print(f"\n  Terdeteksi: {terdeteksi}/{len(kejadian)} gangguan")
    print(f"  Positif palsu pada data normal: {fp}/{total} jendela ({100 * fp / max(total, 1):.2f}%)")


# --------------------------------------------------------------------------- loop utama
def satu_siklus(sb: Supabase | None, model: dict, df: pd.DataFrame, dry: bool) -> list[dict]:
    sekarang = time.time()
    baris, laporan = [], []
    ts = datetime.now(timezone.utc).isoformat()
    for k in KANAL:
        if k not in model:
            continue
        sub = df[df.channel == k].sort_values("t")
        if sub.empty or sekarang - sub.t.iloc[-1] > STALE_S:
            laporan.append(f"K{k}: data basi, dilewati")
            continue
        r = nilai_kanal(model[k], sub.tail(W + 12))
        if r is None:
            laporan.append(f"K{k}: data belum cukup")
            continue
        label = "anomali" if bool(r["label"][-1]) else "normal"
        s = r["skor"][-1]
        skor = None if (isinstance(s, float) and math.isnan(s)) else float(s)
        laporan.append(f"K{k}: {label:<8} skor={'idle' if skor is None else f'{skor:+.3f}'} i={r['X'][-1][0]:.3f}A")
        baris.append({"channel": k, "label": label, "skor": skor, "updated_at": ts})
    print(time.strftime("%H:%M:%S"), " | ".join(laporan) if laporan else "tidak ada data")
    if baris and not dry and sb is not None:
        sb.tulis_anomali(baris)
    return baris


def jalankan_run(interval: float, dry: bool, sekali: bool) -> None:
    model = muat_model()
    if not model:
        sys.exit("Belum ada model. Jalankan dulu: python anomali.py train --jam 24")
    sb = Supabase.dari_env()
    print(f"Model dimuat untuk kanal {sorted(model)}. Interval {interval:g} d. {'(dry-run, tidak menulis)' if dry else ''}")
    while True:
        try:
            satu_siklus(sb, model, sb.ambil_terbaru(len(KANAL) * (W + 16)), dry)
        except (requests.RequestException, RuntimeError) as e:
            print("Gagal siklus:", e)
        if sekali:
            return
        time.sleep(interval)


def main() -> None:
    ap = argparse.ArgumentParser(description="Deteksi anomali beban DC (Isolation Forest)")
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("sim", help="uji pipeline dengan data tiruan")
    s.add_argument("--jam", type=float, default=2.0)
    s.add_argument("--seed", type=int, default=1)
    e = sub.add_parser("export", help="simpan data Supabase ke CSV")
    e.add_argument("--jam", type=float, default=24)
    e.add_argument("--out", default="data.csv")
    t = sub.add_parser("train", help="latih model")
    t.add_argument("--jam", type=float, default=24, help="ambil data N jam terakhir dari Supabase")
    t.add_argument("--csv", help="latih dari CSV, bukan dari Supabase")
    t.add_argument("--contamination", type=float, default=CONTAMINATION)
    t.add_argument("--min-windows", type=int, default=MIN_WINDOWS)
    r = sub.add_parser("run", help="nilai data terbaru terus-menerus")
    r.add_argument("--interval", type=float, default=5.0)
    r.add_argument("--dry", action="store_true", help="jangan menulis ke Supabase")
    r.add_argument("--once", action="store_true", help="satu siklus lalu berhenti")
    a = ap.parse_args()

    if a.cmd == "sim":
        jalankan_sim(a.jam, a.seed)
    elif a.cmd == "export":
        df = Supabase.dari_env().ambil_rentang(a.jam)
        df.assign(created_at=pd.to_datetime(df.t, unit="s", utc=True).dt.strftime("%Y-%m-%dT%H:%M:%S.%fZ")) \
          .rename(columns={"v": "voltage_v", "i": "current_a", "p": "power_w"}) \
          [["created_at", "channel", "voltage_v", "current_a", "power_w"]].to_csv(a.out, index=False)
        print(f"{len(df)} baris disimpan ke {a.out}")
    elif a.cmd == "train":
        df = muat_csv(a.csv) if a.csv else Supabase.dari_env().ambil_rentang(a.jam)
        print(f"{len(df)} baris data dimuat.")
        if not latih(df, a.contamination, a.min_windows):
            sys.exit("Tidak ada model yang terlatih.")
        print(f"Model disimpan di {MODEL_DIR}")
    elif a.cmd == "run":
        try:
            jalankan_run(a.interval, a.dry, a.once)
        except KeyboardInterrupt:
            print("\nBerhenti.")


if __name__ == "__main__":
    main()
