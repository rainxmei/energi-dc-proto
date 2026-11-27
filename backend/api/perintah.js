// POST /api/perintah  { "target": "led", "nilai": true }
// Khusus admin: header  Authorization: Bearer <token dari /api/login>
import { buatHandler, json, sb, ambilPerintah, ambilBearer, tokenValid, TARGETS } from '../lib/helpers.js';

export default buatHandler(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_tidak_diizinkan' }, 405, { Allow: 'POST' });

  if (!tokenValid(ambilBearer(request))) return json({ error: 'harus_login_admin' }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'json_tidak_valid' }, 400);
  }

  if (!TARGETS.includes(body.target) || typeof body.nilai !== 'boolean') {
    return json({ error: 'target_atau_nilai_tidak_valid', target_yang_boleh: TARGETS }, 400);
  }

  await sb('perintah?on_conflict=target', {
    method: 'POST',
    body: { target: body.target, nilai: body.nilai, updated_at: new Date().toISOString() },
    prefer: 'resolution=merge-duplicates,return=minimal',
  });

  return json({ ok: true, perintah: await ambilPerintah() });
}, ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'SESSION_SECRET']);
