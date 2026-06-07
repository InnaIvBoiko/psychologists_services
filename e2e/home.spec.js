import { test, expect } from '@playwright/test'
import { EN } from './helpers.js'

test.describe('Home page', () => {
  test('renders the hero, CTAs and stats', async ({ page }) => {
    await page.goto(EN)

    // Hero headline ("…healthy mind starts here") is split across rich-text chunks.
    await expect(page.getByRole('heading', { level: 1 })).toContainText('starts here')

    // Both hero CTAs are present.
    await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'View psychologists' })).toBeVisible()

    // Stats strip.
    await expect(page.getByText('Verified specialists')).toBeVisible()
    await expect(page.getByText('Average rating')).toBeVisible()
  })

  test('"Get started" navigates to the psychologists list', async ({ page }) => {
    await page.goto(EN)
    await page.getByRole('button', { name: 'Get started' }).click()
    await expect(page).toHaveURL(/\/en\/psychologists$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Psychologists' })).toBeVisible()
  })

  test('the bare root redirects to a locale-prefixed URL', async ({ page }) => {
    await page.goto('/')
    // next-intl middleware adds the default locale prefix.
    await expect(page).toHaveURL(/\/(en|it)(\/)?$/)
  })
})
