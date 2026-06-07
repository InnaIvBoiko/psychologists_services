import '@/index.css'
import { Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import Providers from './providers.jsx'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' })

// Pre-render both locales at build time.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

// Localized metadata (title/description) pulled from the active locale's catalog.
export async function generateMetadata({ params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Metadata' })
  return {
    title: t('rootTitle'),
    description: t('rootDescription'),
    openGraph: {
      type: 'website',
      url: 'https://psychologists-services-98v1.vercel.app/',
      title: t('rootTitle'),
      description: t('rootDescription'),
    },
  }
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params
  // Guard against unknown locales reaching the layout.
  if (!hasLocale(routing.locales, locale)) notFound()
  // Opt into static rendering for this request (next-intl requirement).
  setRequestLocale(locale)

  return (
    <html lang={locale} className={inter.className}>
      <body>
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
