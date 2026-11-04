import { expect, test } from '@playwright/test'

test('searches zones, handles DST, converts multiple targets and copies', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/tools/#/time-zone-converter')
  await page.getByLabel('Date and time').fill('2024-03-10T02:30')
  await page.getByLabel('Search base time zones').fill('뉴욕')
  await page
    .getByRole('combobox', { name: 'Base time zone' })
    .selectOption('America/New_York')
  await page.getByRole('button', { name: 'Convert', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('does not exist')
  await page.getByLabel('Date and time').fill('2024-11-03T01:30')
  await page.getByRole('button', { name: 'Convert', exact: true }).click()
  await expect(
    page.getByText('This time occurs twice. Choose an offset.'),
  ).toBeVisible()
  await page.getByRole('radio', { name: 'UTC−04:00' }).check()
  await page.getByLabel('Search target time zones').fill('대한민국')
  await page
    .getByRole('combobox', { name: 'Target time zone' })
    .selectOption('Asia/Seoul')
  await page.getByRole('button', { name: 'Add target' }).click()
  await page.getByRole('button', { name: 'Convert', exact: true }).click()
  await expect(page.getByText(/2024-11-03 05:30 UTC\+00:00/)).toBeVisible()
  await expect(page.getByText(/2024-11-03 14:30 UTC\+09:00/)).toBeVisible()
  await page.getByRole('button', { name: 'Copy all results' }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('Asia/Seoul')
})

test('supports keyboard selection on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/tools/#/time-zone-converter')
  await page.getByLabel('Search target time zones').fill('seoul')
  const select = page.getByRole('combobox', { name: 'Target time zone' })
  await select.focus()
  await page.keyboard.press('ArrowDown')
  await expect(select).toHaveValue('Asia/Seoul')
})
