import { isUpstashRedisConfigured, upstashPipeline } from './upstashRedis.js';

interface Bucket {
  count: number;
  resetAtMs: number;
}

interface ConsumeRateLimitParams {
  key: string;
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

const buckets = new Map<string, Bucket>();
let warnedRedisRateLimitFallback = false;

function nowMs(): number {
  return Date.now();
}

function cleanupExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAtMs <= now) buckets.delete(key);
  }
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

async function consumeRateLimitRedis(params: ConsumeRateLimitParams): Promise<RateLimitResult> {
  const { key, limit, windowMs } = params;

  const [countRaw, ttlRaw] = await upstashPipeline([
    ['INCR', key],
    ['PTTL', key],
  ]);

  const count = toNumber(countRaw, 0);
  let ttlMs = toNumber(ttlRaw, -1);

  if (count === 1 || ttlMs <= 0) {
    const [, newTtlRaw] = await upstashPipeline([
      ['PEXPIRE', key, windowMs],
      ['PTTL', key],
    ]);
    ttlMs = toNumber(newTtlRaw, windowMs);
  }

  if (ttlMs <= 0) ttlMs = windowMs;

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSec: Math.max(1, Math.ceil(ttlMs / 1000)),
  };
}

function consumeRateLimitLocal(params: ConsumeRateLimitParams): RateLimitResult {
  const { key, limit, windowMs } = params;
  const now = nowMs();
  if (Math.random() < 0.02) cleanupExpiredBuckets(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAtMs <= now) {
    const resetAtMs = now + windowMs;
    buckets.set(key, { count: 1, resetAtMs });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      retryAfterSec: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAtMs - now) / 1000)),
    };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSec: Math.max(1, Math.ceil((existing.resetAtMs - now) / 1000)),
  };
}

export async function consumeRateLimit(params: ConsumeRateLimitParams): Promise<RateLimitResult> {
  if (isUpstashRedisConfigured()) {
    try {
      return await consumeRateLimitRedis(params);
    } catch (error) {
      if (!warnedRedisRateLimitFallback) {
        warnedRedisRateLimitFallback = true;
        console.warn('[rateLimit] Falha no Redis, usando fallback em memória:', error);
      }
    }
  }

  return consumeRateLimitLocal(params);
}

export function withRateLimitHeaders(
  headers: Record<string, string>,
  rate: RateLimitResult,
  limit: number
): Record<string, string> {
  return {
    ...headers,
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(rate.remaining),
    'Retry-After': String(rate.retryAfterSec),
  };
}
