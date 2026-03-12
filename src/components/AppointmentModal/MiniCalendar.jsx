import { useState } from 'react'
import styles from './MiniCalendar.module.css'

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function toISO(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function MiniCalendar({ selected, onChange, isDisabledDay }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const firstDay = new Date(viewYear, viewMonth, 1)
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
        <button type="button" className={styles.navBtn} onClick={prevMonth}>‹</button>
        <span className={styles.monthLabel}>{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" className={styles.navBtn} onClick={nextMonth}>›</button>
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
              title={notWorking ? 'Not available' : undefined}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
