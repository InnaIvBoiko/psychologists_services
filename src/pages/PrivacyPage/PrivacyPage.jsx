import { Link } from 'react-router-dom'
import styles from './PrivacyPage.module.css'

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to="/" className={styles.back}>← Back to Home</Link>

        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: March 15, 2026</p>

        <section className={styles.section}>
          <h2>1. Introduction</h2>
          <p>
            Psychologists.Services ("we", "us", or "our") is committed to protecting your personal data.
            This Privacy Policy explains what information we collect, why we collect it, and how we use it
            when you use our platform at <strong>psychologists-services-98v1.vercel.app</strong>.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. Data We Collect</h2>
          <ul>
            <li><strong>Account data:</strong> name and email address provided during registration.</li>
            <li><strong>Appointment data:</strong> date, time, and the name of the psychologist you book with.</li>
            <li><strong>Favorites:</strong> the list of psychologists you save as favourites.</li>
            <li><strong>Usage data:</strong> pages visited and actions taken, collected via cookies for functional purposes only.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>3. How We Use Your Data</h2>
          <ul>
            <li>To create and manage your account.</li>
            <li>To book and manage appointments with psychologists.</li>
            <li>To save your favourite psychologists across sessions.</li>
            <li>To send you appointment reminders and confirmations.</li>
            <li>To improve the platform based on usage patterns.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>4. Cookies</h2>
          <p>
            We use strictly necessary cookies to keep you logged in and remember your preferences
            (e.g. cookie consent choice). We do not use advertising or tracking cookies.
            You can decline cookies via the banner — note that declining may prevent you from staying logged in.
          </p>
        </section>

        <section className={styles.section}>
          <h2>5. Third-Party Services</h2>
          <ul>
            <li>
              <strong>Strapi Cloud</strong> — our backend and database provider. Your data is stored on
              Strapi&apos;s managed infrastructure.
            </li>
            <li>
              <strong>Vercel</strong> — our frontend hosting provider. Network request logs may be
              retained by Vercel for security purposes.
            </li>
            <li>
              <strong>UptimeRobot</strong> — an uptime monitoring service that periodically pings
              our backend health endpoint (<code>/_health</code>) to prevent cold starts. No personal
              data is transmitted in these requests.
            </li>
          </ul>
          <p>We do not sell or share your personal data with any other third parties.</p>
        </section>

        <section className={styles.section}>
          <h2>6. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. Appointments are kept
            for up to 60 days after their date for review purposes, then removed from active views.
            You may request deletion of your account and all associated data at any time.
          </p>
        </section>

        <section className={styles.section}>
          <h2>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your account and data.</li>
            <li>Withdraw consent at any time (this will not affect the lawfulness of prior processing).</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>8. Contact</h2>
          <p>
            For any privacy-related questions or requests, please contact us at{' '}
            <strong>privacy@psychologists.services</strong>.
          </p>
        </section>
      </div>
    </div>
  )
}
