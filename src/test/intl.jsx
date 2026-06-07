import { render as rtlRender } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '../../messages/en.json'

// Renders a component tree wrapped in the English next-intl provider, so
// components using useTranslations/useLocale work in unit tests and assertions
// can match the real English copy.
export function render(ui, options) {
  return rtlRender(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
    options
  )
}

export { screen, fireEvent, waitFor, act, within } from '@testing-library/react'
