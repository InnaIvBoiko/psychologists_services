import { test, expect } from '@playwright/test'
import { EN } from './helpers.js'

test.describe('Route guards (logged out)', () => {
  test('/favorites redirects guests back to the home page', async ({ page }) => {
    await page.goto(`${EN}/favorites`)
    // The page renders nothing for guests and client-redirects to home.
    await expect(page).toHaveURL(/\/(en|it)\/?$/)
    await expect(page).not.toHaveURL(/favorites/)
  })

  test('/admin shows the not-found page for non-admins (existence is hidden)', async ({ page }) => {
    await page.goto(`${EN}/admin`)
    // The admin page calls notFound() for non-admins, rendering the 404 view.
    // (A force-dynamic route streams a 200 status, so assert on content instead.)
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })
})
