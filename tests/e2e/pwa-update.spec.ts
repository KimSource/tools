import { expect, test } from '@playwright/test'

test('detects, postpones, and accepts a production update', async ({
  page,
  request,
  context,
}) => {
  await page.goto('/tools/#/json-formatter')
  // Establish an A-controlled page before starting the update scenario.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect(page.getByLabel('Input JSON')).toBeVisible()
  await expect(page.locator('meta[name="build-version"]')).toHaveAttribute(
    'content',
    'a',
  )
  await page.getByLabel('Input JSON').fill('{"before":"update"}')
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state))
    .toBe('activated')

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
  const dialog = page.locator('wa-dialog')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).not.toHaveAttribute('open', '')
  await expect(page.getByLabel('Input JSON')).toHaveValue('{"before":"update"}')
  await page.getByRole('button', { name: 'Format', exact: true }).click()
  await expect(page.getByLabel('Output')).toHaveValue(
    '{\n  "before": "update"\n}',
  )
  await expect(page.locator('meta[name="build-version"]')).toHaveAttribute(
    'content',
    'a',
  )

  await page.locator('header').getByRole('button', { name: 'Update' }).click()
  await expect(dialog).toHaveAttribute('open', '')
  // The app must reload itself after accepting; a test-driven reload would
  // hide a broken applyUpdate/controllerchange flow.
  const navigation = page.waitForEvent('framenavigated', {
    predicate: (frame) => frame === page.mainFrame(),
  })
  await dialog.getByRole('button', { name: 'Update' }).click()
  await navigation
  await expect(page.locator('meta[name="build-version"]')).toHaveAttribute(
    'content',
    'b',
    {
      timeout: 10000,
    },
  )
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state))
    .toBe('activated')
  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('meta[name="build-version"]')).toHaveAttribute(
    'content',
    'b',
  )
  await page.getByLabel('Input JSON').fill('{"after":"update"}')
  await page.getByRole('button', { name: 'Format', exact: true }).click()
  await expect(page.getByLabel('Output')).toHaveValue(
    '{\n  "after": "update"\n}',
  )
})
