import { expect, test } from '@playwright/test'

test('calculates differences and adjusted dates, errors and copies', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/tools/#/date-calculator')
  await page.getByRole('button', { name: 'Calculate' }).click()
  await expect(page.getByRole('alert')).toContainText('required dates')
  await page.getByLabel('Start date', { exact: true }).fill('2024-03-10')
  await page.getByLabel('End date', { exact: true }).fill('2024-03-01')
  await page.getByLabel('Include start date').check()
  await page.getByRole('button', { name: 'Calculate' }).click()
  await expect(page.getByLabel('Result', { exact: true })).toHaveValue(
    '10 Days (1 Weeks 3 Days) · before · Start date included',
  )
  await page.getByRole('button', { name: 'Copy result' }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('10 Days')
  await page.getByLabel('Calculation mode').selectOption('adjust')
  await page.getByLabel('Base date').fill('2024-01-31')
  await page.getByLabel('Months').fill('1')
  await page.getByRole('button', { name: 'Calculate' }).click()
  await expect(page.getByLabel('Result', { exact: true })).toHaveValue(
    '2024-02-29',
  )
  await page.getByRole('button', { name: 'Copy result' }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe('2024-02-29')
  await page.getByLabel('Base date').fill('2023-02-29')
  await page.getByRole('button', { name: 'Calculate' }).click()
  await expect(page.getByRole('alert')).toContainText('valid date')
})

test('finds the tool using Korean and English search', async ({ page }) => {
  await page.goto('/tools/')
  const search = page.getByRole('searchbox', { name: 'Search tools' })
  for (const term of ['날짜 계산기', 'date calculator']) {
    await search.fill(term)
    await expect(page.locator('[data-tool-id="date-calculator"]')).toBeVisible()
  }
})

test('supports keyboard use on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/tools/#/date-calculator')
  await page.getByLabel('Start date', { exact: true }).focus()
  await page.keyboard.type('2024-01-01')
  await page.keyboard.press('Tab')
  await page.keyboard.type('2024-01-08')
  await page.getByRole('button', { name: 'Calculate' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Result', { exact: true })).toHaveValue(/7 Days/)
})
