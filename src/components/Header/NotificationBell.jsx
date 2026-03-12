import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { getUserAppointments, getPastAppointmentsForReview } from '../../strapi/strapi.js'
import ReviewModal from '../ReviewModal/ReviewModal.jsx'
import styles from './NotificationBell.module.css'

const DISMISSED_KEY = 'psy_dismissed_reviews'
const REVIEWED_KEY  = 'psy_reviewed_appointments'

function getDismissed() {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]') } catch { return [] }
}
function getReviewed() {
  try { return JSON.parse(localStorage.getItem(REVIEWED_KEY) || '[]') } catch { return [] }
}
function markDismissed(id) {
  const list = getDismissed()
  if (!list.includes(id)) localStorage.setItem(DISMISSED_KEY, JSON.stringify([...list, id]))
}
function markReviewed(id) {
  const list = getReviewed()
  if (!list.includes(id)) localStorage.setItem(REVIEWED_KEY, JSON.stringify([...list, id]))
}

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
  const [upcoming, setUpcoming] = useState([])
  const [pendingReviews, setPendingReviews] = useState([])
  const [open, setOpen] = useState(false)
  const [reviewTarget, setReviewTarget] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    if (!user?.email || !token) {
      setUpcoming([])
      setPendingReviews([])
      return
    }

    getUserAppointments(user.email, token).then(setUpcoming)

    getPastAppointmentsForReview(user.email, token).then((past) => {
      const dismissed = getDismissed()
      const reviewed  = getReviewed()
      const pending = past.filter(
        (a) => !dismissed.includes(a.id) && !reviewed.includes(a.id)
      )
      setPendingReviews(pending)
    })
  }, [user, token])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  const totalCount = upcoming.length + pendingReviews.length

  function handleDismiss(id) {
    markDismissed(id)
    setPendingReviews((prev) => prev.filter((a) => a.id !== id))
  }

  function handleReviewed(id) {
    markReviewed(id)
    setPendingReviews((prev) => prev.filter((a) => a.id !== id))
    setReviewTarget(null)
  }

  return (
    <>
      <div className={styles.wrap} ref={ref}>
        <button
          className={styles.bell}
          onClick={() => setOpen((v) => !v)}
          aria-label="Notifications"
          title="Notifications"
        >
          🔔
          {totalCount > 0 && (
            <span className={styles.badge}>
              {totalCount > 9 ? '9+' : totalCount}
            </span>
          )}
        </button>

        {open && (
          <div className={styles.dropdown}>
            {/* ── Upcoming ── */}
            <div className={styles.dropHeader}>Upcoming appointments</div>
            {upcoming.length === 0 ? (
              <p className={styles.empty}>No upcoming appointments</p>
            ) : (
              <ul className={styles.list}>
                {upcoming.map((a) => {
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

            {/* ── Pending reviews ── */}
            {pendingReviews.length > 0 && (
              <>
                <div className={styles.dropHeader}>Rate your sessions</div>
                <ul className={styles.list}>
                  {pendingReviews.map((a) => {
                    const { date, time } = formatSlot(a.time_slot)
                    return (
                      <li key={a.id} className={`${styles.item} ${styles.reviewItem}`}>
                        <div className={styles.reviewInfo}>
                          <span className={styles.itemDoctor}>{a.psychologist_name}</span>
                          <span className={styles.itemDate}>{date}{time ? ` at ${time}` : ''}</span>
                        </div>
                        <div className={styles.reviewActions}>
                          <button
                            className={styles.reviewBtn}
                            onClick={() => { setReviewTarget(a); setOpen(false) }}
                          >
                            ★ Review
                          </button>
                          <button
                            className={styles.dismissBtn}
                            onClick={() => handleDismiss(a.id)}
                            aria-label="Dismiss"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      {reviewTarget && (
        <ReviewModal
          appointment={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmitted={handleReviewed}
        />
      )}
    </>
  )
}
