import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  getUserAppointments,
  getPastAppointmentsForReview,
  getDismissedReviews,
  dismissAppointmentReview,
  cancelAppointment,
} from '../../strapi/strapi.js'
import ReviewModal from '../ReviewModal/ReviewModal.jsx'
import CancelModal from '../CancelModal/CancelModal.jsx'
import styles from './NotificationBell.module.css'

const MS_24H = 24 * 60 * 60 * 1000

function formatSlot(slot) {
  if (!slot) return { date: '', time: '' }
  const [datePart, timePart] = slot.split(' ')
  if (!datePart) return { date: slot, time: '' }
  const d = new Date(datePart)
  const date = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  return { date, time: timePart || '' }
}

function isCancellable(time_slot) {
  if (!time_slot) return false
  const dt = new Date(time_slot.replace(' ', 'T'))
  return dt - Date.now() > MS_24H
}

export default function NotificationBell() {
  const { user, token } = useAuth()
  const [upcoming, setUpcoming] = useState([])
  const [pendingReviews, setPendingReviews] = useState([])
  const [open, setOpen] = useState(false)
  const [reviewTarget, setReviewTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!user?.email || !token) {
      setUpcoming([])
      setPendingReviews([])
      return
    }
    getUserAppointments(user.email, token).then(setUpcoming)

    Promise.all([
      getPastAppointmentsForReview(user.email, token),
      getDismissedReviews(token),
    ]).then(([past, dismissed]) => {
      setPendingReviews(past.filter((a) => !dismissed.includes(String(a.id))))
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
    dismissAppointmentReview(id, token)
    setPendingReviews((prev) => prev.filter((a) => a.id !== id))
  }

  function handleReviewed(id) {
    dismissAppointmentReview(id, token)
    setPendingReviews((prev) => prev.filter((a) => a.id !== id))
    setReviewTarget(null)
  }

  async function handleCancelConfirm() {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await cancelAppointment(cancelTarget.documentId, token)
      setUpcoming((prev) => prev.filter((a) => a.id !== cancelTarget.id))
    } catch (err) {
      console.error('Error cancelling appointment:', err)
    } finally {
      setCancelling(false)
      setCancelTarget(null)
    }
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
                  const cancellable = isCancellable(a.time_slot)
                  return (
                    <li key={a.id} className={`${styles.item} ${cancellable ? styles.cancellableItem : ''}`}>
                      <div className={styles.apptInfo}>
                        <span className={styles.itemDoctor}>{a.psychologist_name}</span>
                        <span className={styles.itemDate}>{date}{time ? ` at ${time}` : ''}</span>
                      </div>
                      {cancellable && (
                        <button
                          className={styles.cancelBtn}
                          onClick={() => { setCancelTarget(a); setOpen(false) }}
                          aria-label="Cancel appointment"
                        >
                          Cancel
                        </button>
                      )}
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

      {cancelTarget && (
        <CancelModal
          appointment={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelConfirm}
          loading={cancelling}
        />
      )}
    </>
  )
}
