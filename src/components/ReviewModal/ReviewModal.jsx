import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { addReview } from '../../strapi/strapi.js'
import Modal from '../Modal/Modal.jsx'
import styles from './ReviewModal.module.css'

export default function ReviewModal({ appointment, onClose, onSubmitted }) {
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
    if (!reviewer.trim()) { setError('Please enter your name'); return }
    if (!rating) { setError('Please select a rating'); return }
    if (!comment.trim()) { setError('Please write a comment'); return }
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
      onSubmitted?.(appointment.id)
      onClose()
    } catch (err) {
      setError('Failed to submit review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} title="Leave a review">
      <div className={styles.content}>
        <p className={styles.doctorName}>{appointment.psychologist_name}</p>
        <p className={styles.subtitle}>How was your session? Your feedback helps others find the right psychologist.</p>

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <input
            className="input-field"
            placeholder="Your name"
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
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
            {rating > 0 && (
              <span className={styles.ratingLabel}>
                {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating]}
              </span>
            )}
          </div>

          <textarea
            className={`input-field ${styles.textarea}`}
            placeholder="Share your experience with this psychologist…"
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
            {loading ? 'Submitting…' : 'Submit review'}
          </button>
        </form>
      </div>
    </Modal>
  )
}
