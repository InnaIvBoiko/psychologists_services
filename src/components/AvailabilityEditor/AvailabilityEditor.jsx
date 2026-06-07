import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { dateLocale } from '@/i18n/format'
import { DEFAULT_AVAILABILITY, generateTimeOptions } from '../../utils/availability.js'
import styles from './AvailabilityEditor.module.css'

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DURATIONS = [30, 45, 60, 90, 120]
const TIME_OPTIONS = generateTimeOptions()

export default function AvailabilityEditor({ value, onChange }) {
  const t = useTranslations('Availability')
  const locale = useLocale()
  // Localized full weekday names indexed Monday→Sunday (2024-01-01 is a Monday).
  const dayLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(dateLocale(locale), { weekday: 'long' })
    return DAY_ORDER.map((_, i) => fmt.format(new Date(2024, 0, 1 + i)))
  }, [locale])
  const [av, setAv] = useState(() => ({ ...DEFAULT_AVAILABILITY, ...(value || {}) }))

  const updateDay = (day, patch) => {
    const updated = { ...av, [day]: { ...av[day], ...patch } }
    setAv(updated)
    onChange?.(updated)
  }

  const updateDuration = (d) => {
    const updated = { ...av, slot_duration: Number(d) }
    setAv(updated)
    onChange?.(updated)
  }

  return (
    <div className={styles.editor}>
      <div className={styles.days}>
        {DAY_ORDER.map((day, dayIdx) => {
          const d = av[day] || DEFAULT_AVAILABILITY[day]
          return (
            <div key={day} className={`${styles.dayRow} ${!d.enabled ? styles.disabled : ''}`}>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={d.enabled}
                  onChange={(e) => updateDay(day, { enabled: e.target.checked })}
                />
                <span className={styles.slider} />
              </label>

              <span className={styles.dayName}>{dayLabels[dayIdx]}</span>

              {d.enabled ? (
                <div className={styles.times}>
                  <select
                    className={styles.timeSelect}
                    value={d.start}
                    onChange={(e) => updateDay(day, { start: e.target.value })}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className={styles.dash}>—</span>
                  <select
                    className={styles.timeSelect}
                    value={d.end}
                    onChange={(e) => updateDay(day, { end: e.target.value })}
                  >
                    {TIME_OPTIONS.filter((t) => t > d.start).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className={styles.closedLabel}>{t('closed')}</span>
              )}
            </div>
          )
        })}
      </div>

      <div className={styles.durationRow}>
        <span className={styles.durationLabel}>{t('sessionDuration')}</span>
        <div className={styles.durationOptions}>
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              className={`${styles.durationBtn} ${av.slot_duration === d ? styles.durationActive : ''}`}
              onClick={() => updateDuration(d)}
            >
              {d < 60 ? t('minutes', { count: d }) : t('hours', { count: d / 60 })}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
