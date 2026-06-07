import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/router'
import { useAuth } from '../../context/AuthContext.jsx'
import Modal from '../Modal/Modal.jsx'
import styles from './AuthModal.module.css'

export default function AuthModal({ mode, onClose, onSwitchMode }) {
  const t = useTranslations('AuthModal')
  const { login, register } = useAuth()
  const isLogin = mode === 'login'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const validate = () => {
    const errs = {}
    if (!isLogin && !name.trim()) errs.name = t('errNameRequired')
    if (!email.trim()) errs.email = t('errEmailRequired')
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = t('errEmailInvalid')
    if (!password) errs.password = t('errPasswordRequired')
    // Min length is a registration policy; don't lock out existing accounts on login.
    else if (!isLogin && password.length < 8) errs.password = t('errPasswordShort')
    if (!isLogin && !consent) errs.consent = t('errConsentRequired')
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setServerError('')
    setLoading(true)
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(name, email, password)
      }
      onClose()
    } catch (err) {
      setServerError(friendlyError(err.message, t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} title={isLogin ? t('loginTitle') : t('registerTitle')}>
      <div className={styles.content}>
        <h2 className={styles.title}>{isLogin ? t('loginTitle') : t('registerTitle')}</h2>
        <p className={styles.subtitle}>
          {isLogin ? t('loginSubtitle') : t('registerSubtitle')}
        </p>

        {isLogin && (
          <div className={styles.demoBox}>
            <span className={styles.demoTitle}>{t('demoTitle')}</span>
            <code className={styles.demoCreds}>admin@example.com · Password123!</code>
            <button
              type="button"
              className={styles.demoFill}
              onClick={() => { setEmail('admin@example.com'); setPassword('Password123!') }}
            >
              {t('demoFill')}
            </button>
          </div>
        )}

        {serverError && <p className={styles.serverError}>{serverError}</p>}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {!isLogin && (
            <div className="input-group">
              <input
                className={`input-field ${errors.name ? 'error' : ''}`}
                type="text"
                placeholder={t('namePlaceholder')}
                aria-label={t('namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
              {errors.name && <span className="input-error-msg">{errors.name}</span>}
            </div>
          )}

          <div className="input-group">
            <input
              className={`input-field ${errors.email ? 'error' : ''}`}
              type="email"
              placeholder={t('emailPlaceholder')}
              aria-label={t('emailPlaceholder')}
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
                placeholder={t('passwordPlaceholder')}
                aria-label={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
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

          {!isLogin && (
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
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? t('submitting') : isLogin ? t('submitLogin') : t('submitRegister')}
          </button>
        </form>

        <p className={styles.switchText}>
          {isLogin ? t('switchToRegister') : t('switchToLogin')}
          <button
            className={styles.switchBtn}
            type="button"
            onClick={() => onSwitchMode(isLogin ? 'register' : 'login')}
          >
            {isLogin ? t('switchRegister') : t('switchLogin')}
          </button>
        </p>
      </div>
    </Modal>
  )
}

// Maps known backend error messages to friendly, localized copy.
function friendlyError(message, t) {
  if (!message) return t('errGeneric')

  const msgLower = message.toLowerCase()

  if (msgLower.includes('email') && msgLower.includes('taken')) return t('errEmailTaken')
  if (msgLower.includes('username') && msgLower.includes('taken')) return t('errNameTaken')
  if (msgLower.includes('invalid identifier or password')) return t('errInvalidCredentials')
  if (msgLower.includes('network error')) return t('errNetwork')

  return message
}
