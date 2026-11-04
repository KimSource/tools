import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test('generates, downloads and reads a QR image', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/tools/#/qr-code')
  await page.getByRole('button', { name: 'Generate QR code' }).click()
  await expect(page.getByRole('alert')).toContainText('Enter text')
  await page.getByLabel('Text or URL').fill('https://example.com/한글')
  await page.getByLabel('Image size').selectOption('512')
  await page.getByRole('button', { name: 'Generate QR code' }).click()
  await expect(page.getByAltText('QR code preview')).toBeVisible()
  const pngPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download PNG' }).click()
  const png = await pngPromise
  expect(png.suggestedFilename()).toBe('qr-code.png')
  const buffer = await readFile((await png.path())!)
  expect(buffer.readUInt32BE(16)).toBe(512)
  const svgPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download SVG' }).click()
  const svg = await svgPromise
  expect(await readFile((await svg.path())!, 'utf8')).toContain('<svg')
  await page.getByRole('button', { name: 'Read', exact: true }).click()
  await page
    .getByLabel('Choose an image')
    .setInputFiles({ name: 'qr.png', mimeType: 'image/png', buffer })
  await expect(page.getByLabel('QR content')).toHaveValue(
    'https://example.com/한글',
  )
  await expect(page.getByRole('link', { name: 'Open link' })).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  )
  await page.getByRole('button', { name: 'Copy result' }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe('https://example.com/한글')
  await page.getByLabel('Choose an image').setInputFiles({
    name: 'bad.png',
    mimeType: 'image/png',
    buffer: Buffer.from('bad'),
  })
  await expect(page.getByRole('alert')).toContainText('could not be read')
  await expect(page.getByLabel('QR content')).toHaveCount(0)
})

test('finds QR code through search and accepts a dropped image', async ({
  page,
}) => {
  await page.goto('/tools/')
  await page.getByRole('searchbox', { name: 'Search tools' }).fill('큐알')
  await page
    .locator('[data-tool-id="qr-code"]')
    .getByRole('button', { name: 'Open' })
    .click()
  await page.getByLabel('Text or URL').fill('drop test')
  await page.getByRole('button', { name: 'Generate QR code' }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download PNG' }).click()
  const buffer = await readFile((await (await download).path())!)
  await page.getByRole('button', { name: 'Read', exact: true }).click()
  const data = await page.evaluateHandle(
    (bytes) => {
      const dt = new DataTransfer()
      dt.items.add(
        new File([new Uint8Array(bytes)], 'qr.png', { type: 'image/png' }),
      )
      return dt
    },
    [...buffer],
  )
  await page
    .locator('qr-code-tool .drop')
    .dispatchEvent('drop', { dataTransfer: data })
  await expect(page.getByLabel('QR content')).toHaveValue('drop test')
  await expect(page.getByRole('link', { name: 'Open link' })).toHaveCount(0)
})
