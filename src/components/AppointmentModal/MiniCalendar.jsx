import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { dateLocale } from '@/i18n/format'
import styles from './MiniCalendar.module.css'

function toISO(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function MiniCalendar({ selected, onChange, isDisabledDay }) {
  const t = useTranslations('Calendar')
  const locale = useLocale()
  const dl = dateLocale(locale)

  // Localized month label and Monday-based short weekday names (2024-01-01 is a Monday).
  const DAYS = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(dl, { weekday: 'short' })
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)))
  }, [dl])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const firstDay = new Date(viewYear, viewMonth, 1)
  const monthLabel = firstDay.toLocaleDateString(dl, { month: 'long', year: 'numeric' })
  // Monday-based: Mon=0 ... Sun=6
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const isPast = (day) => {
    const d = new Date(viewYear, viewMonth, day)
    return d < today
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button type="button" className={styles.navBtn} onClick={prevMonth} aria-label={t('prevMonth')}>‹</button>
        <span className={styles.monthLabel}>{monthLabel}</span>
        <button type="button" className={styles.navBtn} onClick={nextMonth} aria-label={t('nextMonth')}>›</button>
      </div>
      <div className={styles.grid}>
        {DAYS.map(d => (
          <span key={d} className={styles.dayName}>{d}</span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={`e-${i}`} />
          const iso = toISO(viewYear, viewMonth, day)
          const isToday = iso === toISO(today.getFullYear(), today.getMonth(), today.getDate())
          const isSelected = iso === selected
          const past = isPast(day)
          const notWorking = !past && isDisabledDay?.(iso)
          return (
            <button
              key={iso}
              type="button"
              disabled={past || notWorking}
              onClick={() => onChange(iso)}
              className={[
                styles.day,
                isToday ? styles.today : '',
                isSelected ? styles.selected : '',
                past ? styles.past : '',
                notWorking ? styles.notWorking : '',
              ].join(' ')}
              title={notWorking ? t('notAvailable') : undefined}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
