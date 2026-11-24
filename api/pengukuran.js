// GET /api/pengukuran  -- publik, hanya baca. Dipakai dashboard.
import { buatHandler, json, sb, ambilPerintah } from '../lib/helpers.js';

const BATAS_ONLINE_MS = 15000; // dianggap offline kalau >15 detik tidak mengirim

export default buatHandler(async (request) => {
  if (request.method !== 'GET') return json({ error: 'method_tidak_diizinkan' }, 405, { Allow: 'GET' });

  const url = new URL(request.url);
  const limit = Math.min(1000, Math.max(4, Number(url.searchParams.get('limit')) || 240));

  const [data, statusRows, perintah] = await Promise.all([
    sb(`pengukuran?select=created_at,channel,voltage_v,current_a,power_w&order=created_at.desc&limit=${limit}`),
    sb('status_perangkat?select=last_seen,led_on,rssi,uptime_s&id=eq.1'),
    ambilPerintah(),
  ]);

  const status = statusRows[0] || null;
  const online = Boolean(status) && Date.now() - Date.parse(status.last_seen) < BATAS_ONLINE_MS;

  return json({
    server_time: new Date().toISOString(),
    status: status ? { ...status, online } : { online: false },
    perintah,
    data: data.reverse(), // urut dari lama ke baru
  });
}, ['SUPABASE_URL', 'SUPABASE_SECRET_KEY']);
