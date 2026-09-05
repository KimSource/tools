import { expect, test } from '@playwright/test'

test.describe('JSON Formatter', () => {
  test('formats valid JSON from a direct tool URL', async ({ page }) => {
    await page.goto('/tools/#/json-formatter')
    await page.getByLabel('Input JSON').fill('{"name":"Local Tools"}')
    await page.getByRole('button', { name: 'Format' }).click()
    await expect(page.getByLabel('Output')).toHaveValue(
      '{\n  "name": "Local Tools"\n}',
    )
  })

  test('shows an error and recovers with valid input', async ({ page }) => {
    await page.goto('/tools/#/json-formatter')
    await page.getByLabel('Input JSON').fill('{')
    await page.getByRole('button', { name: 'Format' }).click()
    await expect(page.getByRole('alert')).toContainText('valid JSON')
    await page.getByLabel('Input JSON').fill('{"ok":true}')
    await page.getByRole('button', { name: 'Format' }).click()
    await expect(page.getByLabel('Output')).toHaveValue('{\n  "ok": true\n}')
  })

  test('changes language and theme preferences', async ({ page }) => {
    await page.goto('/tools/#/')
    const language = page.getByRole('combobox', { name: 'Language' })
    const theme = page.locator('wa-select').nth(1)
    await language.click()
    await page.locator('wa-option[value="ko"]').click({ force: true })
    await expect(
      page.getByRole('heading', { name: '작업에 필요한 작은 도구들' }),
    ).toBeVisible()
    await theme.click()
    await page.locator('wa-option[value="dark"]').click({ force: true })
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })
})
