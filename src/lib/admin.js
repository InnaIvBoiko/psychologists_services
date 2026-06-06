import { auth } from './auth.js'

// Admin role = email allowlist (env ADMIN_EMAILS, comma-separated). No DB column,
// so there is nothing to migrate or maintain — flipping who is admin is a config change.
const adminEmails = new Set(
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
)

export function isAdminEmail(email) {
  if (!email) return false
  return adminEmails.has(String(email).toLowerCase())
}

// Server guard for admin-only API routes: returns the session if the caller is an
// admin, otherwise null (the route then responds 403).
export async function requireAdmin() {
  const session = await auth()
  return isAdminEmail(session?.user?.email) ? session : null
}
