import '@/index.css'
import { Inter } from 'next/font/google'
import Providers from './providers.jsx'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' })

export const metadata = {
  title: 'Psychologists.Services — Book a Session with a Licensed Psychologist',
  description:
    'Browse verified psychologist profiles, read patient reviews, and book your session online in minutes. Confidential, flexible, and available 24/7.',
  openGraph: {
    type: 'website',
    url: 'https://psychologists-services-98v1.vercel.app/',
    title: 'Psychologists.Services — Book a Session with a Licensed Psychologist',
    description:
      'Browse verified psychologist profiles, read patient reviews, and book your session online in minutes. Confidential, flexible, and available 24/7.',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
