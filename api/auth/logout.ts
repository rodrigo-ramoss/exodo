import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearSessionCookie, getSessionFromRequest } from '../_lib/auth.js';
import { recordLoginAudit } from '../_lib/loginAudit.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();

  if (req.method !== 'POST') {
    await recordLoginAudit({
      action: 'logout',
      outcome: 'method_not_allowed',
      ip,
    });
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const session = getSessionFromRequest(req);
  clearSessionCookie(res);
  await recordLoginAudit({
    action: 'logout',
    outcome: 'success',
    ip,
    email: session?.email,
  });
  return res.status(200).json({ ok: true });
}
