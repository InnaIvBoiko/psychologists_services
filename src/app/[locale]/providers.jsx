'use client'

import { useTranslations } from 'next-intl'
import { SessionProvider } from 'next-auth/react'
import { AuthProvider } from '@/context/AuthContext'
import Header from '@/components/Header/Header.jsx'
import Footer from '@/components/Footer/Footer.jsx'
import CookieBanner from '@/components/CookieBanner/CookieBanner.jsx'

// Client boundary: provides the Auth.js session + app AuthContext and renders the
// shared chrome (header/footer/cookie banner) around the routed page.
export default function Providers({ children }) {
  const t = useTranslations('Header')
  return (
    <SessionProvider>
      <AuthProvider>
        {/* Keyboard a11y: lets users jump past the nav straight to the page content. */}
        <a href="#main-content" className="skip-link">{t('skipToContent')}</a>
        <Header />
        <main id="main-content" tabIndex={-1}>{children}</main>
        <Footer />
        <CookieBanner />
      </AuthProvider>
    </SessionProvider>
  )
}
