import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'crypto';

const SESSION_COOKIE_NAME = 'exodo_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 dias
const CHALLENGE_TTL_SECONDS = 60 * 10; // 10 minutos
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SessionTokenPayload {
  sub: string;
  tier: 'subscriber';
  iat: number;
  exp: number;
  jti: string;
}

interface OtpChallengePayload {
  email: string;
  codeHash: string;
  nonce: string;
  iat: number;
  exp: number;
}

function base64urlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function base64urlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function getSessionSecret(): string {
  return process.env.AUTH_SESSION_SECRET || '';
}

function getChallengeSecret(): string {
  return process.env.AUTH_CHALLENGE_SECRET || getSessionSecret();
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function toSignedToken(payload: Record<string, unknown>, secret: string): string {
  const data = base64urlEncode(JSON.stringify(payload));
  const signature = sign(data, secret);
  return `${data}.${signature}`;
}

function fromSignedToken<T>(token: string, secret: string): T | null {
  const [data, signature] = token.split('.');
  if (!data || !signature) return null;

  const expected = sign(data, secret);
  const a = Buffer.from(signature, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(base64urlDecode(data)) as T;
  } catch {
    return null;
  }
}

function parseCookies(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  return raw.split(';').reduce<Record<string, string>>((acc, part) => {
    const [key, ...rest] = part.trim().split('=');
    if (!key || rest.length === 0) return acc;
    acc[key] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

export function normalizeEmail(raw: string): string | null {
  const normalized = raw.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalized)) return null;
  return normalized;
}

export function generateOtpCode(): string {
  return String(randomInt(100000, 1000000));
}

export function createOtpChallenge(email: string, code: string): string {
  const secret = getChallengeSecret();
  if (!secret) {
    throw new Error('AUTH_CHALLENGE_SECRET (ou AUTH_SESSION_SECRET) não configurado.');
  }

  const now = Math.floor(Date.now() / 1000);
  const nonce = randomUUID();
  const codeHash = createHmac('sha256', secret)
    .update(`${email}:${code}:${nonce}`)
    .digest('hex');

  const payload: OtpChallengePayload = {
    email,
    codeHash,
    nonce,
    iat: now,
    exp: now + CHALLENGE_TTL_SECONDS,
  };

  return toSignedToken(payload, secret);
}

export function verifyOtpChallenge(
  challengeToken: string,
  code: string
): { ok: true; email: string } | { ok: false; reason: 'invalid' | 'expired' } {
  const secret = getChallengeSecret();
  if (!secret) return { ok: false, reason: 'invalid' };

  const payload = fromSignedToken<OtpChallengePayload>(challengeToken, secret);
  if (!payload?.email || !payload.codeHash || !payload.nonce || !payload.exp) {
    return { ok: false, reason: 'invalid' };
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) return { ok: false, reason: 'expired' };

  const normalizedCode = code.trim();
  if (!/^\d{6}$/.test(normalizedCode)) return { ok: false, reason: 'invalid' };

  const expectedHash = createHmac('sha256', secret)
    .update(`${payload.email}:${normalizedCode}:${payload.nonce}`)
    .digest('hex');

  const a = Buffer.from(payload.codeHash, 'utf8');
  const b = Buffer.from(expectedHash, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'invalid' };
  }

  return { ok: true, email: payload.email };
}

export function createSessionToken(email: string): string {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error('AUTH_SESSION_SECRET não configurado.');
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: SessionTokenPayload = {
    sub: email,
    tier: 'subscriber',
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    jti: randomUUID(),
  };

  return toSignedToken(payload, secret);
}

export function getSessionFromRequest(req: VercelRequest): { email: string } | null {
  const secret = getSessionSecret();
  if (!secret) return null;

  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return null;

  const payload = fromSignedToken<SessionTokenPayload>(token, secret);
  if (!payload?.sub || !payload.exp || payload.tier !== 'subscriber') return null;

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) return null;

  return { email: payload.sub };
}

export function setSessionCookie(res: VercelResponse, token: string): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(
      token
    )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`
  );
}

export function clearSessionCookie(res: VercelResponse): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
  );
}

export async function readJsonBody(req: VercelRequest): Promise<Record<string, unknown>> {
  if (typeof req.body === 'string') {
    return JSON.parse(req.body) as Record<string, unknown>;
  }
  if (req.body && typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }
  return {};
}

export const authConfig = {
  challengeTtlSeconds: CHALLENGE_TTL_SECONDS,
};

