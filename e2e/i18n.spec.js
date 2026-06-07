import { test, expect } from '@playwright/test'
import { EN } from './helpers.js'

test.describe('Internationalization (en ↔ it)', () => {
  test('the language switcher moves between locales and translates content', async ({ page }) => {
    await page.goto(EN)

    // The IT/EN toggle lives in the hero badge row.
    const switcher = page.getByRole('group', { name: 'Change language' })
    await expect(switcher.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true')

    await switcher.getByRole('button', { name: 'IT' }).click()

    // URL switches to the Italian locale and the nav label is translated.
    await expect(page).toHaveURL(/\/it(\/)?$/)
    await expect(page.locator('header').getByRole('link', { name: 'Psicologi' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Inizia ora' })).toBeVisible()
  })

  test('the chosen locale persists across a reload (cookie-backed)', async ({ page }) => {
    await page.goto(EN)
    await page.getByRole('group', { name: 'Change language' }).getByRole('button', { name: 'IT' }).click()
    await expect(page).toHaveURL(/\/it(\/)?$/)

    // next-intl stores the preference in a cookie; the bare root should now
    // resolve to Italian rather than the default English.
    await page.goto('/')
    await expect(page).toHaveURL(/\/it(\/)?$/)
  })

  test('Italian deep links render translated pages directly', async ({ page }) => {
    await page.goto('/it/psychologists')
    await expect(page.locator('header').getByRole('link', { name: 'Psicologi' })).toBeVisible()
    await expect(page.locator('article').first()).toBeVisible()
  })
})
