import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useFavorites } from '../../hooks/useFavorites.js'
import AppointmentModal from '../AppointmentModal/AppointmentModal.jsx'
import styles from './PsychologistCard.module.css'

export default function PsychologistCard({ psychologist, onToast }) {
  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [expanded, setExpanded] = useState(false)
  const [showAppointment, setShowAppointment] = useState(false)

  // Derive favorite status directly from the reactive context
  const fav = isFavorite(psychologist)

  const handleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      onToast?.('Please log in to add to favorites')
      return
    }
    // Execute the toggle
    toggleFavorite(psychologist)
  }

  const ratingValue = Number(psychologist.rating) || 0

  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = i < Math.round(ratingValue)
    return (
      <span key={i} className={filled ? styles.starFilled : styles.starEmpty}>
        ★
      </span>
    )
  })

  // Format the image source since Strapi wraps media inside an object
  // If the user uploaded an image from strapi admin panel, the url starts with /uploads
  const avatarUrl = psychologist.image?.url
    ? `${import.meta.env.VITE_STRAPI_URL}${psychologist.image.url}`
    : psychologist.avatar;

  return (
    <>
      <article className={styles.card}>
        {/* Left: avatar */}
        <div className={styles.avatarCol}>
          <div className={styles.avatarWrap}>
            <img
              src={avatarUrl}
              alt={psychologist.name}
              className={styles.avatar}
            />
            <span className={styles.onlineDot} aria-label="Online" />
          </div>
        </div>

        {/* Right: info */}
        <div className={styles.body}>
          {/* Top row */}
          <div className={styles.topRow}>
            <div>
              <p className={styles.categoryLabel}>Psychologist</p>
              <h3 className={styles.name}>{psychologist.name}</h3>
            </div>
            <div className={styles.metaRight}>
              <div className={styles.rating}>
                <span className={styles.starFilled}>★</span>
                <span>{ratingValue.toFixed(2)}</span>
              </div>
              <div className={styles.price}>
                Price / 1 hour:&nbsp;
                <strong>{psychologist.pricePerHour || psychologist.price_per_hour || 0}$</strong>
              </div>
              <button
                className={`${styles.heartBtn} ${fav ? styles.heartActive : ''}`}
                onClick={handleFav}
                aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
                title={fav ? 'Remove from favorites' : 'Add to favorites'}
              >
                ♥
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className={styles.tags}>
            <span className="tag">
              Experience: <strong>{psychologist.experienceYears || psychologist.experience || 0}&nbsp;years</strong>
            </span>
            <span className="tag">
              {psychologist.license}
            </span>
            <span className="tag">
              Specialization: <strong>{psychologist.specialization}</strong>
            </span>
            <span className="tag">
              Initial_consultation: <strong>{psychologist.initial_consultation}</strong>
            </span>
          </div>

          {/* Bio */}
          <p className={`${styles.about} ${expanded ? styles.aboutExpanded : ''}`}>
            {psychologist.about}
          </p>

          {/* Read more / less */}
          <button
            className={styles.readMoreBtn}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>

          {/* Expanded section */}
          {expanded && (
            <div className={styles.expandedSection}>
              {psychologist.reviews && psychologist.reviews.length > 0 && (
                <div className={styles.reviews}>
                  {psychologist.reviews.map((r, i) => (
                    <div key={i} className={styles.reviewItem}>
                      <div className={styles.reviewerRow}>
                        <div className={styles.reviewerAvatar}>
                          {r.reviewer?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div>
                          <p className={styles.reviewerName}>{r.reviewer || 'Anonymous'}</p>
                          <div className={styles.reviewStars}>
                            {Array.from({ length: 5 }, (_, idx) => (
                              <span
                                key={idx}
                                className={idx < r.rating ? styles.starFilled : styles.starEmpty}
                              >
                                ★
                              </span>
                            ))}
                            {r.date && <span className={styles.reviewDate}>{r.date}</span>}
                          </div>
                        </div>
                      </div>
                      <p className={styles.reviewText}>{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={() => setShowAppointment(true)}
              >
                Make an appointment
              </button>
            </div>
          )}
        </div>
      </article>

      {showAppointment && (
        <AppointmentModal
          psychologist={psychologist}
          onClose={() => setShowAppointment(false)}
          onSuccess={() => onToast?.('Appointment booked! We will be in touch.')}
        />
      )}
    </>
  )
}
