import { expect, test } from '@playwright/test'

const binaryHash =
  '06eb7d6a69ee19e5fbdf749018d3d2abfa04bcbd1365db312eb86dc7169389b8'

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

test('hashes picked and dropped files and keeps each input when changing modes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 760 })
  await page.goto('/tools/#/hash-generator')
  const textMode = page.getByRole('button', { name: 'Text', exact: true })
  const fileMode = page.getByRole('button', { name: 'File', exact: true })
  const generate = page.getByRole('button', { name: 'Generate hash' })
  const output = page.getByLabel('HEX result')
  await expect(textMode).toHaveAttribute('aria-pressed', 'true')
  await page.getByLabel('Text input').fill('text draft')
  await fileMode.focus()
  await page.keyboard.press('Enter')
  await expect(fileMode).toHaveAttribute('aria-pressed', 'true')
  await expect(generate).toBeDisabled()

  const choose = page.getByRole('button', { name: 'Choose file' })
  await choose.focus()
  const chooser = page.waitForEvent('filechooser')
  await page.keyboard.press('Enter')
  await (
    await chooser
  ).setFiles({
    name: 'sample.bin',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from([0, 255]),
  })
  await expect(page.getByText('sample.bin')).toBeVisible()
  await expect(page.getByText('2 bytes', { exact: true })).toBeVisible()
  await generate.click()
  await expect(output).toHaveValue(binaryHash)

  await textMode.click()
  await expect(output).toHaveValue('')
  await expect(page.getByLabel('Text input')).toHaveValue('text draft')
  await fileMode.click()
  await expect(page.getByText('sample.bin')).toBeVisible()
  await expect(output).toHaveValue('')
  await generate.click()
  await expect(output).toHaveValue(binaryHash)

  const drop = await page.evaluateHandle(() => {
    const data = new DataTransfer()
    data.items.add(new File([], 'empty.bin'))
    return data
  })
  await page.getByRole('group', { name: 'File input' }).dispatchEvent('drop', {
    dataTransfer: drop,
  })
  await expect(page.getByText('empty.bin')).toBeVisible()
  await expect(output).toHaveValue('')
  await generate.click()
  await expect(output).toHaveValue(
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  )
  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(page.getByRole('button', { name: 'Choose file' })).toBeVisible()
  await expect(generate).toBeDisabled()
  await expect(output).toHaveValue('')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})

test('accepts a file at the limit and rejects oversized or multiple replacements', async ({
  page,
}) => {
  await page.goto('/tools/#/hash-generator')
  await page.getByRole('button', { name: 'File', exact: true }).click()
  const fileInput = page.getByRole('group', { name: 'File input' })
  const output = page.getByLabel('HEX result')
  const limitInBytes = 32 * 1024 * 1024

  for (const size of [limitInBytes, limitInBytes + 1]) {
    const drop = await page.evaluateHandle((size) => {
      const data = new DataTransfer()
      data.items.add(new File([new Uint8Array(size)], `${size}.bin`))
      return data
    }, size)
    await fileInput.dispatchEvent('drop', { dataTransfer: drop })
    await drop.dispose()
    if (size === limitInBytes) {
      await expect(page.getByText(`${size}.bin`)).toBeVisible()
      await page.getByRole('button', { name: 'Generate hash' }).click()
      await expect(output).toHaveValue(/^[a-f0-9]{64}$/)
    }
  }
  await expect(page.getByRole('alert')).toContainText('exceeds 32 MiB')

  const multiple = await page.evaluateHandle(() => {
    const data = new DataTransfer()
    data.items.add(new File([], 'one.bin'))
    data.items.add(new File([], 'two.bin'))
    return data
  })
  await fileInput.dispatchEvent('drop', { dataTransfer: multiple })
  await expect(page.getByRole('alert')).toContainText('one file at a time')
  await expect(page.getByText(`${limitInBytes}.bin`)).toBeVisible()
  await expect(output).toHaveValue(/^[a-f0-9]{64}$/)
})

test('discards a file read that finishes after switching to text', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const read = File.prototype.arrayBuffer
    File.prototype.arrayBuffer = function () {
      return new Promise((resolve, reject) => {
        window.addEventListener(
          'finish-file-read',
          () => void read.call(this).then(resolve, reject),
          { once: true },
        )
      })
    }
  })
  await page.goto('/tools/#/hash-generator')
  await page.getByRole('button', { name: 'File', exact: true }).click()
  await page.locator('hash-generator-tool input[type="file"]').setInputFiles({
    name: 'pending.bin',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from([0, 255]),
  })
  const generate = page.getByRole('button', { name: 'Generate hash' })
  await generate.click()
  await expect(generate).toBeDisabled()
  await page.getByRole('button', { name: 'Text', exact: true }).click()
  await page.getByLabel('Text input').fill('abc')
  await page.evaluate(() => window.dispatchEvent(new Event('finish-file-read')))
  await expect(generate).toBeEnabled()
  const output = page.getByLabel('HEX result')
  await expect(output).toHaveValue('')
  await generate.click()
  await expect(output).toHaveValue(
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  )
})
