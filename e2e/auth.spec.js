import { test, expect } from '@playwright/test'
import { EN, TEST_PASSWORD, registerNewUser, openAuthModal } from './helpers.js'

test.describe('Auth modal (no account created)', () => {
  test('opens login, switches to register, and validates empty submit', async ({ page }) => {
    await page.goto(EN)
    await openAuthModal(page, 'login')

    // Switch login → register.
    await page.getByRole('button', { name: 'Register', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Registration' })).toBeVisible()

    // Submitting an empty form surfaces inline validation, no request is sent.
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await expect(page.getByText('Name is required')).toBeVisible()
    await expect(page.getByText('Email is required')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
    await expect(page.getByText('You must accept the Privacy Policy to register')).toBeVisible()
  })

  test('the demo-admin "Fill in" button prefills the login form', async ({ page }) => {
    await page.goto(EN)
    await openAuthModal(page, 'login')

    await page.getByRole('button', { name: 'Fill in' }).click()
    await expect(page.getByPlaceholder('Email', { exact: true })).toHaveValue('admin@example.com')
    await expect(page.getByPlaceholder('Password', { exact: true })).toHaveValue('Password123!')
  })
})

test.describe('Auth lifecycle (creates then deletes its own account)', () => {
  // Runs serially: it registers a throwaway account and removes it via the UI.
  test('register → session persists across reload → delete account', async ({ page }) => {
    const header = page.locator('header')

    const { email } = await registerNewUser(page)
    // Logged-in state: logout shown, login/register gone.
    await expect(header.getByRole('button', { name: 'Log out' })).toBeVisible()
    await expect(header.getByRole('button', { name: 'Log In' })).toHaveCount(0)

    // The Auth.js session cookie survives a full reload.
    await page.reload()
    await expect(header.getByRole('button', { name: 'Log out' })).toBeVisible()

    // Delete the account through the user menu (also cleans up the DB row).
    await header.getByRole('button', { name: 'User menu' }).click()
    await header.getByRole('button', { name: 'Delete account' }).click()
    await page.getByRole('button', { name: 'Yes, delete my account' }).click()

    // Back to the logged-out header.
    await expect(header.getByRole('button', { name: 'Log In' })).toBeVisible()
    await expect(header.getByRole('button', { name: 'Log out' })).toHaveCount(0)

    // Confirm the account is gone: logging in with it fails (form stays open).
    await openAuthModal(page, 'login')
    await page.getByPlaceholder('Email', { exact: true }).fill(email)
    await page.getByPlaceholder('Password', { exact: true }).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Log In', exact: true }).last().click()
    await expect(page.getByText(/invalid email or password/i)).toBeVisible()
  })
})
