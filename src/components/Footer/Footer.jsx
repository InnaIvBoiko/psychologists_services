import { useTranslations } from 'next-intl'
import styles from './Footer.module.css'

export default function Footer() {
  const t = useTranslations('Footer')
  return (
    <footer className={styles.footer}>
      <div className="container">
        <p className={styles.disclaimer}>
          ⚠️ {t.rich('disclaimer', { b: (chunks) => <strong>{chunks}</strong> })}
        </p>
        <div className={styles.footerMeta}>
          <p className={styles.footerAuthor}>
            {t.rich('author', { b: (chunks) => <strong>{chunks}</strong> })}
          </p>
          <div className={styles.footerLinks}>
            <a href="mailto:inna_boiko@libero.it">inna_boiko@libero.it</a>
            <span className={styles.footerDot}>•</span>
            <a
              href="https://www.linkedin.com/in/inna-boiko"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            <span className={styles.footerDot}>•</span>
            <a
              href="https://github.com/InnaIvBoiko"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
