import { defineRouting } from 'next-intl/routing'

// Supported locales and the routing strategy. English is the default; the locale
// lives as the first URL segment (e.g. /en/psychologists, /it/psychologists).
export const routing = defineRouting({
  locales: ['en', 'it'],
  defaultLocale: 'en',
})
