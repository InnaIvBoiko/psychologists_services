import { useState } from 'react'
import Modal from '../Modal/Modal.jsx'
import styles from './DeleteAccountModal.module.css'

export default function DeleteAccountModal({ onClose, onConfirm, isPsychologist }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      await onConfirm()
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} title="Delete account">
      <div className={styles.content}>
        <div className={styles.icon}>⚠️</div>
        <h2 className={styles.title}>Delete your account?</h2>
        <p className={styles.text}>
          This will permanently delete your account and all associated data,
          including your appointments and favourites.
          <strong> This action cannot be undone.</strong>
        </p>

        {isPsychologist && (
          <div className={styles.psychologistNotice}>
            <span className={styles.psychologistNoticeIcon}>🩺</span>
            <p>
              Your psychologist profile is currently listed on the platform.
              It will be <strong>removed from the listings within 2–3 business days</strong>.
              You will be contacted at your registered email once it is taken down.
            </p>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={styles.deleteBtn}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting…' : 'Yes, delete my account'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
