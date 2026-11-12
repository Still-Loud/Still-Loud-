/**
 * Small in-memory rate limiter.
 *
 * Good enough for a single Node process (local dev, a single Vercel instance)
 * and for slowing down brute-force traffic. Serverless deployments run several
 * isolated instances, so this is a deterrent, not a hard guarantee — Payload's
 * own per-account lockout (maxLoginAttempts/lockTime) is the real backstop for
 * passwords.
 *
 * Keys are bucketed with a fixed window. Nothing is persisted and no request
 * data is logged.
 */
const buckets = new Map()
const MAX_KEYS = 5000

function prune(now) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

/**
 * @returns {{ ok: boolean, remaining: number, retryAfter: number }}
 */
export function rateLimit({ key, limit = 10, windowMs = 60_000 }) {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_KEYS) prune(now)
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfter: 0 }
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    }
  }

  bucket.count += 1
  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 }
}

/** Best-effort client IP from the proxy headers a hosting platform sets. */
export function clientIp(req) {
  const headers = req?.headers
  if (headers && typeof headers.get === 'function') {
    const forwarded = headers.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()
    return (
      headers.get('x-real-ip') ||
      headers.get('cf-connecting-ip') ||
      headers.get('x-vercel-forwarded-for') ||
      'unknown'
    )
  }
  return 'unknown'
}

export function rateLimitResponse(retryAfter, message = 'Too many requests. Please wait a moment and try again.') {
  return Response.json(
    { error: message },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfter || 60) },
    }
  )
}
