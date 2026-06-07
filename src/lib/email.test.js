import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// RESEND_API_KEY is read at module load, so each test stubs the env and re-imports.
const loadEmail = async (apiKey) => {
  if (apiKey === undefined) vi.stubEnv('RESEND_API_KEY', '')
  else vi.stubEnv('RESEND_API_KEY', apiKey)
  vi.resetModules()
  return import('./email.js')
}

const params = {
  to: 'patient@example.com',
  patientName: 'Jane',
  psychologistName: 'Dr. Smith',
  timeSlot: '2026-07-01 14:30',
}

describe('sendAppointmentConfirmation', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('is a no-op (no network call) when RESEND_API_KEY is unset', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const { sendAppointmentConfirmation } = await loadEmail('')
    const result = await sendAppointmentConfirmation(params)
    expect(result).toEqual({ sent: false, skipped: true })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('posts to Resend with the booking details when configured', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, text: async () => '' })
    const { sendAppointmentConfirmation } = await loadEmail('re_test_key')

    const result = await sendAppointmentConfirmation(params)

    expect(result).toEqual({ sent: true })
    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, opts] = fetchSpy.mock.calls[0]
    expect(url).toBe('https://api.resend.com/emails')
    expect(opts.headers.Authorization).toBe('Bearer re_test_key')
    const body = JSON.parse(opts.body)
    expect(body.to).toBe('patient@example.com')
    expect(body.subject).toContain('Dr. Smith')
    expect(body.html).toContain('Jane')
    expect(body.html).toContain('Dr. Smith')
  })

  it('escapes HTML in user-supplied values to prevent markup injection', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, text: async () => '' })
    const { sendAppointmentConfirmation } = await loadEmail('re_test_key')

    await sendAppointmentConfirmation({ ...params, patientName: '<script>x</script>' })

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body)
    expect(body.html).not.toContain('<script>')
    expect(body.html).toContain('&lt;script&gt;')
  })

  it('never throws and reports sent:false when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))
    const { sendAppointmentConfirmation } = await loadEmail('re_test_key')
    await expect(sendAppointmentConfirmation(params)).resolves.toEqual({ sent: false })
  })
})
