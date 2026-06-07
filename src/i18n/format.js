// Maps an app locale ('en' | 'it') to a BCP-47 tag for Intl date/number formatting,
// so dates rendered via toLocaleDateString match the active UI language.
const DATE_LOCALES = {
  en: 'en-GB',
  it: 'it-IT',
}

export function dateLocale(locale) {
  return DATE_LOCALES[locale] || 'en-GB'
}
