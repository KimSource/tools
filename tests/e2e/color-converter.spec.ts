import { expect, test } from '@playwright/test'

test('converts each format, handles errors, updates the picker, and copies each result', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/tools/#/color-converter')
  await page.getByLabel('HEX input').fill('#f80')
  await page.getByRole('button', { name: 'Convert HEX' }).click()
  await expect(page.getByLabel('RGB result')).toHaveValue('rgb(255, 136, 0)')
  await expect(page.getByLabel('Color preview')).toHaveCSS(
    'background-color',
    'rgb(255, 136, 0)',
  )
  await page.getByLabel('RGB input').fill('rgb(0, 255, 0)')
  await page.getByRole('button', { name: 'Convert RGB' }).click()
  await expect(page.getByLabel('HEX result')).toHaveValue('#00FF00')
  await page.getByLabel('HSL input').fill('hsl(240, 100%, 50%)')
  await page.getByRole('button', { name: 'Convert HSL' }).click()
  for (const [format, value] of [
    ['HEX', '#0000FF'],
    ['RGB', 'rgb(0, 0, 255)'],
    ['HSL', 'hsl(240, 100%, 50%)'],
  ]) {
    await page.getByRole('button', { name: `Copy ${format}` }).click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(value)
  }
  await page.getByLabel('RGB input').fill('rgb(256, 0, 0)')
  await expect(page.getByLabel('HEX result')).toHaveCount(0)
  await page.getByRole('button', { name: 'Convert RGB' }).click()
  await expect(page.getByRole('alert')).toContainText(
    'outside the supported range',
  )
  await page.getByLabel('Color picker').fill('#123456')
  await expect(page.getByLabel('HEX result')).toHaveValue('#123456')
  await expect(page.getByRole('alert')).toHaveCount(0)
})
