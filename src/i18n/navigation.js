import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Locale-aware navigation primitives. These automatically keep the active locale
// prefix on links and programmatic navigation, so call sites use plain paths
// ("/psychologists") and the current locale is preserved transparently.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
