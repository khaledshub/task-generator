const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const authRateLimitStore = new Map<string, RateLimitBucket>();

/**
 * Returns a best-effort client ip from common proxy headers.
 */
export function getClientIpFromHeaders(
  headers: Headers | Record<string, string | string[] | undefined>,
): string {
  const getHeader = (name: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(name);
    }

    const value = headers[name] ?? headers[name.toLowerCase()];
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }

    return value ?? null;
  };

  const forwarded = getHeader("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  return getHeader("x-real-ip") ?? "unknown";
}

/**
 * Increments the counter for a key and returns whether the request is allowed.
 */
export function takeRateLimit(
  key: string,
  maxAttempts: number,
  windowMs = DEFAULT_WINDOW_MS,
): RateLimitResult {
  const now = Date.now();
  const existing = authRateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    authRateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    pruneRateLimitStore(now);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  authRateLimitStore.set(key, existing);

  if (existing.count > maxAttempts) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Clears rate-limit history for a key after successful auth.
 */
export function clearRateLimit(key: string) {
  authRateLimitStore.delete(key);
}

/**
 * Adds a fixed delay to smooth response timing between failed auth outcomes.
 */
export async function applyAuthFailureDelay(delayMs = 350): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

function pruneRateLimitStore(now: number) {
  if (authRateLimitStore.size < 500) {
    return;
  }

  for (const [key, bucket] of authRateLimitStore.entries()) {
    if (bucket.resetAt <= now) {
      authRateLimitStore.delete(key);
    }
  }
}
