import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { submitPsychologistApplication } from '../../strapi/strapi.js'
import { DEFAULT_AVAILABILITY } from '../../utils/availability.js'
import Modal from '../Modal/Modal.jsx'
import AvailabilityEditor from '../AvailabilityEditor/AvailabilityEditor.jsx'
import styles from './ApplyModal.module.css'

const SPECIALIZATIONS = [
  'Anxiety & Stress',
  'Depression & Mood',
  'Trauma & PTSD',
  'Relationships & Family',
  'Child & Adolescent',
  'Addiction & Recovery',
  'Grief & Loss',
  'LGBTQ+',
  'Career & Life Coaching',
  'Other',
]

const INITIAL_FORM = {
  name: '',
  surname: '',
  specialization: '',
  experience: '',
  license: '',
  price_per_hour: '',
  initial_consultation: '',
  avatar: '',
  about: '',
}

export default function ApplyModal({ onClose }) {
  const { token } = useAuth()
  const [form, setForm] = useState(INITIAL_FORM)
  const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Required'
    if (!form.surname.trim()) errs.surname = 'Required'
    if (!form.specialization) errs.specialization = 'Required'
    if (!form.experience || isNaN(Number(form.experience)) || Number(form.experience) < 0)
      errs.experience = 'Enter valid years'
    if (!form.license.trim()) errs.license = 'Required'
    if (!form.price_per_hour || isNaN(Number(form.price_per_hour)) || Number(form.price_per_hour) <= 0)
      errs.price_per_hour = 'Enter valid price'
    if (!form.about.trim() || form.about.trim().length < 50)
      errs.about = 'Please write at least 50 characters'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)

    try {
      await submitPsychologistApplication({
        name: `Dr. ${form.name.trim()} ${form.surname.trim()}`,
        surname: form.surname.trim(),
        specialization: form.specialization,
        experience: Number(form.experience),
        license: `Licensed Psychologist (${form.license.trim()})`,
        price_per_hour: Number(form.price_per_hour),
        initial_consultation: form.initial_consultation.trim() || 'Free consultation',
        avatar: form.avatar.trim() || null,
        about: form.about.trim(),
        // availability is sent only after the backend schema is deployed to Strapi Cloud
        // availability,
        rating: 0,
        popular: false,
        isAvailable: true,
      }, token)

      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setErrors({ api: 'Failed to submit application. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Modal onClose={onClose} title="Application submitted">
        <div className={styles.success}>
          <div className={styles.successIcon}>🎉</div>
          <h3 className={styles.successTitle}>Thank you for applying!</h3>
          <p className={styles.successText}>
            Your application has been received and is under review.
            Our team will contact you within 2–3 business days.
          </p>
          <button className="btn btn-center" onClick={onClose} style={{ marginTop: 8 }}>
            Close
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose} title="Apply as a Psychologist">
      <div className={styles.content}>
        <p className={styles.subtitle}>
          Join our platform and help people with their mental health.
          Fill in your professional details below.
        </p>

        <div className={styles.notice}>
          <span className={styles.noticeIcon}>ℹ️</span>
          Your profile will be reviewed by our team before being published.
          This usually takes 2–3 business days.
        </div>

        {errors.api && <div className={styles.apiError}>{errors.api}</div>}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <p className={styles.sectionLabel}>Personal info</p>
          <div className={styles.row}>
            <div className="input-group">
              <input
                className={`input-field ${errors.name ? 'error' : ''}`}
                placeholder="First name"
                value={form.name}
                onChange={set('name')}
              />
              {errors.name && <span className="input-error-msg">{errors.name}</span>}
            </div>
            <div className="input-group">
              <input
                className={`input-field ${errors.surname ? 'error' : ''}`}
                placeholder="Last name"
                value={form.surname}
                onChange={set('surname')}
              />
              {errors.surname && <span className="input-error-msg">{errors.surname}</span>}
            </div>
          </div>

          <div className="input-group">
            <input
              className="input-field"
              placeholder="Photo URL (optional)"
              value={form.avatar}
              onChange={set('avatar')}
              type="url"
            />
          </div>

          <p className={styles.sectionLabel}>Professional details</p>
          <div className="input-group">
            <select
              className={`input-field ${errors.specialization ? 'error' : ''}`}
              value={form.specialization}
              onChange={set('specialization')}
            >
              <option value="">Select specialization</option>
              {SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.specialization && <span className="input-error-msg">{errors.specialization}</span>}
          </div>

          <div className={styles.row}>
            <div className="input-group">
              <input
                className={`input-field ${errors.experience ? 'error' : ''}`}
                placeholder="Years of experience"
                value={form.experience}
                onChange={set('experience')}
                type="number"
                min="0"
                max="60"
              />
              {errors.experience && <span className="input-error-msg">{errors.experience}</span>}
            </div>
            <div className="input-group">
              <input
                className={`input-field ${errors.license ? 'error' : ''}`}
                placeholder="License number"
                value={form.license}
                onChange={set('license')}
              />
              {errors.license && <span className="input-error-msg">{errors.license}</span>}
            </div>
          </div>

          <div className={styles.row}>
            <div className="input-group">
              <input
                className={`input-field ${errors.price_per_hour ? 'error' : ''}`}
                placeholder="Price per hour ($)"
                value={form.price_per_hour}
                onChange={set('price_per_hour')}
                type="number"
                min="1"
              />
              {errors.price_per_hour && <span className="input-error-msg">{errors.price_per_hour}</span>}
            </div>
            <div className="input-group">
              <input
                className="input-field"
                placeholder='Initial consultation (e.g. "Free")'
                value={form.initial_consultation}
                onChange={set('initial_consultation')}
              />
            </div>
          </div>

          <p className={styles.sectionLabel}>Availability</p>
          <p className={styles.availabilityHint}>
            Set your working hours. Patients will only be able to book slots within these times.
          </p>
          <AvailabilityEditor value={availability} onChange={setAvailability} />

          <p className={styles.sectionLabel}>About you</p>
          <div className="input-group">
            <textarea
              className={`input-field ${errors.about ? 'error' : ''}`}
              placeholder="Describe your approach, methods, and experience (min. 50 characters)"
              value={form.about}
              onChange={set('about')}
              rows={4}
            />
            {errors.about && <span className="input-error-msg">{errors.about}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Submitting…' : 'Submit application'}
          </button>
        </form>
      </div>
    </Modal>
  )
}
