import { useState } from 'react'
import { DEFAULT_AVAILABILITY, generateTimeOptions } from '../../utils/availability.js'
import styles from './AvailabilityEditor.module.css'

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
}
const DURATIONS = [30, 45, 60, 90, 120]
const TIME_OPTIONS = generateTimeOptions()

export default function AvailabilityEditor({ value, onChange }) {
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
        {DAY_ORDER.map((day) => {
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

              <span className={styles.dayName}>{DAY_LABELS[day]}</span>

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
                <span className={styles.closedLabel}>Closed</span>
              )}
            </div>
          )
        })}
      </div>

      <div className={styles.durationRow}>
        <span className={styles.durationLabel}>Session duration</span>
        <div className={styles.durationOptions}>
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              className={`${styles.durationBtn} ${av.slot_duration === d ? styles.durationActive : ''}`}
              onClick={() => updateDuration(d)}
            >
              {d < 60 ? `${d} min` : `${d / 60}h`}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
