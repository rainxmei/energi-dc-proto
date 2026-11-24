// Fungsi bersama untuk semua endpoint API.
// Sengaja diletakkan di luar folder api/ supaya Vercel tidak menjadikannya endpoint.
import crypto from 'node:crypto';

export const TARGETS = ['led', 'relay1', 'relay2', 'relay3', 'relay4'];

const ENV_SEMUA = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'DEVICE_TOKEN', 'ADMIN_PASSWORD', 'SESSION_SECRET'];

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

// Membungkus handler: cek environment variable dan tangkap error tak terduga.
export function buatHandler(fn, envDiperlukan = ENV_SEMUA) {
  return {
    async fetch(request) {
      const hilang = envDiperlukan.filter((n) => !process.env[n]);
      if (hilang.length) return json({ error: 'konfigurasi_belum_lengkap', hilang }, 500);
      try {
        return await fn(request);
      } catch (err) {
        console.error(err);
        const detail = process.env.DEBUG_ERRORS === '1' ? { detail: String(err && err.message) } : {};
        return json({ error: 'server_error', ...detail }, 500);
      }
    },
  };
}

// Perbandingan string yang tahan timing attack.
export function samaPersis(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// Memanggil REST API Supabase (PostgREST) memakai secret key.
// Kunci baru (sb_secret_...) hanya boleh lewat header apikey.
// Kunci lama (service_role, berupa JWT) masih perlu header Authorization.
export async function sb(path, { method = 'GET', body, prefer } = {}) {
  const key = process.env.SUPABASE_SECRET_KEY;
  const headers = { apikey: key, 'Content-Type': 'application/json' };
  if (!key.startsWith('sb_')) headers.Authorization = `Bearer ${key}`;
  if (prefer) headers.Prefer = prefer;
  const base = process.env.SUPABASE_URL.replace(/\/+$/, '');
  const res = await fetch(`${base}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

export async function ambilPerintah() {
  const rows = await sb('perintah?select=target,nilai');
  return Object.fromEntries(rows.map((r) => [r.target, r.nilai]));
}

// ---- Token sesi admin (HMAC, tanpa library) ----
function tandatangani(payload) {
  return crypto.createHmac('sha256', process.env.SESSION_SECRET).update(payload).digest('base64url');
}

export function buatToken(ttlDetik = 12 * 3600) {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + ttlDetik })).toString('base64url');
  return `${payload}.${tandatangani(payload)}`;
}

export function tokenValid(token) {
  if (typeof token !== 'string') return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  if (!samaPersis(sig, tandatangani(payload))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export function ambilBearer(request) {
  const h = request.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : '';
}
