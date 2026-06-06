import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// The allowlist is read from process.env at module load, so each test stubs the env
// and re-imports the module. auth.js is mocked to avoid pulling in NextAuth here.
vi.mock('./auth.js', () => ({ auth: vi.fn() }))

const loadIsAdminEmail = async (value) => {
  vi.stubEnv('ADMIN_EMAILS', value)
  vi.resetModules()
  return (await import('./admin.js')).isAdminEmail
}

describe('isAdminEmail', () => {
  beforeEach(() => {
    vi.resetModules()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('matches an allowlisted email case-insensitively, ignoring surrounding spaces', async () => {
    const isAdminEmail = await loadIsAdminEmail(' Admin@Example.com , second@x.io ')
    expect(isAdminEmail('admin@example.com')).toBe(true)
    expect(isAdminEmail('ADMIN@EXAMPLE.COM')).toBe(true)
    expect(isAdminEmail('second@x.io')).toBe(true)
  })

  it('rejects non-allowlisted and falsy inputs', async () => {
    const isAdminEmail = await loadIsAdminEmail('admin@example.com')
    expect(isAdminEmail('nope@example.com')).toBe(false)
    expect(isAdminEmail('')).toBe(false)
    expect(isAdminEmail(null)).toBe(false)
    expect(isAdminEmail(undefined)).toBe(false)
  })

  it('treats an unset/empty allowlist as no admins', async () => {
    const isAdminEmail = await loadIsAdminEmail('')
    expect(isAdminEmail('admin@example.com')).toBe(false)
  })
})
