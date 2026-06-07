'use client'

import { Link as IntlLink, usePathname, useRouter } from '@/i18n/navigation'

// Compatibility shim for the existing react-router-style call sites. It now delegates
// to next-intl's locale-aware navigation, so every `to="/path"` is automatically
// prefixed with the active locale (e.g. /en/path, /it/path) without changing callers.

export function Link({ to, children, ...rest }) {
  return (
    <IntlLink href={to} {...rest}>
      {children}
    </IntlLink>
  )
}

export function NavLink({ to, end, className, children, ...rest }) {
  // usePathname() from next-intl returns the pathname WITHOUT the locale prefix,
  // so comparisons stay locale-agnostic.
  const pathname = usePathname()
  const isActive = to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(to + '/')
  const cls = typeof className === 'function' ? className({ isActive }) : className
  return (
    <IntlLink href={to} className={cls} aria-current={isActive ? 'page' : undefined} {...rest}>
      {children}
    </IntlLink>
  )
}

export function useNavigate() {
  const router = useRouter()
  return (to, opts) => {
    if (opts?.replace) router.replace(to)
    else router.push(to)
  }
}
