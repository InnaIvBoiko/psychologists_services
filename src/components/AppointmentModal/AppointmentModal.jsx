import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { createAppointment, getBookedSlots } from '../../strapi/strapi.js'
import { generateSlots, isWorkingDay } from '../../utils/availability.js'
import Modal from '../Modal/Modal.jsx'
import MiniCalendar from './MiniCalendar.jsx'
import styles from './AppointmentModal.module.css'

function formatDateLabel(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function AppointmentModal({ psychologist, onClose, onSuccess }) {
  const { user, token } = useAuth()
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
    if (!form.name.trim()) errs.name = 'Required'
    if (!form.phone.trim()) errs.phone = 'Required'
    if (!form.email.trim()) errs.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email'
    if (!selectedDate) errs.date = 'Please select a date'
    if (!selectedTime) errs.time = 'Please select a meeting time'
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
      }, token)

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error(error)
      setErrors({ api: "Failed to schedule appointment. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} title="Make an appointment">
      <div className={styles.content}>
        <h2 className={styles.title}>Make an appointment with&nbsp;a psychologist</h2>
        {errors.api && <div className={styles.apiError}>{errors.api}</div>}
        <p className={styles.subtitle}>
          You are on the verge of changing your life for the better. Fill in the short
          form below to book your personal appointment with a professional psychologist.
          We guarantee confidentiality and respect for your privacy.
        </p>

        <div className={styles.doctorRow}>
          <img
            src={psychologist.avatar}
            alt={psychologist.name}
            className={styles.doctorAvatar}
          />
          <div>
            <p className={styles.doctorLabel}>Your psychologist</p>
            <p className={styles.doctorName}>{psychologist.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.topFields}>
            <div className="input-group">
              <input
                className={`input-field ${errors.name ? 'error' : ''}`}
                placeholder="Name"
                value={form.name}
                onChange={set('name')}
              />
              {errors.name && <span className="input-error-msg">{errors.name}</span>}
            </div>
            <div className="input-group">
              <input
                className={`input-field ${errors.phone ? 'error' : ''}`}
                placeholder="Phone number"
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
              placeholder="Email"
              value={form.email}
              onChange={set('email')}
              type="email"
            />
            {errors.email && <span className="input-error-msg">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label className={styles.timeSectionLabel}>Date</label>
            <MiniCalendar
              selected={selectedDate}
              onChange={setSelectedDate}
              isDisabledDay={(iso) => !isWorkingDay(iso, availability)}
            />
            {errors.date && <span className="input-error-msg">{errors.date}</span>}
          </div>

          <div className="input-group">
            <label className={styles.timeSectionLabel}>
              Meeting time
              {selectedDate && (
                <span className={styles.dateChip}>{formatDateLabel(selectedDate)}</span>
              )}
            </label>
            {!selectedDate ? (
              <p className={styles.selectDateHint}>Select a date first to see available slots</p>
            ) : availableSlots.length === 0 ? (
              <p className={styles.selectDateHint}>No available slots on this day</p>
            ) : (
              <div className={styles.timeGrid}>
                {availableSlots.map((t) => {
                  const isBooked = bookedSlots.includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`${styles.timeSlot} ${selectedTime === t ? styles.selected : ''} ${isBooked ? styles.booked : ''}`}
                      onClick={() => !isBooked && setSelectedTime(t)}
                      disabled={isBooked}
                      title={isBooked ? 'Already booked' : undefined}
                    >
                      {t}
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
              placeholder="Comment"
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
            {loading ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    </Modal>
  )
}
