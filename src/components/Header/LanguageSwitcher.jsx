'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import styles from './LanguageSwitcher.module.css'

// IT/EN segmented toggle. Switching navigates to the same route under the other
// locale; next-intl persists the choice in a cookie so it sticks across visits.
export default function LanguageSwitcher() {
  const t = useTranslations('Header')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const switchTo = (next) => {
    if (next !== locale) router.replace(pathname, { locale: next })
  }

  return (
    <div className={styles.switcher} role="group" aria-label={t('languageLabel')}>
      {routing.locales.map((loc) => {
        const active = loc === locale
        return (
          <button
            key={loc}
            type="button"
            lang={loc}
            className={`${styles.option} ${active ? styles.active : ''}`}
            aria-pressed={active}
            onClick={() => switchTo(loc)}
          >
            {loc.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
