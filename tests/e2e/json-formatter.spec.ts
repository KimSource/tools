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

  test('formats with four-space indentation selected in the UI', async ({
    page,
  }) => {
    await page.goto('/tools/#/json-formatter')
    await page.getByLabel('Input JSON').fill('{"nested":{"value":true}}')
    const indentation = page.locator('json-formatter-tool wa-select')
    await indentation.click()
    await page.locator('wa-option[value="4"]').click({ force: true })
    await page.getByRole('button', { name: 'Format' }).click()
    await expect(page.getByLabel('Output')).toHaveValue(`{
    "nested": {
        "value": true
    }
}`)
  })

  test('clears stale results and disables result actions after changes', async ({
    page,
  }) => {
    await page.goto('/tools/#/json-formatter')
    const input = page.getByLabel('Input JSON')
    const output = page.getByLabel('Output')
    const copy = page.getByRole('button', { name: 'Copy result' })
    const download = page.getByRole('button', { name: 'Download' })
    const indentation = page.locator('json-formatter-tool wa-select')

    await input.fill('{"value":1}')
    await page.getByRole('button', { name: 'Format' }).click()
    await expect(output).toHaveValue(`{
  "value": 1
}`)
    await expect(copy).toBeEnabled()
    await expect(download).toBeEnabled()

    await input.fill('{"value":2}')
    await expect(output).toHaveValue('')
    await expect(copy).toBeDisabled()
    await expect(download).toBeDisabled()

    await page.getByRole('button', { name: 'Format' }).click()
    await indentation.click()
    await page.locator('wa-option[value="4"]').click({ force: true })
    await expect(output).toHaveValue('')
    await expect(copy).toBeDisabled()
    await expect(download).toBeDisabled()

    await input.fill('{"value":3}')
    await page.getByRole('button', { name: 'Format' }).click()
    await page.getByRole('button', { name: 'Reset' }).click()
    await expect(input).toHaveValue('')
    await expect(output).toHaveValue('')
    await expect(copy).toBeDisabled()
    await expect(download).toBeDisabled()
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

  test('shows loading state during tool loading and renders after it completes', async ({
    page,
  }) => {
    await page.goto('/tools/?e2e-load-delay=500#/json-formatter')
    await expect(page.getByRole('heading', { name: 'Loading…' })).toBeVisible()
    await expect(page.getByLabel('Input JSON')).toBeVisible()
  })

  test('shows a load error and recovers on retry', async ({ page }) => {
    await page.goto('/tools/?e2e-load-fail=1#/json-formatter')
    await expect(
      page.getByRole('heading', { name: 'Could not load the tool' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect(page.getByLabel('Input JSON')).toBeVisible()
  })

  test('does not render a stale tool after navigating away during loading', async ({
    page,
  }) => {
    await page.goto('/tools/?e2e-load-delay=1000#/json-formatter')
    await expect(page.getByRole('heading', { name: 'Loading…' })).toBeVisible()
    await page.goto('/tools/#/')
    await expect(
      page.getByRole('heading', { name: 'Small tools for your work' }),
    ).toBeVisible()
    await page.waitForTimeout(1100)
    await expect(
      page.getByRole('heading', { name: 'Small tools for your work' }),
    ).toBeVisible()
    await expect(page.getByLabel('Input JSON')).toHaveCount(0)
  })
})
