import { expect, test } from '@playwright/test'

test('loads the app and formats JSON from a direct tool URL', async ({
  page,
}) => {
  await page.goto('/tools/')
  await expect(
    page.getByRole('heading', { name: 'Small tools for your work' }),
  ).toBeVisible()

  await page.goto('/tools/#/json-formatter')
  await page.getByLabel('Input JSON').fill('{"smoke":true}')
  await page.getByRole('button', { name: 'Format' }).click()
  await expect(page.getByLabel('Output')).toHaveValue(`{
  "smoke": true
}`)
})
