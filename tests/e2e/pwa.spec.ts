import { expect, test } from '@playwright/test'

test('loads the manifest and works offline after the service worker is ready', async ({
  page,
  context,
}) => {
  await page.goto('/tools/')
  await expect(
    page.getByRole('heading', { name: 'Small tools for your work' }),
  ).toBeVisible()

  const manifestResponse = await page.request.get('/tools/manifest.webmanifest')
  expect(manifestResponse.ok()).toBe(true)
  expect(manifestResponse.headers()['content-type']).toContain('manifest+json')

  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    if (!registration.active) throw new Error('Service Worker is not active')
  })
  await page.reload()
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true)

  await page.goto('/tools/#/json-formatter')
  await expect(page.getByLabel('Input JSON')).toBeVisible()
  await context.setOffline(true)

  await page.reload()
  await expect(page.getByLabel('Input JSON')).toBeVisible()
  await page.getByLabel('Input JSON').fill('{"offline":true}')
  await page.getByRole('button', { name: 'Format' }).click()
  await expect(page.getByLabel('Output')).toHaveValue(`{
  "offline": true
}`)
})
