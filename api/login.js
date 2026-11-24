// POST /api/login  { "password": "..." }  ->  { token }
// Token dipakai untuk memanggil /api/perintah (berlaku 12 jam).
import { buatHandler, json, samaPersis, buatToken } from '../lib/helpers.js';

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

export default buatHandler(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_tidak_diizinkan' }, 405, { Allow: 'POST' });

  let body = {};
  try {
    body = await request.json();
  } catch {
    /* body kosong / bukan JSON -> dianggap password salah */
  }

  const password = typeof body.password === 'string' ? body.password : '';
  if (!samaPersis(password, process.env.ADMIN_PASSWORD)) {
    await tidur(1000); // memperlambat tebak-tebakan password
    return json({ error: 'password_salah' }, 401);
  }
  return json({ token: buatToken(), expires_in: 12 * 3600 });
}, ['ADMIN_PASSWORD', 'SESSION_SECRET']);
