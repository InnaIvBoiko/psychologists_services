import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import Modal from '../Modal/Modal.jsx'
import styles from './AuthModal.module.css'

export default function AuthModal({ mode, onClose, onSwitchMode }) {
  const { login, register } = useAuth()
  const isLogin = mode === 'login'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const validate = () => {
    const errs = {}
    if (!isLogin && !name.trim()) errs.name = 'Name is required'
    if (!email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email'
    if (!password) errs.password = 'Password is required'
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters'
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
      // Strapi errors are thrown as Error objects with the message string
      setServerError(friendlyError(err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} title={isLogin ? 'Log In' : 'Registration'}>
      <div className={styles.content}>
        <h2 className={styles.title}>{isLogin ? 'Log In' : 'Registration'}</h2>
        <p className={styles.subtitle}>
          {isLogin
            ? 'Welcome back! Please log in to your account.'
            : 'Create your account to access all features.'}
        </p>

        {serverError && <p className={styles.serverError}>{serverError}</p>}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {!isLogin && (
            <div className="input-group">
              <input
                className={`input-field ${errors.name ? 'error' : ''}`}
                type="text"
                placeholder="Name"
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
              placeholder="Email"
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
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="input-toggle-btn"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password && <span className="input-error-msg">{errors.password}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Please wait…' : isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <p className={styles.switchText}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            className={styles.switchBtn}
            type="button"
            onClick={() => onSwitchMode(isLogin ? 'register' : 'login')}
          >
            {isLogin ? 'Register' : 'Log In'}
          </button>
        </p>
      </div>
    </Modal>
  )
}

function friendlyError(message) {
  if (!message) return 'Something went wrong. Please try again.'
  
  const msgLower = message.toLowerCase()
  
  if (msgLower.includes('email') && msgLower.includes('taken')) return 'This email is already registered.'
  if (msgLower.includes('username') && msgLower.includes('taken')) return 'This name is already taken.'
  if (msgLower.includes('invalid identifier or password')) return 'Invalid email or password.'
  if (msgLower.includes('network error')) return 'Network error. Check your connection.'
  
  return message
}
