// Transactional email via Resend (free tier), called best-effort from the booking
// flow. Uses Resend's REST API directly (no SDK dependency).
//
// Graceful degradation: if RESEND_API_KEY is unset, sending is a no-op so local dev
// and preview deploys keep working without the external service (mirrors the pattern
// in src/lib/rateLimit.js). Set RESEND_API_KEY in production to actually send.

const RESEND_API_KEY = process.env.RESEND_API_KEY
// Resend's sandbox sender (`onboarding@resend.dev`) works without a verified domain
// but only delivers to the account owner's address. Point EMAIL_FROM at an address on
// your own verified domain to deliver to real recipients.
const EMAIL_FROM = process.env.EMAIL_FROM || 'Psychologists.Services <onboarding@resend.dev>'

if (!RESEND_API_KEY && process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line no-console
  console.warn('[email] RESEND_API_KEY missing — confirmation emails are DISABLED.')
}

// Minimal HTML-escape for values interpolated into the email body (names, etc.),
// so a crafted booking can't inject markup into the message.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// time_slot is stored as "YYYY-MM-DD HH:MM"; split it into a friendly date + time.
function formatSlot(timeSlot) {
  const [datePart = '', timePart = ''] = String(timeSlot).split(' ')
  const dt = new Date(`${datePart}T${timePart || '00:00'}`)
  if (Number.isNaN(dt.getTime())) return { date: datePart, time: timePart }
  const date = dt.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  return { date, time: timePart }
}

// Low-level send. Never throws: returns a result object so callers in request paths
// can stay best-effort and let the primary action (the booking) succeed regardless.
async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) return { sent: false, skipped: true }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      // eslint-disable-next-line no-console
      console.error(`[email] Resend responded ${res.status}: ${detail}`)
      return { sent: false }
    }
    return { sent: true }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[email] Failed to send:', err.message)
    return { sent: false }
  }
}

function confirmationTemplate({ patientName, psychologistName, date, time }) {
  return `
  <div style="font-family:'Inter',system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
    <div style="background:#FC832C;border-radius:16px 16px 0 0;padding:28px 32px">
      <h1 style="margin:0;color:#fff;font-size:20px">Appointment confirmed ✅</h1>
    </div>
    <div style="background:#fff;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 16px 16px;padding:28px 32px">
      <p style="font-size:15px;line-height:1.6;margin:0 0 18px">Hi ${patientName},</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px">
        Your session with <strong>${psychologistName}</strong> is booked. Here are the details:
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:15px">
        <tr>
          <td style="padding:10px 0;color:#777">Psychologist</td>
          <td style="padding:10px 0;text-align:right;font-weight:600">${psychologistName}</td>
        </tr>
        <tr style="border-top:1px solid #f0f0f0">
          <td style="padding:10px 0;color:#777">Date</td>
          <td style="padding:10px 0;text-align:right;font-weight:600">${date}</td>
        </tr>
        <tr style="border-top:1px solid #f0f0f0">
          <td style="padding:10px 0;color:#777">Time</td>
          <td style="padding:10px 0;text-align:right;font-weight:600">${time}</td>
        </tr>
      </table>
      <p style="font-size:13px;line-height:1.6;color:#777;margin:24px 0 0">
        Need to cancel or reschedule? Log in to your account to manage your appointments.
      </p>
    </div>
    <p style="text-align:center;font-size:12px;color:#aaa;line-height:1.7;margin:18px 0 0">
      ⚠️ <strong>Demo project.</strong> This is a portfolio website — the psychologists,
      bookings and this confirmation are fictional examples, not a real service. No actual
      appointment has been scheduled.<br />
      Interested in collaborating? Contact Inna Boiko —
      <a href="mailto:inna_boiko@libero.it" style="color:#FC832C">inna_boiko@libero.it</a>.
    </p>
  </div>`
}

/**
 * Send a booking confirmation. Best-effort — resolves to a result, never throws.
 * @param {{ to: string, patientName: string, psychologistName: string, timeSlot: string }} params
 */
export async function sendAppointmentConfirmation({ to, patientName, psychologistName, timeSlot }) {
  const { date, time } = formatSlot(timeSlot)
  const safe = {
    patientName: escapeHtml(patientName),
    psychologistName: escapeHtml(psychologistName),
    date: escapeHtml(date),
    time: escapeHtml(time),
  }
  return sendEmail({
    to,
    subject: `Appointment confirmed with ${psychologistName}`,
    html: confirmationTemplate(safe),
  })
}
