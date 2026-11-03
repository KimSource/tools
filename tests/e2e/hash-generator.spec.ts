import { expect, test } from '@playwright/test'

test('generates, copies, and invalidates hashes', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/tools/#/hash-generator')
  await page.getByLabel('Text input').fill('abc')
  await page.getByRole('button', { name: 'Generate hash' }).click()
  const output = page.getByLabel('HEX result')
  await expect(output).toHaveValue(
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  )
  await page.getByRole('button', { name: 'Copy result' }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  await page.getByLabel('Algorithm').selectOption('SHA-512')
  await expect(output).toHaveValue('')
  await page.getByRole('button', { name: 'Generate hash' }).click()
  await expect(output).toHaveValue(
    'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
  )
  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(output).toHaveValue('')
  await expect(page.getByLabel('Text input')).toHaveValue('')
})
