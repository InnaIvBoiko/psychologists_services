import { expect } from '@playwright/test'

// All routes are locale-prefixed (next-intl, localePrefix: 'always').
// The tests target English; a dedicated spec covers switching to Italian.
export const EN = '/en'

// Users created during auth tests share this prefix so the global teardown
// can sweep any that a failing test left behind in the database.
export const TEST_EMAIL_PREFIX = 'e2e-'
export const TEST_PASSWORD = 'Password123!'

let seq = 0
/** A unique, sweepable email for one registration. */
export function uniqueEmail() {
  seq += 1
  return `${TEST_EMAIL_PREFIX}${Date.now()}-${seq}@playwright.test`
}

/** Open the login (or register) modal from the header. */
export async function openAuthModal(page, mode = 'login') {
  const label = mode === 'login' ? 'Log In' : 'Registration'
  await page.locator('header').getByRole('button', { name: label }).click()
  // The modal heading confirms which form is open.
  await expect(
    page.getByRole('heading', { name: mode === 'login' ? 'Log In' : 'Registration' })
  ).toBeVisible()
}

/** Register a brand-new account through the UI and wait until logged in. */
export async function registerNewUser(page, { email = uniqueEmail(), name = 'E2E Tester' } = {}) {
  await page.goto(EN)
  await openAuthModal(page, 'register')

  await page.getByPlaceholder('Name', { exact: true }).fill(name)
  await page.getByPlaceholder('Email', { exact: true }).fill(email)
  await page.getByPlaceholder('Password', { exact: true }).fill(TEST_PASSWORD)
  // Consent checkbox is required for registration.
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Sign Up' }).click()

  // Auth.js issues a session cookie and the header swaps to the logged-in state.
  await expect(page.locator('header').getByRole('button', { name: 'Log out' })).toBeVisible()
  return { email, name }
}
