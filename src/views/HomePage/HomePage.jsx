import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useNavigate } from '@/lib/router'
import ApplyModal from '../../components/ApplyModal/ApplyModal.jsx'
import LanguageSwitcher from '../../components/Header/LanguageSwitcher.jsx'
import styles from './HomePage.module.css'

export default function HomePage() {
  const navigate = useNavigate()
  const t = useTranslations('Home')
  const [applyOpen, setApplyOpen] = useState(false)

  const features = [
    { icon: '🔍', title: t('feature1Title'), desc: t('feature1Desc') },
    { icon: '⭐', title: t('feature2Title'), desc: t('feature2Desc') },
    { icon: '📅', title: t('feature3Title'), desc: t('feature3Desc') },
    { icon: '💬', title: t('feature4Title'), desc: t('feature4Desc') },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroContent}>
            <div className={styles.badgeRow}>
              <span className={styles.badge}>{t('badge')}</span>
              <LanguageSwitcher />
            </div>
            <h1 className={styles.headline}>
              {t.rich('headline', {
                accent: (chunks) => <span className={styles.accent}>{chunks}</span>,
                br: () => <br />,
              })}
            </h1>
            <p className={styles.description}>{t('description')}</p>
            <div className={styles.ctas}>
              <button
                className="btn btn-primary"
                style={{ fontSize: '1.05rem', padding: '14px 36px' }}
                onClick={() => navigate('/psychologists')}
              >
                {t('getStarted')}
              </button>
              <button
                className="btn btn-outline"
                style={{ fontSize: '1.05rem', padding: '14px 36px' }}
                onClick={() => navigate('/psychologists')}
              >
                {t('viewPsychologists')}
              </button>
            </div>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <strong>15+</strong>
                <span>{t('statSpecialists')}</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <strong>4.7 ⭐</strong>
                <span>{t('statRating')}</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <strong>100%</strong>
                <span>{t('statConfidential')}</span>
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
                  <p className={styles.heroPsychLabel}>{t('cardLabel')}</p>
                  <p className={styles.heroPsychName}>Dr. Sarah Davis</p>
                </div>
                <div className={styles.heroRating}>⭐ 4.80</div>
              </div>
              <div className={styles.heroTags}>
                <span className="tag">{t('cardExperience')} <strong>{t('cardYears', { count: 12 })}</strong></span>
                <span className="tag"><strong>Depression & Mood</strong></span>
              </div>
              <p className={styles.heroBio}>{t('cardBio')}</p>
              <div className={styles.heroPrice}>{t('cardPrice')} <strong>120$</strong></div>
            </div>

            <div className={styles.floatBadge1}>
              <span>✓</span> {t('floatConsultation')}
            </div>
            <div className={styles.floatBadge2}>
              <span>🔒</span> {t('floatConfidential')}
            </div>
          </div>
        </div>
      </div>

      {/* Join as psychologist CTA */}
      <div className={styles.joinSection}>
        <div className="container">
          <div className={styles.joinInner}>
            <div className={styles.joinContent}>
              <h2 className={styles.joinTitle}>{t('joinTitle')}</h2>
              <p className={styles.joinDesc}>{t('joinDesc')}</p>
              <ul className={styles.joinPerks}>
                <li>✓ {t('joinPerk1')}</li>
                <li>✓ {t('joinPerk2')}</li>
                <li>✓ {t('joinPerk3')}</li>
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
              {t('applyNow')}
            </button>
          </div>
        </div>
      </div>

      {/* Features strip */}
      <div className={styles.features}>
        <div className="container">
          <div className={styles.featureGrid}>
            {features.map((f) => (
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
