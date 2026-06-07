import createNextIntlPlugin from 'next-intl/plugin'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /next-intl[\\/].*extractor/ },
    ]
    return config
  },
}

// Points next-intl at the request config that loads per-locale messages.
const withNextIntl = createNextIntlPlugin('./src/i18n/request.js')

export default withNextIntl(nextConfig)
