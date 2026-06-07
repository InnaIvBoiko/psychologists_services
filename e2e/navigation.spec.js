import { test, expect } from '@playwright/test'
import { EN } from './helpers.js'

test.describe('Header navigation', () => {
  test('shows public nav links and hides member-only links when logged out', async ({ page }) => {
    await page.goto(EN)
    const header = page.locator('header')

    await expect(header.getByRole('link', { name: 'Home', exact: true })).toBeVisible()
    // "exact" avoids matching the "psychologists.services" logo link.
    await expect(header.getByRole('link', { name: 'Psychologists', exact: true })).toBeVisible()

    // Favorites/Admin only appear for authenticated (and admin) users.
    await expect(header.getByRole('link', { name: 'Favorites' })).toHaveCount(0)
    await expect(header.getByRole('link', { name: 'Admin' })).toHaveCount(0)

    // Logged-out actions.
    await expect(header.getByRole('button', { name: 'Log In' })).toBeVisible()
    await expect(header.getByRole('button', { name: 'Registration' })).toBeVisible()
  })

  test('the Psychologists nav link routes to the list', async ({ page }) => {
    await page.goto(EN)
    await page.locator('header').getByRole('link', { name: 'Psychologists', exact: true }).click()
    await expect(page).toHaveURL(/\/en\/psychologists$/)
  })

  test('unknown routes render the not-found page', async ({ page }) => {
    const res = await page.goto(`${EN}/this-page-does-not-exist`)
    expect(res?.status()).toBe(404)
  })
})
