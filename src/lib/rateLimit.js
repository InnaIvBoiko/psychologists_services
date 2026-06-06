import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Anti brute-force rate limiting, backed by Upstash Redis (free tier).
//
// Graceful degradation: if UPSTASH_REDIS_REST_URL / _TOKEN are not set, the limiter
// becomes a no-op so local dev and preview deploys keep working without the external
// service. Set both env vars in production to actually enforce the limits.
const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN
const redis = url && token ? new Redis({ url, token }) : null

if (!redis && process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line no-console
  console.warn('[rateLimit] Upstash env vars missing — rate limiting is DISABLED.')
}

function makeLimiter(prefix, limit, window) {
  if (!redis) return null
  return new Ratelimit({
    redis,
    prefix,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: false,
  })
}

// Tunable policies. Login is per-attempt-bursty so a slightly higher cap; registration
// is rarer so a tighter window.
const limiters = {
  login: makeLimiter('rl:login', 5, '60 s'), // 5 attempts / minute
  register: makeLimiter('rl:register', 3, '600 s'), // 3 sign-ups / 10 minutes
  booking: makeLimiter('rl:booking', 5, '3600 s'), // 5 appointments / hour (guests included)
}

/**
 * @param {keyof typeof limiters} name  which policy to apply
 * @param {string} identifier  stable key for the caller (usually client IP)
 * @returns {Promise<{ success: boolean }>}  success=true when the request is allowed
 */
export async function rateLimit(name, identifier) {
  const limiter = limiters[name]
  if (!limiter) return { success: true } // disabled (no Upstash configured)
  const { success } = await limiter.limit(identifier)
  return { success }
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(req) {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}
