import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <p className={styles.disclaimer}>
          ⚠️ <strong>Demo project.</strong> All psychologist profiles, reviews,
          ratings, prices and availability shown on this site are fictional
          examples created for demonstration purposes only. They do not
          represent real people, licensed professionals, or actual services.
        </p>
        <div className={styles.footerMeta}>
          <p className={styles.footerAuthor}>
            Designed &amp; developed by <strong>Inna Boiko</strong>
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
