import { expect, test } from '@playwright/test'

test.describe('Base64 Encoder / Decoder', () => {
  test('encodes and decodes UTF-8 text', async ({ page }) => {
    await page.goto('/tools/#/base64')
    await page.getByLabel('Text input').fill('Hello, 안녕 🌍')
    await page.getByRole('button', { name: 'Convert' }).click()
    const output = page.getByLabel('Result')
    await expect(output).toHaveValue('SGVsbG8sIOyViOuFlSDwn4yN')

    await page.getByRole('button', { name: 'Decode' }).click()
    await page.getByLabel('Base64 input').fill('SGVsbG8sIOyViOuFlSDwn4yN')
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(output).toHaveValue('Hello, 안녕 🌍')
  })
})
