import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { getUserAppointments } from '../../strapi/strapi.js'
import styles from './NotificationBell.module.css'

function formatSlot(slot) {
  if (!slot) return { date: '', time: '' }
  const [datePart, timePart] = slot.split(' ')
  if (!datePart) return { date: slot, time: '' }
  const d = new Date(datePart)
  const date = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  return { date, time: timePart || '' }
}

export default function NotificationBell() {
  const { user, token } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!user?.email || !token) { setAppointments([]); return }
    getUserAppointments(user.email, token).then(setAppointments)
  }, [user, token])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        className={styles.bell}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        title="Upcoming appointments"
      >
        🔔
        {appointments.length > 0 && (
          <span className={styles.badge}>
            {appointments.length > 9 ? '9+' : appointments.length}
          </span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropHeader}>Upcoming appointments</div>
          {appointments.length === 0 ? (
            <p className={styles.empty}>No upcoming appointments</p>
          ) : (
            <ul className={styles.list}>
              {appointments.map((a) => {
                const { date, time } = formatSlot(a.time_slot)
                return (
                  <li key={a.id} className={styles.item}>
                    <span className={styles.itemDoctor}>{a.psychologist_name}</span>
                    <span className={styles.itemDate}>{date}</span>
                    {time && <span className={styles.itemTime}>at {time}</span>}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
