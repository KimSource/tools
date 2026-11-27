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

test('shows the byte count and keeps the entire hash visible on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 760 })
  await page.goto('/tools/#/hash-generator')
  await page.getByLabel('Text input').fill('한🌍\n')
  await expect(page.getByText('UTF-8 · 8 bytes')).toBeVisible()

  const algorithm = page.getByLabel('Algorithm')
  await algorithm.selectOption('SHA-512')
  await algorithm.focus()
  await page.keyboard.press('Tab')
  const generate = page.getByRole('button', { name: 'Generate hash' })
  await expect(generate).toBeFocused()
  await page.keyboard.press('Enter')

  const result = page.getByLabel('HEX result')
  await expect(result).toHaveValue(/^[a-f0-9]{128}$/)
  await expect(page.getByText('SHA-512 · HEX')).toBeVisible()
  const generateBox = await generate.boundingBox()
  const resultBox = await result.boundingBox()
  expect(resultBox!.y).toBeGreaterThan(generateBox!.y + generateBox!.height)
  expect(
    await result.evaluate(
      (field) =>
        field.scrollWidth <= field.clientWidth &&
        field.scrollHeight <= field.clientHeight + 1,
    ),
  ).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  )
})
