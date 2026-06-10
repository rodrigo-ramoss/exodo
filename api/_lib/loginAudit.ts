import { createHash } from 'crypto';
import { isUpstashRedisConfigured, upstashPipeline } from './upstashRedis.js';

type AuthAction = 'request_code' | 'verify_code' | 'session' | 'logout';

interface LoginAuditEvent {
  action: AuthAction;
  outcome: string;
  ip?: string;
  email?: string;
  details?: Record<string, unknown>;
}

const DEFAULT_AUDIT_KEY = 'auth:audit:events';
const DEFAULT_AUDIT_MAX_ITEMS = 3000;
const DEFAULT_AUDIT_TTL_SECONDS = 60 * 60 * 24 * 30;
let warnedRedisAuditFallback = false;

function maskEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const [local, domain] = trimmed.split('@');
  if (!local || !domain) return '';
  const start = local.slice(0, 2);
  return `${start}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`;
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export async function recordLoginAudit(event: LoginAuditEvent): Promise<void> {
  const payload = {
    ts: new Date().toISOString(),
    action: event.action,
    outcome: event.outcome,
    ip: event.ip || '',
    emailMasked: event.email ? maskEmail(event.email) : '',
    emailHash: event.email ? hash(event.email.trim().toLowerCase()) : '',
    details: event.details || {},
  };

  console.info('[auth/audit]', JSON.stringify(payload));

  if (!isUpstashRedisConfigured()) return;

  try {
    const key = process.env.AUTH_AUDIT_REDIS_KEY || DEFAULT_AUDIT_KEY;
    const maxItems = Number(process.env.AUTH_AUDIT_MAX_ITEMS || DEFAULT_AUDIT_MAX_ITEMS);
    const ttlSeconds = Number(process.env.AUTH_AUDIT_TTL_SECONDS || DEFAULT_AUDIT_TTL_SECONDS);

    await upstashPipeline([
      ['LPUSH', key, JSON.stringify(payload)],
      ['LTRIM', key, 0, Math.max(1, maxItems) - 1],
      ['EXPIRE', key, Math.max(60, ttlSeconds)],
    ]);
  } catch (error) {
    if (!warnedRedisAuditFallback) {
      warnedRedisAuditFallback = true;
      console.warn('[auth/audit] Falha ao persistir auditoria no Redis:', error);
    }
  }
}
