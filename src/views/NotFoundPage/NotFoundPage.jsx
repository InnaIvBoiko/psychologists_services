import { useTranslations } from 'next-intl'
import { Link } from '@/lib/router'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  const t = useTranslations('NotFound')
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.code}>
          4<span className={styles.icon}>🧠</span>4
        </div>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.description}>{t('description')}</p>
        <Link to="/" className={styles.btn}>
          {t('home')}
        </Link>
      </div>
    </div>
  )
}
