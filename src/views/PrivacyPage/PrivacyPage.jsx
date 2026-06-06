import { Link } from '@/lib/router'
import styles from './PrivacyPage.module.css'

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to="/" className={styles.back}>← Back to Home</Link>

        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: June 6, 2026</p>

        <section className={styles.section}>
          <h2>1. Introduction</h2>
          <p>
            Psychologists.Services (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your personal data.
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
            <li><strong>Application data:</strong> if you apply as a psychologist, the professional details you submit (name, specialization, licence, price, bio, availability).</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>3. How We Use Your Data</h2>
          <ul>
            <li>To create and manage your account.</li>
            <li>To book and manage appointments with psychologists.</li>
            <li>To save your favourite psychologists across sessions.</li>
            <li>To show your booked appointments in the notification area.</li>
            <li>To process and manage psychologist applications.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>4. Cookies</h2>
          <p>
            We use only <strong>strictly necessary cookies</strong> to keep you logged in (a secure,
            HttpOnly session cookie) and to protect authentication requests (CSRF). These cookies do not
            require consent under GDPR. Your cookie-banner choice is stored locally in your browser
            (localStorage), not in a cookie. We do <strong>not</strong> use advertising, analytics, or
            tracking cookies. Declining means you will not be able to stay logged in.
          </p>
        </section>

        <section className={styles.section}>
          <h2>5. Third-Party Services (Data Processors)</h2>
          <ul>
            <li>
              <strong>Neon</strong> — our PostgreSQL database provider. Your account, appointment,
              favourites and application data is stored on Neon&apos;s managed infrastructure in the EU
              (Frankfurt, Germany).
            </li>
            <li>
              <strong>Vercel</strong> — our hosting provider for the application and its API. Network
              request logs may be retained by Vercel for security purposes.
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
