import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '../../context/AuthContext.jsx'
import { addReview } from '@/lib/api'
import Modal from '../Modal/Modal.jsx'
import styles from './ReviewModal.module.css'

export default function ReviewModal({ appointment, onClose, onSubmitted }) {
  const t = useTranslations('ReviewModal')
  const { user, token } = useAuth()
  const [reviewer, setReviewer] = useState(
    appointment.patient_name || user?.displayName || user?.username || ''
  )
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reviewer.trim()) { setError(t('errName')); return }
    if (!rating) { setError(t('errRating')); return }
    if (!comment.trim()) { setError(t('errComment')); return }
    setLoading(true)
    setError('')
    try {
      await addReview(
        appointment.psychologist_id,
        {
          reviewer: reviewer.trim(),
          rating,
          comment: comment.trim(),
        },
        token
      )
      window.dispatchEvent(new CustomEvent('psy:review-submitted'))
      onSubmitted?.(appointment.id)
      onClose()
    } catch (err) {
      setError(t('errSubmit'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} title={t('title')}>
      <div className={styles.content}>
        <p className={styles.doctorName}>{appointment.psychologist_name}</p>
        <p className={styles.subtitle}>{t('subtitle')}</p>

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <input
            className="input-field"
            placeholder={t('namePlaceholder')}
            aria-label={t('namePlaceholder')}
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
          />

          <div className={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`${styles.star} ${star <= (hovered || rating) ? styles.starFilled : ''}`}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
                aria-label={t('starLabel', { count: star })}
              >
                ★
              </button>
            ))}
            {rating > 0 && (
              <span className={styles.ratingLabel}>
                {t(`rating${rating}`)}
              </span>
            )}
          </div>

          <textarea
            className={`input-field ${styles.textarea}`}
            placeholder={t('commentPlaceholder')}
            aria-label={t('commentPlaceholder')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />

          {error && <p className={styles.error}>{error}</p>}

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
  )
}
