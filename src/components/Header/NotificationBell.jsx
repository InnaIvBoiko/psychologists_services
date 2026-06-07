import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  getUserAppointments,
  getPastAppointmentsForReview,
  getDismissedReviews,
  dismissAppointmentReview,
  cancelAppointment,
} from '@/lib/api'
import { dateLocale } from '@/i18n/format'
import ReviewModal from '../ReviewModal/ReviewModal.jsx'
import CancelModal from '../CancelModal/CancelModal.jsx'
import styles from './NotificationBell.module.css'

const MS_24H = 24 * 60 * 60 * 1000

function formatSlot(slot, locale) {
  if (!slot) return { date: '', time: '' }
  const [datePart, timePart] = slot.split(' ')
  if (!datePart) return { date: slot, time: '' }
  const d = new Date(datePart)
  const date = d.toLocaleDateString(dateLocale(locale), { weekday: 'short', day: 'numeric', month: 'short' })
  return { date, time: timePart || '' }
}

function isCancellable(time_slot) {
  if (!time_slot) return false
  const dt = new Date(time_slot.replace(' ', 'T'))
  return dt - Date.now() > MS_24H
}

export default function NotificationBell() {
  const t = useTranslations('Notifications')
  const locale = useLocale()
  const { user, token } = useAuth()
  const [upcoming, setUpcoming] = useState([])
  const [pendingReviews, setPendingReviews] = useState([])
  const [open, setOpen] = useState(false)
  const [reviewTarget, setReviewTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const ref = useRef(null)

  const loadNotifications = useCallback(() => {
    if (!user?.email) {
      setUpcoming([])
      setPendingReviews([])
      return
    }
    getUserAppointments().then(setUpcoming)

    Promise.all([
      getPastAppointmentsForReview(),
      getDismissedReviews(),
    ]).then(([past, dismissed]) => {
      setPendingReviews(past.filter((a) => !dismissed.includes(String(a.id))))
    })
  }, [user])

  // Load on mount / when the user changes.
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Refresh immediately when an appointment is booked or cancelled elsewhere
  // (AppointmentModal dispatches this event on success), without a page reload.
  useEffect(() => {
    window.addEventListener('appointments:changed', loadNotifications)
    return () => window.removeEventListener('appointments:changed', loadNotifications)
  }, [loadNotifications])

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
          aria-label={t('label')}
          title={t('label')}
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
            <div className={styles.dropHeader}>{t('upcoming')}</div>
            {upcoming.length === 0 ? (
              <p className={styles.empty}>{t('noUpcoming')}</p>
            ) : (
              <ul className={styles.list}>
                {upcoming.map((a) => {
                  const { date, time } = formatSlot(a.time_slot, locale)
                  const cancellable = isCancellable(a.time_slot)
                  return (
                    <li key={a.id} className={`${styles.item} ${cancellable ? styles.cancellableItem : ''}`}>
                      <div className={styles.apptInfo}>
                        <span className={styles.itemDoctor}>{a.psychologist_name}</span>
                        <span className={styles.itemDate}>{date}{time ? ` ${t('at')} ${time}` : ''}</span>
                      </div>
                      {cancellable && (
                        <button
                          className={styles.cancelBtn}
                          onClick={() => { setCancelTarget(a); setOpen(false) }}
                          aria-label={t('cancelLabel')}
                        >
                          {t('cancel')}
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
                <div className={styles.dropHeader}>{t('rateSessions')}</div>
                <ul className={styles.list}>
                  {pendingReviews.map((a) => {
                    const { date, time } = formatSlot(a.time_slot, locale)
                    return (
                      <li key={a.id} className={`${styles.item} ${styles.reviewItem}`}>
                        <div className={styles.reviewInfo}>
                          <span className={styles.itemDoctor}>{a.psychologist_name}</span>
                          <span className={styles.itemDate}>{date}{time ? ` ${t('at')} ${time}` : ''}</span>
                        </div>
                        <div className={styles.reviewActions}>
                          <button
                            className={styles.reviewBtn}
                            onClick={() => { setReviewTarget(a); setOpen(false) }}
                          >
                            ★ {t('review')}
                          </button>
                          <button
                            className={styles.dismissBtn}
                            onClick={() => handleDismiss(a.id)}
                            aria-label={t('dismiss')}
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
