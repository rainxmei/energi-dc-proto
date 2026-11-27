"""Uji lapisan Supabase di anomali.py memakai server PostgREST TIRUAN (bukan Supabase asli).
Menguji: paginasi, filter waktu, header apikey, latih dari Supabase, satu siklus run, upsert tabel anomali."""
import json, shutil, tempfile, threading, time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs

import numpy as np
import pandas as pd
import anomali as A

KUNCI = "sb_secret_mock"
DB = {"pengukuran": [], "anomali": {}}
LOG = []


class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def _cek(self):
        assert self.headers.get("apikey") == KUNCI, "apikey salah"
        assert self.headers.get("Authorization") is None, "kunci sb_ tidak boleh lewat Authorization"

    def _kirim(self, kode, data):
        b = json.dumps(data).encode()
        self.send_response(kode); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)

    def do_GET(self):
        self._cek()
        u = urlparse(self.path); q = {k: v[0] for k, v in parse_qs(u.query).items()}
        assert u.path == "/rest/v1/pengukuran"
        rows = DB["pengukuran"]
        if "created_at" in q:
            assert q["created_at"].startswith("gte.")
            batas = q["created_at"][4:]
            rows = [r for r in rows if r["created_at"] >= batas]
        desc = q.get("order") == "created_at.desc"
        rows = sorted(rows, key=lambda r: r["created_at"], reverse=desc)
        off, lim = int(q.get("offset", 0)), min(1000, int(q["limit"]))
        LOG.append(("GET", off, lim))
        self._kirim(200, rows[off:off + lim])

    def do_POST(self):
        self._cek()
        u = urlparse(self.path); q = {k: v[0] for k, v in parse_qs(u.query).items()}
        assert u.path == "/rest/v1/anomali" and q.get("on_conflict") == "channel"
        assert "merge-duplicates" in self.headers.get("Prefer", "")
        for r in json.loads(self.rfile.read(int(self.headers["Content-Length"]))):
            assert r["label"] in ("normal", "anomali")
            DB["anomali"][r["channel"]] = r
        self.send_response(201); self.send_header("Content-Length", "0"); self.end_headers()


def iso(t): return datetime.fromtimestamp(t, timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f+00:00")


def isi(df):
    DB["pengukuran"] = [{"created_at": iso(r.t), "channel": int(r.channel), "voltage_v": round(r.v, 3),
                         "current_a": round(r.i, 4), "power_w": round(r.p, 3)} for r in df.itertuples()]


srv = HTTPServer(("127.0.0.1", 0), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
sb = A.Supabase(f"http://127.0.0.1:{srv.server_port}", KUNCI)
A.MODEL_DIR = Path(tempfile.mkdtemp())
lulus = 0

def ok(nama): 
    global lulus; lulus += 1; print("ok  -", nama)

# 1) data 2 jam normal, berakhir "sekarang"
isi(A.buat_data_simulasi(2.0, seed=7, periode_mati=0))
df = sb.ambil_rentang(3)
assert len(df) == 4 * 2400, len(df)
assert sum(1 for g in LOG if g[0] == "GET") >= 10, "harus paginasi"
ok(f"ambil_rentang: {len(df)} baris lewat {len(LOG)} halaman")

# 2) latih dari Supabase
hasil = A.latih(df, A.CONTAMINATION, A.MIN_WINDOWS)
assert sorted(hasil) == [1, 2, 3, 4]
ok("latih dari data Supabase: 4 model tersimpan")

# 3) siklus run pada data normal terbaru -> semua normal, tertulis ke tabel anomali
model = A.muat_model()
isi(A.buat_data_simulasi(2.0, seed=7, periode_mati=0))   # segarkan: pelatihan memakan waktu, data lama jadi "basi"
sb_df = sb.ambil_terbaru(4 * (A.W + 16))
assert len(sb_df) == 4 * (A.W + 16)
baris = A.satu_siklus(sb, model, sb_df, dry=False)
assert len(baris) == 4 and set(DB["anomali"]) == {1, 2, 3, 4}
assert all(DB["anomali"][k]["label"] == "normal" for k in A.KANAL), DB["anomali"]
ok("run: data normal -> 4 kanal 'normal' tertulis (upsert)")

# 4) sisipkan lonjakan arus kanal 3 pada ~40 detik terakhir -> kanal 3 anomali, lainnya normal
df2 = A.buat_data_simulasi(2.0, seed=7, periode_mati=0)
df2 = A.suntik(df2, 3, "lonjakan", df2.t.max() - 45, 60)
isi(df2)
A.satu_siklus(sb, model, sb.ambil_terbaru(4 * (A.W + 16)), dry=False)
assert DB["anomali"][3]["label"] == "anomali", DB["anomali"][3]
assert all(DB["anomali"][k]["label"] == "normal" for k in (1, 2, 4))
ok("run: lonjakan di kanal 3 -> hanya kanal 3 'anomali'")

# 5) dry-run tidak menulis
DB["anomali"].clear()
A.satu_siklus(sb, model, sb.ambil_terbaru(4 * (A.W + 16)), dry=True)
assert DB["anomali"] == {}
ok("dry-run: tidak menulis ke Supabase")

# 6) data basi -> dilewati (tidak menimpa hasil lama dengan tebakan)
isi(A.buat_data_simulasi(0.5, seed=8, periode_mati=0, t_akhir=time.time() - 600))
assert A.satu_siklus(sb, model, sb.ambil_terbaru(160), dry=False) == []
ok("data basi (10 menit lalu) -> tidak ada yang ditulis")

# 7) CSV: format export dan format unduhan dashboard sama-sama terbaca
tmp = Path(tempfile.mkdtemp())
wide = pd.DataFrame({"waktu": [iso(1_700_000_000 + 3 * n).replace("+00:00", "Z") for n in range(30)]})
for k in A.KANAL:
    wide[f"v{k}_V"] = 12.0; wide[f"i{k}_A"] = 0.1 * k; wide[f"p{k}_W"] = 1.2 * k
wide["total_W"] = 12.0; wide["status"] = "Normal"
wide.to_csv(tmp / "dash.csv", index=False)
d = A.muat_csv(str(tmp / "dash.csv"))
assert len(d) == 120 and set(d.channel) == {1, 2, 3, 4} and abs(d[d.channel == 3].i.iloc[0] - 0.3) < 1e-9
ok("muat_csv: format unduhan dashboard terbaca (120 baris)")

srv.shutdown(); shutil.rmtree(A.MODEL_DIR, ignore_errors=True)
print(f"\nSemua {lulus} tes lulus.")
