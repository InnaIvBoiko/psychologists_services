import { useTranslations } from 'next-intl'
import { Link } from '@/lib/router'
import styles from './PrivacyPage.module.css'

export default function PrivacyPage() {
  const t = useTranslations('Privacy')
  // Shared renderer for the <b> chunks embedded in the legal copy.
  const bold = { b: (chunks) => <strong>{chunks}</strong> }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to="/" className={styles.back}>{t('back')}</Link>

        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.updated}>{t('updated')}</p>

        <section className={styles.section}>
          <h2>{t('s1Title')}</h2>
          <p>{t.rich('s1Body', bold)}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('s2Title')}</h2>
          <ul>
            <li>{t.rich('s2Account', bold)}</li>
            <li>{t.rich('s2Appointment', bold)}</li>
            <li>{t.rich('s2Favorites', bold)}</li>
            <li>{t.rich('s2Application', bold)}</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{t('s3Title')}</h2>
          <ul>
            <li>{t('s3Item1')}</li>
            <li>{t('s3Item2')}</li>
            <li>{t('s3Item3')}</li>
            <li>{t('s3Item4')}</li>
            <li>{t('s3Item5')}</li>
            <li>{t('s3Item6')}</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{t('s4Title')}</h2>
          <p>{t.rich('s4Body', bold)}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('s5Title')}</h2>
          <ul>
            <li>{t.rich('s5Neon', bold)}</li>
            <li>{t.rich('s5Vercel', bold)}</li>
            <li>{t.rich('s5Resend', bold)}</li>
          </ul>
          <p>{t('s5Note')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('s6Title')}</h2>
          <p>{t('s6Body')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('s7Title')}</h2>
          <p>{t('s7Intro')}</p>
          <ul>
            <li>{t('s7Item1')}</li>
            <li>{t('s7Item2')}</li>
            <li>{t('s7Item3')}</li>
            <li>{t('s7Item4')}</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{t('s8Title')}</h2>
          <p>{t.rich('s8Body', bold)}</p>
        </section>
      </div>
    </div>
  )
}
