import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { createAppointment } from '../../strapi/strapi.js'
import Modal from '../Modal/Modal.jsx'
import styles from './AppointmentModal.module.css'

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30',
]

export default function AppointmentModal({ psychologist, onClose, onSuccess }) {
  const { user, token } = useAuth()
  const [form, setForm] = useState({ 
    name: user?.displayName || '', 
    phone: '', 
    email: user?.email || '', 
    comment: '' 
  })
  const [selectedTime, setSelectedTime] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Required'
    if (!form.phone.trim()) errs.phone = 'Required'
    if (!form.email.trim()) errs.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email'
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
        time_slot: selectedTime,
        comment: form.comment.trim(),
        psychologist_id: String(psychologist.id),
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
            <label className={styles.timeSectionLabel}>
              Meeting time
            </label>
            <div className={styles.timeGrid}>
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${styles.timeSlot} ${selectedTime === t ? styles.selected : ''}`}
                  onClick={() => setSelectedTime(t)}
                >
                  {t}
                </button>
              ))}
            </div>
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
