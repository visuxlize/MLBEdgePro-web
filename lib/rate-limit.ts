interface RateLimitEntry {
  count: number;
  reset: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically purge expired entries so the map doesn't grow unbounded
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.reset) store.delete(key);
  }
}, 60_000);

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.reset - now) / 1000);
    return { ok: false, retryAfter };
  }

  entry.count++;
  return { ok: true, retryAfter: 0 };
}

export function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
