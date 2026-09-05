import { expect, test } from '@playwright/test'

test('detects, postpones, and accepts a production update', async ({
  page,
  request,
}) => {
  await page.goto('/tools/#/json-formatter')
  await expect(page.getByLabel('Input JSON')).toBeVisible()
  await expect(page.locator('meta[name="build-version"]')).toHaveAttribute(
    'content',
    'a',
  )
  await page.getByLabel('Input JSON').fill('{"before":"update"}')

  await expect((await request.get('/__e2e/switch-to-b')).ok()).toBe(true)
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    await registration.update()
  })

  await expect(page.getByRole('button', { name: 'Update' })).toBeVisible({
    timeout: 10000,
  })
  await page.locator('header').getByRole('button', { name: 'Update' }).click()
  await expect(page.getByText('Your current input may be lost.')).toBeVisible()
  await page
    .locator('wa-dialog')
    .getByRole('button', { name: 'Cancel' })
    .click()
  await expect(page.getByLabel('Input JSON')).toHaveValue('{"before":"update"}')

  await page
    .locator('wa-dialog')
    .getByRole('button', { name: 'Update' })
    .click()
  await page.reload()
  await expect(page.locator('meta[name="build-version"]')).toHaveAttribute(
    'content',
    'b',
    {
      timeout: 10000,
    },
  )
})
