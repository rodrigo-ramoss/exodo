import { isUpstashRedisConfigured, upstashPipeline } from './upstashRedis';

interface LocalFailureState {
  count: number;
  resetAtMs: number;
}

const localFailureStore = new Map<string, LocalFailureState>();
const localUsedStore = new Map<string, number>();
let warnedChallengeRedisFallback = false;

function nowMs(): number {
  return Date.now();
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function cleanupLocalFailures(now: number): void {
  for (const [key, state] of localFailureStore.entries()) {
    if (state.resetAtMs <= now) localFailureStore.delete(key);
  }
}

function cleanupLocalUsed(now: number): void {
  for (const [key, expiresAtMs] of localUsedStore.entries()) {
    if (expiresAtMs <= now) localUsedStore.delete(key);
  }
}

function usedKey(hash: string): string {
  return `auth:verify-code:used:${hash}`;
}

function failKey(hash: string): string {
  return `auth:verify-code:fails:${hash}`;
}

async function isChallengeUsedRedis(hash: string): Promise<boolean> {
  const [raw] = await upstashPipeline([['GET', usedKey(hash)]]);
  return raw !== null && raw !== undefined;
}

async function markChallengeUsedRedis(hash: string, ttlSeconds: number): Promise<void> {
  await upstashPipeline([['SET', usedKey(hash), '1', 'NX', 'EX', Math.max(1, ttlSeconds)]]);
}

async function getChallengeFailureStateRedis(
  hash: string,
  ttlMs: number
): Promise<{ count: number; retryAfterSec: number }> {
  const [countRaw, ttlRaw] = await upstashPipeline([
    ['GET', failKey(hash)],
    ['PTTL', failKey(hash)],
  ]);

  let count = toNumber(countRaw, 0);
  let remainingMs = toNumber(ttlRaw, -1);
  if (remainingMs <= 0 && count > 0) {
    await upstashPipeline([['PEXPIRE', failKey(hash), ttlMs]]);
    remainingMs = ttlMs;
  }

  if (count < 0) count = 0;
  return {
    count,
    retryAfterSec: Math.max(1, Math.ceil((remainingMs > 0 ? remainingMs : ttlMs) / 1000)),
  };
}

async function incrementChallengeFailureRedis(
  hash: string,
  ttlMs: number
): Promise<{ count: number; retryAfterSec: number }> {
  const [countRaw, ttlRaw] = await upstashPipeline([
    ['INCR', failKey(hash)],
    ['PTTL', failKey(hash)],
  ]);

  let count = toNumber(countRaw, 0);
  let remainingMs = toNumber(ttlRaw, -1);

  if (count === 1 || remainingMs <= 0) {
    const [, newTtlRaw] = await upstashPipeline([
      ['PEXPIRE', failKey(hash), ttlMs],
      ['PTTL', failKey(hash)],
    ]);
    remainingMs = toNumber(newTtlRaw, ttlMs);
  }

  if (count < 0) count = 0;
  return {
    count,
    retryAfterSec: Math.max(1, Math.ceil((remainingMs > 0 ? remainingMs : ttlMs) / 1000)),
  };
}

function isChallengeUsedLocal(hash: string): boolean {
  const now = nowMs();
  if (Math.random() < 0.02) cleanupLocalUsed(now);
  const expiresAtMs = localUsedStore.get(hash);
  if (!expiresAtMs) return false;
  if (expiresAtMs <= now) {
    localUsedStore.delete(hash);
    return false;
  }
  return true;
}

function markChallengeUsedLocal(hash: string, ttlSeconds: number): void {
  const expiresAtMs = nowMs() + Math.max(1, ttlSeconds) * 1000;
  localUsedStore.set(hash, expiresAtMs);
}

function getChallengeFailureStateLocal(
  hash: string,
  ttlMs: number
): { count: number; retryAfterSec: number } {
  const now = nowMs();
  if (Math.random() < 0.02) cleanupLocalFailures(now);
  const state = localFailureStore.get(hash);
  if (!state || state.resetAtMs <= now) {
    localFailureStore.delete(hash);
    return {
      count: 0,
      retryAfterSec: Math.max(1, Math.ceil(ttlMs / 1000)),
    };
  }
  return {
    count: state.count,
    retryAfterSec: Math.max(1, Math.ceil((state.resetAtMs - now) / 1000)),
  };
}

function incrementChallengeFailureLocal(
  hash: string,
  ttlMs: number
): { count: number; retryAfterSec: number } {
  const now = nowMs();
  if (Math.random() < 0.02) cleanupLocalFailures(now);
  const current = localFailureStore.get(hash);
  if (!current || current.resetAtMs <= now) {
    const fresh = { count: 1, resetAtMs: now + ttlMs };
    localFailureStore.set(hash, fresh);
    return {
      count: fresh.count,
      retryAfterSec: Math.max(1, Math.ceil(ttlMs / 1000)),
    };
  }
  current.count += 1;
  localFailureStore.set(hash, current);
  return {
    count: current.count,
    retryAfterSec: Math.max(1, Math.ceil((current.resetAtMs - now) / 1000)),
  };
}

function warnRedisFallbackOnce(error: unknown): void {
  if (warnedChallengeRedisFallback) return;
  warnedChallengeRedisFallback = true;
  console.warn('[challengeState] Falha no Redis, usando fallback em memória:', error);
}

export async function isChallengeUsed(hash: string): Promise<boolean> {
  if (isUpstashRedisConfigured()) {
    try {
      return await isChallengeUsedRedis(hash);
    } catch (error) {
      warnRedisFallbackOnce(error);
    }
  }
  return isChallengeUsedLocal(hash);
}

export async function markChallengeUsed(hash: string, ttlSeconds: number): Promise<void> {
  if (isUpstashRedisConfigured()) {
    try {
      await markChallengeUsedRedis(hash, ttlSeconds);
      return;
    } catch (error) {
      warnRedisFallbackOnce(error);
    }
  }
  markChallengeUsedLocal(hash, ttlSeconds);
}

export async function getChallengeFailureState(
  hash: string,
  ttlMs: number
): Promise<{ count: number; retryAfterSec: number }> {
  if (isUpstashRedisConfigured()) {
    try {
      return await getChallengeFailureStateRedis(hash, ttlMs);
    } catch (error) {
      warnRedisFallbackOnce(error);
    }
  }
  return getChallengeFailureStateLocal(hash, ttlMs);
}

export async function incrementChallengeFailure(
  hash: string,
  ttlMs: number
): Promise<{ count: number; retryAfterSec: number }> {
  if (isUpstashRedisConfigured()) {
    try {
      return await incrementChallengeFailureRedis(hash, ttlMs);
    } catch (error) {
      warnRedisFallbackOnce(error);
    }
  }
  return incrementChallengeFailureLocal(hash, ttlMs);
}

