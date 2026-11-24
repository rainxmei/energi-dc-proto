// POST /api/ingest  -- dipanggil ESP32 (butuh header x-device-token).
// Menyimpan data ke Supabase dan MENGEMBALIKAN perintah terbaru,
// jadi satu permintaan HTTPS sudah cukup untuk kirim data + terima perintah.
import { buatHandler, json, samaPersis, sb, ambilPerintah } from '../lib/helpers.js';

const angka = (x) => (x === undefined || x === null || x === '' ? NaN : Number(x));

export default buatHandler(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_tidak_diizinkan' }, 405, { Allow: 'POST' });

  const token = request.headers.get('x-device-token') || '';
  if (!samaPersis(token, process.env.DEVICE_TOKEN)) return json({ error: 'tidak_diizinkan' }, 401);

  const mentah = await request.text();
  if (mentah.length > 4096) return json({ error: 'terlalu_besar' }, 413);

  let body;
  try {
    body = JSON.parse(mentah);
  } catch {
    return json({ error: 'json_tidak_valid' }, 400);
  }

  const kanal = Array.isArray(body.kanal) ? body.kanal : [];
  if (kanal.length < 1 || kanal.length > 4) return json({ error: 'kanal_tidak_valid' }, 400);

  const rows = [];
  for (const k of kanal) {
    const ch = angka(k.ch);
    const v = angka(k.v);
    const i = angka(k.i);
    const p = k.p === undefined ? v * i : angka(k.p);
    const wajar =
      Number.isInteger(ch) && ch >= 1 && ch <= 4 &&
      [v, i, p].every(Number.isFinite) &&
      Math.abs(v) <= 100 && Math.abs(i) <= 50 && Math.abs(p) <= 5000;
    if (!wajar) return json({ error: 'nilai_tidak_valid' }, 400);
    rows.push({ channel: ch, voltage_v: v, current_a: i, power_w: p });
  }

  const rssi = angka(body.rssi);
  const uptime = angka(body.uptime_s);

  const [, , perintah] = await Promise.all([
    sb('pengukuran', { method: 'POST', body: rows, prefer: 'return=minimal' }),
    sb('status_perangkat?on_conflict=id', {
      method: 'POST',
      body: {
        id: 1,
        last_seen: new Date().toISOString(),
        led_on: Boolean(body.led_on),
        rssi: Number.isFinite(rssi) ? Math.round(rssi) : null,
        uptime_s: Number.isFinite(uptime) ? Math.round(uptime) : null,
      },
      prefer: 'resolution=merge-duplicates,return=minimal',
    }),
    ambilPerintah(),
  ]);

  return json({ ok: true, perintah });
});
