import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Modal from '../Modal/Modal.jsx'
import styles from './DeleteAccountModal.module.css'

export default function DeleteAccountModal({ onClose, onConfirm, isPsychologist }) {
  const t = useTranslations('DeleteAccountModal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      await onConfirm()
    } catch (err) {
      setError(err.message || t('genericError'))
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} title={t('title')}>
      <div className={styles.content}>
        <div className={styles.icon} aria-hidden="true">⚠️</div>
        <h2 className={styles.title}>{t('heading')}</h2>
        <p className={styles.text}>
          {t.rich('text', { b: (chunks) => <strong>{chunks}</strong> })}
        </p>

        {isPsychologist && (
          <div className={styles.psychologistNotice}>
            <span className={styles.psychologistNoticeIcon} aria-hidden="true">🩺</span>
            <p>{t.rich('psychologistNotice', { b: (chunks) => <strong>{chunks}</strong> })}</p>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={loading}
          >
            {t('cancel')}
          </button>
          <button
            className={styles.deleteBtn}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? t('deleting') : t('confirm')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
