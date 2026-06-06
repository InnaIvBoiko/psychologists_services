'use client'

import { SessionProvider } from 'next-auth/react'
import { AuthProvider } from '@/context/AuthContext'
import Header from '@/components/Header/Header.jsx'
import Footer from '@/components/Footer/Footer.jsx'
import CookieBanner from '@/components/CookieBanner/CookieBanner.jsx'

// Client boundary: provides the Auth.js session + app AuthContext and renders the
// shared chrome (header/footer/cookie banner) around the routed page.
export default function Providers({ children }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <Header />
        <main>{children}</main>
        <Footer />
        <CookieBanner />
      </AuthProvider>
    </SessionProvider>
  )
}
