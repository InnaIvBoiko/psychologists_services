import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ApplyModal from '../../components/ApplyModal/ApplyModal.jsx'
import styles from './HomePage.module.css'

export default function HomePage() {
  const navigate = useNavigate()
  const [applyOpen, setApplyOpen] = useState(false)

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroContent}>
            <span className={styles.badge}>🌿 Mental Health Support</span>
            <h1 className={styles.headline}>
              The road to the&nbsp;
              <span className={styles.accent}>healthy mind</span>
              <br />starts here
            </h1>
            <p className={styles.description}>
              Welcome to Psychologists.Services — your trusted platform for
              finding licensed psychologists who truly understand you. Browse
              verified profiles, read reviews, and book appointments in minutes.
            </p>
            <div className={styles.ctas}>
              <button
                className="btn btn-primary"
                style={{ fontSize: '1.05rem', padding: '14px 36px' }}
                onClick={() => navigate('/psychologists')}
              >
                Get started
              </button>
              <button
                className="btn btn-outline"
                style={{ fontSize: '1.05rem', padding: '14px 36px' }}
                onClick={() => navigate('/psychologists')}
              >
                View psychologists
              </button>
            </div>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <strong>15+</strong>
                <span>Verified specialists</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <strong>4.7 ⭐</strong>
                <span>Average rating</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <strong>100%</strong>
                <span>Confidential</span>
              </div>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroCard}>
              <div className={styles.heroCardTop}>
                <div className={styles.heroAvatarWrap}>
                  <img
                    src="https://randomuser.me/api/portraits/women/44.jpg"
                    alt="Dr. Sarah Davis"
                    className={styles.heroAvatar}
                  />
                  <span className={styles.heroOnline} />
                </div>
                <div>
                  <p className={styles.heroPsychLabel}>Psychologist</p>
                  <p className={styles.heroPsychName}>Dr. Sarah Davis</p>
                </div>
                <div className={styles.heroRating}>⭐ 4.80</div>
              </div>
              <div className={styles.heroTags}>
                <span className="tag">Experience: <strong>12 years</strong></span>
                <span className="tag"><strong>Depression & Mood</strong></span>
              </div>
              <p className={styles.heroBio}>
                Empathetic, experienced, and deeply committed to your mental wellness journey.
              </p>
              <div className={styles.heroPrice}>Price / 1 hour: <strong>120$</strong></div>
            </div>

            <div className={styles.floatBadge1}>
              <span>✓</span> Free initial consultation
            </div>
            <div className={styles.floatBadge2}>
              <span>🔒</span> 100% Confidential
            </div>
          </div>
        </div>
      </div>

      {/* Join as psychologist CTA */}
      <div className={styles.joinSection}>
        <div className="container">
          <div className={styles.joinInner}>
            <div className={styles.joinContent}>
              <h2 className={styles.joinTitle}>Are you a licensed psychologist?</h2>
              <p className={styles.joinDesc}>
                Join our platform and connect with patients who need your expertise.
                Simple onboarding, flexible schedule, and a growing community of mental health professionals.
              </p>
              <ul className={styles.joinPerks}>
                <li>✓ Free profile listing</li>
                <li>✓ Online appointment management</li>
                <li>✓ Reviewed & published within 2–3 days</li>
              </ul>
            </div>
            <button
              className="btn"
              style={{
                fontSize: '1rem',
                padding: '14px 36px',
                flexShrink: 0,
                background: '#fff',
                color: '#e06818',
                fontWeight: 700,
                borderRadius: 'var(--radius-btn)',
              }}
              onClick={() => setApplyOpen(true)}
            >
              Apply now
            </button>
          </div>
        </div>
      </div>

      {/* Features strip */}
      <div className={styles.features}>
        <div className="container">
          <div className={styles.featureGrid}>
            {[
              { icon: '🔍', title: 'Find & Filter', desc: 'Search by specialization, price, and experience' },
              { icon: '⭐', title: 'Trusted Reviews', desc: 'Verified patient reviews and ratings' },
              { icon: '📅', title: 'Easy Booking', desc: 'Book your session in just a few clicks' },
              { icon: '💬', title: 'Confidential', desc: 'Your privacy is our top priority' },
            ].map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {applyOpen && <ApplyModal onClose={() => setApplyOpen(false)} />}
    </div>
  )
}
