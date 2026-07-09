import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';
import {
  clearSessionCookie,
  createSessionToken,
  normalizeEmail,
  readJsonBody,
  setSessionCookie,
  verifyOtpChallenge,
} from '../_lib/auth.js';
import {
  getChallengeFailureState,
  incrementChallengeFailure,
  isChallengeUsed,
  markChallengeUsed,
} from '../_lib/challengeState.js';
import { recordLoginAudit } from '../_lib/loginAudit.js';
import { consumeRateLimit, withRateLimitHeaders } from '../_lib/rateLimit.js';
import { hasActiveSubscriptionByEmail } from '../_lib/stripe.js';

const LIMIT_VERIFY_IP = 45;
const LIMIT_VERIFY_CHALLENGE = 5;
const WINDOW_VERIFY_IP_MS = 10 * 60 * 1000;
const CHALLENGE_ATTEMPT_TTL_MS = 10 * 60 * 1000;
const CHALLENGE_USED_TTL_SECONDS = 10 * 60;

function challengeKey(challengeToken: string): string {
  return createHash('sha256').update(challengeToken).digest('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();

  if (req.method !== 'POST') {
    await recordLoginAudit({
      action: 'verify_code',
      outcome: 'method_not_allowed',
      ip,
    });
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error('[auth/verify-code] STRIPE_SECRET_KEY não configurada.');
    await recordLoginAudit({
      action: 'verify_code',
      outcome: 'error',
      ip,
      details: { reason: 'missing_stripe_secret_key' },
    });
    return res.status(503).json({ status: 'error' });
  }

  let challengeToken = '';
  let code = '';
  try {
    const body = await readJsonBody(req);
    challengeToken = String(body.challengeToken ?? '');
    code = String(body.code ?? '');
  } catch {
    await recordLoginAudit({
      action: 'verify_code',
      outcome: 'invalid_request',
      ip,
      details: { reason: 'invalid_body' },
    });
    return res.status(400).json({ error: 'Corpo inválido' });
  }

  if (!challengeToken.trim()) {
    await recordLoginAudit({
      action: 'verify_code',
      outcome: 'invalid_request',
      ip,
      details: { reason: 'missing_challenge_token' },
    });
    return res.status(400).json({ error: 'Challenge inválido' });
  }

  const ipRate = await consumeRateLimit({
    key: `auth:verify-code:ip:${ip}`,
    limit: LIMIT_VERIFY_IP,
    windowMs: WINDOW_VERIFY_IP_MS,
  });
  if (!ipRate.allowed) {
    const headers = withRateLimitHeaders({}, ipRate, LIMIT_VERIFY_IP);
    Object.entries(headers).forEach(([name, value]) => res.setHeader(name, value));
    await recordLoginAudit({
      action: 'verify_code',
      outcome: 'rate_limited',
      ip,
      details: { bucket: 'ip' },
    });
    return res.status(429).json({ status: 'rate_limited' });
  }

  const key = challengeKey(challengeToken);

  const challengeAlreadyUsed = await isChallengeUsed(key);
  if (challengeAlreadyUsed) {
    await recordLoginAudit({
      action: 'verify_code',
      outcome: 'expired',
      ip,
      details: { reason: 'challenge_already_used' },
    });
    return res.status(401).json({ status: 'expired' });
  }

  const challengeFailureState = await getChallengeFailureState(key, CHALLENGE_ATTEMPT_TTL_MS);
  if (challengeFailureState.count >= LIMIT_VERIFY_CHALLENGE) {
    res.setHeader('Retry-After', String(challengeFailureState.retryAfterSec));
    await recordLoginAudit({
      action: 'verify_code',
      outcome: 'rate_limited',
      ip,
      details: { bucket: 'challenge', retryAfterSec: challengeFailureState.retryAfterSec },
    });
    return res.status(429).json({ status: 'rate_limited' });
  }

  const result = verifyOtpChallenge(challengeToken, code);
  if (result.ok === false) {
    const challengeFailure = await incrementChallengeFailure(key, CHALLENGE_ATTEMPT_TTL_MS);

    if (challengeFailure.count >= LIMIT_VERIFY_CHALLENGE) {
      res.setHeader('Retry-After', String(challengeFailure.retryAfterSec));
      await recordLoginAudit({
        action: 'verify_code',
        outcome: 'rate_limited',
        ip,
        details: { bucket: 'challenge', retryAfterSec: challengeFailure.retryAfterSec },
      });
      return res.status(429).json({ status: 'rate_limited' });
    }

    await recordLoginAudit({
      action: 'verify_code',
      outcome: result.reason === 'expired' ? 'expired' : 'invalid_code',
      ip,
      details: { failedAttempts: challengeFailure.count },
    });
    return res.status(401).json({ status: result.reason === 'expired' ? 'expired' : 'invalid_code' });
  }

  const normalizedEmail = normalizeEmail(result.email);
  if (!normalizedEmail) {
    const challengeFailure = await incrementChallengeFailure(key, CHALLENGE_ATTEMPT_TTL_MS);
    if (challengeFailure.count >= LIMIT_VERIFY_CHALLENGE) {
      res.setHeader('Retry-After', String(challengeFailure.retryAfterSec));
      await recordLoginAudit({
        action: 'verify_code',
        outcome: 'rate_limited',
        ip,
        details: { bucket: 'challenge', retryAfterSec: challengeFailure.retryAfterSec },
      });
      return res.status(429).json({ status: 'rate_limited' });
    }
    await recordLoginAudit({
      action: 'verify_code',
      outcome: 'invalid_code',
      ip,
      details: { reason: 'invalid_email_after_challenge' },
    });
    return res.status(401).json({ status: 'invalid_code' });
  }

  try {
    const isSubscriber = await hasActiveSubscriptionByEmail(normalizedEmail, stripeSecretKey);
    if (!isSubscriber) {
      clearSessionCookie(res);
      await markChallengeUsed(key, CHALLENGE_USED_TTL_SECONDS);
      await recordLoginAudit({
        action: 'verify_code',
        outcome: 'not_found',
        ip,
        email: normalizedEmail,
      });
      return res.status(403).json({ status: 'not_found' });
    }

    await markChallengeUsed(key, CHALLENGE_USED_TTL_SECONDS);
    const token = createSessionToken(normalizedEmail);
    setSessionCookie(res, token);
    await recordLoginAudit({
      action: 'verify_code',
      outcome: 'authenticated',
      ip,
      email: normalizedEmail,
    });
    return res.status(200).json({ status: 'authenticated' });
  } catch (error) {
    console.error('[auth/verify-code] erro:', error);
    await recordLoginAudit({
      action: 'verify_code',
      outcome: 'error',
      ip,
      email: normalizedEmail,
      details: { reason: 'exception' },
    });
    return res.status(500).json({ status: 'error' });
  }
}
