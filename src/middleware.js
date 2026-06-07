import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

// Detects the locale (URL prefix → cookie → Accept-Language) and redirects to a
// locale-prefixed path when missing.
export default createMiddleware(routing)

export const config = {
  // Run on everything except API routes, Next internals, and files with an
  // extension (e.g. icon.svg, images) — those must not be locale-prefixed.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
