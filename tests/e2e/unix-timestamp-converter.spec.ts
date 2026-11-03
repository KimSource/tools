import { expect, test } from '@playwright/test'

test('converts timestamps and dates, explains ambiguity, and copies results', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/tools/#/unix-timestamp-converter')
  const timestamp = page.getByLabel('Unix timestamp', { exact: true })
  await timestamp.fill('1704067200')
  await page.getByRole('button', { name: 'Convert timestamp' }).click()
  await expect(page.getByText('Detected seconds.')).toBeVisible()
  await expect(page.getByLabel('ISO 8601', { exact: true })).toHaveValue(
    '2024-01-01T00:00:00.000Z',
  )
  await page.getByRole('button', { name: 'Copy ISO 8601' }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe('2024-01-01T00:00:00.000Z')
  await timestamp.fill('0')
  await page.getByRole('button', { name: 'Convert timestamp' }).click()
  await expect(page.getByRole('alert')).toContainText('Cannot determine')
  await page.getByLabel('Timestamp unit').selectOption('milliseconds')
  await page.getByRole('button', { name: 'Convert timestamp' }).click()
  await expect(page.getByLabel('ISO 8601', { exact: true })).toHaveValue(
    '1970-01-01T00:00:00.000Z',
  )
  await page.getByLabel('Date and time (ISO 8601)').fill('2024-02-30T00:00Z')
  await page.getByRole('button', { name: 'Convert date' }).click()
  await expect(page.getByRole('alert')).toContainText('Invalid input')
  await page
    .getByLabel('Date and time (ISO 8601)')
    .fill('2024-01-01T09:00:00.123+09:00')
  await page.getByRole('button', { name: 'Convert date' }).click()
  await expect(page.getByLabel('Milliseconds', { exact: true })).toHaveValue(
    '1704067200123',
  )
  await expect(page.getByLabel('Seconds', { exact: true })).toHaveValue(
    '1704067200.123',
  )
  await page.getByRole('button', { name: 'Use current time' }).click()
  await expect(page.getByLabel('ISO 8601', { exact: true })).not.toHaveValue('')
})
