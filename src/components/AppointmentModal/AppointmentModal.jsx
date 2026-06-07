import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useAuth } from '../../context/AuthContext.jsx'
import { createAppointment, getBookedSlots } from '@/lib/api'
import { dateLocale } from '@/i18n/format'
import { generateSlots, isWorkingDay } from '../../utils/availability.js'
import Modal from '../Modal/Modal.jsx'
import AuthModal from '../AuthModal/AuthModal.jsx'
import MiniCalendar from './MiniCalendar.jsx'
import styles from './AppointmentModal.module.css'

function formatDateLabel(iso, locale) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString(dateLocale(locale), { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function AppointmentModal({ psychologist, onClose, onSuccess }) {
  const t = useTranslations('Appointment')
  const locale = useLocale()
  const { user, token } = useAuth()
  const [authModal, setAuthModal] = useState(null) // 'login' | 'register' | null
  const [form, setForm] = useState({
    name: user?.displayName || '',
    phone: '',
    email: user?.email || '',
    comment: ''
  })
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [bookedSlots, setBookedSlots] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const availability = psychologist.availability ?? null

  // Auto-fill name/email after login
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.displayName || '',
        email: prev.email || user.email || '',
      }))
    }
  }, [user])

  useEffect(() => {
    if (!selectedDate) return
    setSelectedTime(null)
    getBookedSlots(psychologist.documentId, selectedDate, token).then(setBookedSlots)
  }, [psychologist.documentId, selectedDate, token])

  const availableSlots = selectedDate ? generateSlots(selectedDate, availability) : []

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = t('errRequired')
    if (!form.phone.trim()) errs.phone = t('errRequired')
    if (!form.email.trim()) errs.email = t('errRequired')
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = t('errInvalidEmail')
    if (!selectedDate) errs.date = t('errSelectDate')
    if (!selectedTime) errs.time = t('errSelectTime')
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)

    try {
      await createAppointment({
        patient_name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        time_slot: `${selectedDate} ${selectedTime}`,
        comment: form.comment.trim(),
        psychologist_id: psychologist.documentId,
        psychologist_name: psychologist.name
      })

      onSuccess?.()
      // Tell the header's NotificationBell to refresh immediately.
      window.dispatchEvent(new Event('appointments:changed'))
      onClose()
    } catch (error) {
      console.error(error)
      setErrors({ api: t('errApi') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <Modal onClose={onClose} title={t('title')}>
      <div className={styles.content}>
        <h2 className={styles.title}>{t('heading')}</h2>
        {errors.api && <div className={styles.apiError}>{errors.api}</div>}
        <p className={styles.subtitle}>{t('subtitle')}</p>

        {!user && (
          <div className={styles.authNotice}>
            <span className={styles.authNoticeText}>{t('authNotice')}</span>
            <div className={styles.authNoticeActions}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setAuthModal('login')}
              >
                {t('login')}
              </button>
              <button
                type="button"
                  className="btn btn-primary"
                  style={{ marginRight: '0px' }}
                onClick={() => setAuthModal('register')}
              >
                {t('register')}
              </button>
            </div>
          </div>
        )}

        <div className={styles.doctorRow}>
          <img
            src={psychologist.avatar}
            alt={psychologist.name}
            className={styles.doctorAvatar}
          />
          <div>
            <p className={styles.doctorLabel}>{t('yourPsychologist')}</p>
            <p className={styles.doctorName}>{psychologist.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.topFields}>
            <div className="input-group">
              <input
                className={`input-field ${errors.name ? 'error' : ''}`}
                placeholder={t('name')}
                aria-label={t('name')}
                value={form.name}
                onChange={set('name')}
              />
              {errors.name && <span className="input-error-msg">{errors.name}</span>}
            </div>
            <div className="input-group">
              <input
                className={`input-field ${errors.phone ? 'error' : ''}`}
                placeholder={t('phone')}
                aria-label={t('phone')}
                value={form.phone}
                onChange={set('phone')}
                type="tel"
              />
              {errors.phone && <span className="input-error-msg">{errors.phone}</span>}
            </div>
          </div>

          <div className="input-group">
            <input
              className={`input-field ${errors.email ? 'error' : ''}`}
              placeholder={t('email')}
              aria-label={t('email')}
              value={form.email}
              onChange={set('email')}
              type="email"
            />
            {errors.email && <span className="input-error-msg">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label className={styles.timeSectionLabel}>{t('dateLabel')}</label>
            <MiniCalendar
              selected={selectedDate}
              onChange={setSelectedDate}
              isDisabledDay={(iso) => !isWorkingDay(iso, availability)}
            />
            {errors.date && <span className="input-error-msg">{errors.date}</span>}
          </div>

          <div className="input-group">
            <label className={styles.timeSectionLabel}>
              {t('meetingTime')}
              {selectedDate && (
                <span className={styles.dateChip}>{formatDateLabel(selectedDate, locale)}</span>
              )}
            </label>
            {!selectedDate ? (
              <p className={styles.selectDateHint}>{t('selectDateHint')}</p>
            ) : availableSlots.length === 0 ? (
              <p className={styles.selectDateHint}>{t('noSlots')}</p>
            ) : (
              <div className={styles.timeGrid}>
                {availableSlots.map((slot) => {
                  const isBooked = bookedSlots.includes(slot)
                  return (
                    <button
                      key={slot}
                      type="button"
                      className={`${styles.timeSlot} ${selectedTime === slot ? styles.selected : ''} ${isBooked ? styles.booked : ''}`}
                      onClick={() => !isBooked && setSelectedTime(slot)}
                      disabled={isBooked}
                      title={isBooked ? t('alreadyBooked') : undefined}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            )}
            {errors.time && <span className="input-error-msg">{errors.time}</span>}
          </div>

          <div className="input-group">
            <textarea
              className={`input-field ${errors.comment ? 'error' : ''}`}
              placeholder={t('comment')}
              aria-label={t('comment')}
              value={form.comment}
              onChange={set('comment')}
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? t('sending') : user ? t('send') : t('sendGuest')}
          </button>
        </form>
      </div>
    </Modal>

    {authModal && (
      <AuthModal
        mode={authModal}
        onClose={() => setAuthModal(null)}
        onSwitchMode={(m) => setAuthModal(m)}
      />
    )}
  </>
  )
}
