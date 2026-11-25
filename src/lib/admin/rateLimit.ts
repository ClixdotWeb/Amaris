import "server-only";

/**
 * Fixed-window rate limiter. In-memory for now (one server process in development).
 * On Coolify this is swapped for rate-limiter-flexible + Redis behind the same functions (see docs/ADMIN_DASHBOARD_PLAN.md §4).
 */
type Bucket = { count: number; resetAt: number };
const g = globalThis as unknown as { __amarisRateLimit?: Map<string, Bucket> };
const buckets = (g.__amarisRateLimit ??= new Map());

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

function live(key: string, now: number) {
  const b = buckets.get(key);
  if (b && b.resetAt <= now) {
    buckets.delete(key);
    return undefined;
  }
  return b;
}

/** Counts this call and refuses once `limit` calls were made in the window (for actions where every call costs, e.g. uploads). */
export function rateLimit(key: string, limit: number, windowSec: number): RateLimitResult {
  const now = Date.now();
  const b = live(key, now);
  if (!b) {
    buckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { ok: true };
  }
  if (b.count >= limit) return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  b.count++;
  return { ok: true };
}

/**
 * For sign-in: only failures count. Check with `isBlocked` before trying, call `recordFailure` after a wrong
 * password, and `clearFailures` after a successful sign-in, so normal use never locks anyone out.
 */
export function isBlocked(key: string, limit: number): RateLimitResult {
  const now = Date.now();
  const b = live(key, now);
  return b && b.count >= limit ? { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) } : { ok: true };
}

export function recordFailure(key: string, windowSec: number) {
  const now = Date.now();
  const b = live(key, now);
  if (b) b.count++;
  else buckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
}

export function clearFailures(key: string) {
  buckets.delete(key);
}
