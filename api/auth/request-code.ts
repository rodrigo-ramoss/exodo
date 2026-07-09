import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authConfig, createOtpChallenge, generateOtpCode, normalizeEmail, readJsonBody } from '../_lib/auth.js';
import { consumeRateLimit, withRateLimitHeaders } from '../_lib/rateLimit.js';
import { recordLoginAudit } from '../_lib/loginAudit.js';

const LIMIT_IP = 20;
const LIMIT_EMAIL = 6;
const LIMIT_IP_EMAIL = 4;
const WINDOW_IP_MS = 10 * 60 * 1000;
const WINDOW_EMAIL_MS = 15 * 60 * 1000;
const WINDOW_IP_EMAIL_MS = 10 * 60 * 1000;

async function sendOtpEmail(email: string, code: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY não configurada.');
  }

  const senderEmail = process.env.AUTH_FROM_EMAIL || 'nao-responda@exodo.app';
  const senderName = process.env.AUTH_FROM_NAME || 'Exodo';

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email }],
      subject: 'Seu codigo de acesso ao Exodo',
      textContent: `Seu codigo de acesso ao Exodo: ${code}. Ele expira em 10 minutos.`,
      htmlContent: `<p>Seu codigo de acesso ao <strong>Exodo</strong>:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p><p>Ele expira em 10 minutos.</p>`,
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Falha ao enviar e-mail (${response.status}): ${payload}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();

  if (req.method !== 'POST') {
    await recordLoginAudit({
      action: 'request_code',
      outcome: 'method_not_allowed',
      ip,
    });
    return res.status(405).json({ error: 'Método não permitido' });
  }

  let email = '';
  try {
    const body = await readJsonBody(req);
    email = String(body.email ?? '');
  } catch {
    await recordLoginAudit({
      action: 'request_code',
      outcome: 'invalid_request',
      ip,
      details: { reason: 'invalid_body' },
    });
    return res.status(400).json({ error: 'Corpo inválido' });
  }

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    await recordLoginAudit({
      action: 'request_code',
      outcome: 'invalid_request',
      ip,
      details: { reason: 'invalid_email' },
    });
    return res.status(400).json({ error: 'E-mail inválido' });
  }

  const ipRate = await consumeRateLimit({
    key: `auth:request-code:ip:${ip}`,
    limit: LIMIT_IP,
    windowMs: WINDOW_IP_MS,
  });
  if (!ipRate.allowed) {
    const headers = withRateLimitHeaders({}, ipRate, LIMIT_IP);
    Object.entries(headers).forEach(([name, value]) => res.setHeader(name, value));
    await recordLoginAudit({
      action: 'request_code',
      outcome: 'rate_limited',
      ip,
      email: normalizedEmail,
      details: { bucket: 'ip' },
    });
    return res.status(429).json({ status: 'rate_limited' });
  }

  const emailRate = await consumeRateLimit({
    key: `auth:request-code:email:${normalizedEmail}`,
    limit: LIMIT_EMAIL,
    windowMs: WINDOW_EMAIL_MS,
  });
  if (!emailRate.allowed) {
    const headers = withRateLimitHeaders({}, emailRate, LIMIT_EMAIL);
    Object.entries(headers).forEach(([name, value]) => res.setHeader(name, value));
    await recordLoginAudit({
      action: 'request_code',
      outcome: 'rate_limited',
      ip,
      email: normalizedEmail,
      details: { bucket: 'email' },
    });
    return res.status(429).json({ status: 'rate_limited' });
  }

  const pairRate = await consumeRateLimit({
    key: `auth:request-code:pair:${ip}:${normalizedEmail}`,
    limit: LIMIT_IP_EMAIL,
    windowMs: WINDOW_IP_EMAIL_MS,
  });
  if (!pairRate.allowed) {
    const headers = withRateLimitHeaders({}, pairRate, LIMIT_IP_EMAIL);
    Object.entries(headers).forEach(([name, value]) => res.setHeader(name, value));
    await recordLoginAudit({
      action: 'request_code',
      outcome: 'rate_limited',
      ip,
      email: normalizedEmail,
      details: { bucket: 'ip_email' },
    });
    return res.status(429).json({ status: 'rate_limited' });
  }

  try {
    const code = generateOtpCode();
    const challengeToken = createOtpChallenge(normalizedEmail, code);

    if (process.env.BREVO_API_KEY) {
      await sendOtpEmail(normalizedEmail, code);
      await recordLoginAudit({
        action: 'request_code',
        outcome: 'code_sent',
        ip,
        email: normalizedEmail,
      });
      return res.status(200).json({
        status: 'code_sent',
        challengeToken,
        expiresIn: authConfig.challengeTtlSeconds,
      });
    }

    // Ajuda no desenvolvimento local quando e-mail não está configurado.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[auth/request-code] BREVO_API_KEY ausente: retornando devCode.');
      await recordLoginAudit({
        action: 'request_code',
        outcome: 'code_sent_dev',
        ip,
        email: normalizedEmail,
      });
      return res.status(200).json({
        status: 'code_sent',
        challengeToken,
        expiresIn: authConfig.challengeTtlSeconds,
        devCode: code,
      });
    }

    await recordLoginAudit({
      action: 'request_code',
      outcome: 'error',
      ip,
      email: normalizedEmail,
      details: { reason: 'missing_brevo_api_key_in_production' },
    });
    return res.status(503).json({ status: 'error' });
  } catch (error) {
    console.error('[auth/request-code] erro:', error);
    await recordLoginAudit({
      action: 'request_code',
      outcome: 'error',
      ip,
      email: normalizedEmail,
      details: { reason: 'exception' },
    });
    return res.status(500).json({ status: 'error' });
  }
}
