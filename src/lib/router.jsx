'use client'

import NextLink from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

// Compatibility shim: lets the existing react-router call sites work with Next.js
// routing by changing only the import path (from 'react-router-dom' to '@/lib/router').

export function Link({ to, children, ...rest }) {
  return (
    <NextLink href={to} {...rest}>
      {children}
    </NextLink>
  )
}

export function NavLink({ to, end, className, children, ...rest }) {
  const pathname = usePathname()
  const isActive = to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(to + '/')
  const cls = typeof className === 'function' ? className({ isActive }) : className
  return (
    <NextLink href={to} className={cls} aria-current={isActive ? 'page' : undefined} {...rest}>
      {children}
    </NextLink>
  )
}

export function useNavigate() {
  const router = useRouter()
  return (to, opts) => {
    if (opts?.replace) router.replace(to)
    else router.push(to)
  }
}
