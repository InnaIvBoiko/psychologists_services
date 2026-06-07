import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/router'
import { useAuth } from '../../context/AuthContext.jsx'
import { submitPsychologistApplication } from '@/lib/api'
import { DEFAULT_AVAILABILITY } from '../../utils/availability.js'
import Modal from '../Modal/Modal.jsx'
import AuthModal from '../AuthModal/AuthModal.jsx'
import AvailabilityEditor from '../AvailabilityEditor/AvailabilityEditor.jsx'
import styles from './ApplyModal.module.css'

// Best-effort split of a display name into first/last for pre-filling the form.
function splitName(displayName = '') {
  const parts = displayName.trim().split(/\s+/)
  return { name: parts[0] || '', surname: parts.slice(1).join(' ') }
}

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
  const t = useTranslations('ApplyModal')
  const { user, register: registerUser } = useAuth()
  const [form, setForm] = useState(() => ({ ...INITIAL_FORM, ...splitName(user?.displayName) }))
  const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY)
  const [consent, setConsent] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [authMode, setAuthMode] = useState(null) // inline auth modal: null | 'login' | 'register'

  // If the user logs in while the apply form is open (via the inline login modal),
  // pre-fill their name from the account — but never overwrite anything they typed.
  useEffect(() => {
    if (!user) return
    setForm((prev) => {
      if (prev.name || prev.surname) return prev
      return { ...prev, ...splitName(user.displayName) }
    })
  }, [user])
  const [submitted, setSubmitted] = useState(false)

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = t('errRequired')
    if (!form.surname.trim()) errs.surname = t('errRequired')
    if (!form.specialization) errs.specialization = t('errRequired')
    if (!form.experience || isNaN(Number(form.experience)) || Number(form.experience) < 0)
      errs.experience = t('errValidYears')
    if (!form.license.trim()) errs.license = t('errRequired')
    if (!form.price_per_hour || isNaN(Number(form.price_per_hour)) || Number(form.price_per_hour) <= 0)
      errs.price_per_hour = t('errValidPrice')
    if (!form.about.trim() || form.about.trim().length < 50)
      errs.about = t('errAboutMin')
    if (!consent) errs.consent = t('errConsent')
    if (!user) {
      if (!email.trim()) errs.email = t('errEmailRequired')
      else if (!/\S+@\S+\.\S+/.test(email)) errs.email = t('errEmailInvalid')
      if (!password) errs.password = t('errPasswordRequired')
      else if (password.length < 8) errs.password = t('errPasswordShort')
    }
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)

    let userEmail = user?.email

    // Not logged in: create account first (auto-login happens inside registerUser)
    if (!user) {
      try {
        await registerUser(
          `Dr. ${form.name.trim()} ${form.surname.trim()}`,
          email.trim(),
          password
        )
        userEmail = email.trim()
      } catch (err) {
        const msg = (err.message || '').toLowerCase()
        if (msg.includes('taken') || msg.includes('email') || msg.includes('username')) {
          setErrors({ email: t('errEmailTaken') })
        } else {
          setErrors({ api: err.message || t('errAccount') })
        }
        setLoading(false)
        return
      }
    }

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
        availability,
        rating: 0,
        popular: false,
        isAvailable: true,
        user_email: userEmail,
      })

      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setErrors({ api: t('errApi') })
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Modal onClose={onClose} title={t('successHeading')}>
        <div className={styles.success}>
          <div className={styles.successIcon} aria-hidden="true">🎉</div>
          <h3 className={styles.successTitle}>{t('successTitle')}</h3>
          <p className={styles.successText}>{t('successText')}</p>
          <button className="btn btn-center" onClick={onClose} style={{ marginTop: 8 }}>
            {t('close')}
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <>
    <Modal onClose={onClose} title={t('title')}>
      <div className={styles.content}>
        <p className={styles.subtitle}>{t('subtitle')}</p>

        <div className={styles.notice}>
          <span className={styles.noticeIcon} aria-hidden="true">ℹ️</span>
          {t('notice')}
        </div>

        {errors.api && <div className={styles.apiError}>{errors.api}</div>}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <p className={styles.sectionLabel}>{t('sectionPersonal')}</p>
          <div className={styles.row}>
            <div className="input-group">
              <input
                className={`input-field ${errors.name ? 'error' : ''}`}
                placeholder={t('firstName')}
                aria-label={t('firstName')}
                value={form.name}
                onChange={set('name')}
              />
              {errors.name && <span className="input-error-msg">{errors.name}</span>}
            </div>
            <div className="input-group">
              <input
                className={`input-field ${errors.surname ? 'error' : ''}`}
                placeholder={t('lastName')}
                aria-label={t('lastName')}
                value={form.surname}
                onChange={set('surname')}
              />
              {errors.surname && <span className="input-error-msg">{errors.surname}</span>}
            </div>
          </div>

          <div className="input-group">
            <input
              className="input-field"
              placeholder={t('photoUrl')}
              aria-label={t('photoUrl')}
              value={form.avatar}
              onChange={set('avatar')}
              type="url"
            />
          </div>

          {/* Logged in: confirm which account is applying (no account fields needed). */}
          {user && (
            <p className={styles.accountHint}>
              {t.rich('applyingAs', {
                email: user.email,
                b: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
          )}

          {/* Account creation — only for non-logged-in users */}
          {!user && (
            <>
              <p className={styles.sectionLabel}>{t('sectionAccount')}</p>
              <p className={styles.accountHint}>
                {t.rich('accountHint', {
                  login: (chunks) => (
                    <button type="button" className={styles.loginHintBtn} onClick={() => setAuthMode('login')}>{chunks}</button>
                  ),
                })}
              </p>
              <div className="input-group">
                <input
                  className={`input-field ${errors.email ? 'error' : ''}`}
                  type="email"
                  placeholder={t('email')}
                  aria-label={t('email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                {errors.email && <span className="input-error-msg">{errors.email}</span>}
              </div>
              <div className="input-group">
                <div className="input-wrapper">
                  <input
                    className={`input-field ${errors.password ? 'error' : ''}`}
                    type={showPass ? 'text' : 'password'}
                    placeholder={t('password')}
                    aria-label={t('password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="input-toggle-btn"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? t('hidePassword') : t('showPassword')}
                  >
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
                {errors.password && <span className="input-error-msg">{errors.password}</span>}
              </div>
            </>
          )}

          <p className={styles.sectionLabel}>{t('sectionProfessional')}</p>
          <div className="input-group">
            <select
              className={`input-field ${errors.specialization ? 'error' : ''}`}
              value={form.specialization}
              onChange={set('specialization')}
              aria-label={t('selectSpecialization')}
            >
              <option value="">{t('selectSpecialization')}</option>
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
                placeholder={t('yearsExperience')}
                aria-label={t('yearsExperience')}
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
                placeholder={t('licenseNumber')}
                aria-label={t('licenseNumber')}
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
                placeholder={t('pricePerHour')}
                aria-label={t('pricePerHour')}
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
                placeholder={t('initialConsultation')}
                aria-label={t('initialConsultation')}
                value={form.initial_consultation}
                onChange={set('initial_consultation')}
              />
            </div>
          </div>

          <p className={styles.sectionLabel}>{t('sectionAvailability')}</p>
          <p className={styles.availabilityHint}>{t('availabilityHint')}</p>
          <AvailabilityEditor value={availability} onChange={setAvailability} />

          <p className={styles.sectionLabel}>{t('sectionAbout')}</p>
          <div className="input-group">
            <textarea
              className={`input-field ${errors.about ? 'error' : ''}`}
              placeholder={t('aboutPlaceholder')}
              aria-label={t('aboutPlaceholder')}
              value={form.about}
              onChange={set('about')}
              rows={4}
            />
            {errors.about && <span className="input-error-msg">{errors.about}</span>}
          </div>

          <div className="input-group">
            <label className={styles.consentLabel}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className={styles.consentCheckbox}
              />
              <span>
                {t.rich('consent', {
                  privacy: (chunks) => (
                    <Link to="/privacy" target="_blank" className={styles.consentLink}>{chunks}</Link>
                  ),
                })}
              </span>
            </label>
            {errors.consent && <span className="input-error-msg">{errors.consent}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? t('submitting') : t('submit')}
          </button>
        </form>
      </div>
    </Modal>

    {authMode && (
      <AuthModal
        mode={authMode}
        onClose={() => setAuthMode(null)}
        onSwitchMode={(m) => setAuthMode(m)}
      />
    )}
    </>
  )
}
