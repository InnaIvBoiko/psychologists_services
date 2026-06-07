import { test, expect } from '@playwright/test'
import { EN } from './helpers.js'

const LIST = `${EN}/psychologists`

test.describe('Psychologists list', () => {
  test('server-renders a paginated list of cards', async ({ page }) => {
    await page.goto(LIST)

    // PAGE_SIZE is 3, and the seed loads 15 psychologists.
    await expect(page.locator('article')).toHaveCount(3)
    await expect(page.getByRole('button', { name: 'Load more' })).toBeVisible()
  })

  test('"Load more" reveals additional cards', async ({ page }) => {
    await page.goto(LIST)
    await expect(page.locator('article')).toHaveCount(3)

    await page.getByRole('button', { name: 'Load more' }).click()
    await expect(page.locator('article')).toHaveCount(6)
  })

  test('search filters the list and can be cleared', async ({ page }) => {
    await page.goto(LIST)
    const search = page.getByPlaceholder('Search by name or specialization…')

    // Grab the first card's name, then search for it.
    const firstName = await page.locator('article h3').first().innerText()
    await search.fill(firstName)

    // Debounced at 300ms — wait for the result set to settle.
    await expect(page.locator('article h3').first()).toContainText(firstName)
    await expect(page.locator('article')).toHaveCount(1)

    // A nonsense query yields the empty state.
    await search.fill('zzzzz-no-such-psychologist')
    await expect(page.getByText('No psychologists match this filter.')).toBeVisible()

    // Clearing search restores the first page.
    await page.getByRole('button', { name: 'Clear search' }).click()
    await expect(page.locator('article')).toHaveCount(3)
  })

  test('the filter dropdown sorts the list (A to Z)', async ({ page }) => {
    await page.goto(LIST)

    await page.getByRole('button', { name: 'Filter' }).click()
    await page.getByRole('option', { name: 'A to Z' }).click()

    const names = await page.locator('article h3').allInnerTexts()
    const sorted = [...names].sort((a, b) => a.localeCompare(b))
    expect(names).toEqual(sorted)
  })
})
