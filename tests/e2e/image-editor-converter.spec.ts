import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { imageFile, orientedJpeg } from './image-fixtures'

async function open(page: Page) {
  await page.goto('/tools/#/image-editor-converter')
  await expect(page.getByLabel('Choose an image')).toBeEnabled()
}
async function generate(page: Page) {
  await page.getByRole('button', { name: 'Generate result' }).click()
  await expect(page.getByAltText('Result image preview')).toBeVisible()
}
async function pixels(page: Page) {
  return page.getByAltText('Result image preview').evaluate(async (element) => {
    const image = element as HTMLImageElement
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(image, 0, 0)
    return {
      width: canvas.width,
      height: canvas.height,
      corner: [
        ...ctx.getImageData(canvas.width - 1, canvas.height - 1, 1, 1).data,
      ],
    }
  })
}

for (const format of ['jpeg', 'webp'] as const) {
  test(`uses ${format} consistently when it is the first input, reset and replaced`, async ({
    page,
  }) => {
    await open(page)
    const file = await imageFile(page, format)
    const output = page.getByLabel('Output format', { exact: true })
    await page.getByLabel('Choose an image').setInputFiles(file)
    await expect(output).toHaveValue(format)
    await expect(
      page.getByLabel('Quality (0–100)', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByLabel('JPG background color (HEX)', { exact: true }),
    ).toHaveCount(format === 'jpeg' ? 1 : 0)
    await generate(page)
    const mime = await page
      .getByAltText('Result image preview')
      .evaluate(async (image) =>
        (await fetch((image as HTMLImageElement).src)).headers.get(
          'content-type',
        ),
      )
    expect(mime).toBe(`image/${format}`)
    const pendingDownload = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download', exact: true }).click()
    const download = await pendingDownload
    expect(download.suggestedFilename()).toBe(
      `source-edited.${format === 'jpeg' ? 'jpg' : 'webp'}`,
    )
    const bytes = await readFile((await download.path())!)
    expect(
      format === 'jpeg'
        ? bytes.subarray(0, 2).toString('hex')
        : bytes.subarray(8, 12).toString(),
    ).toBe(format === 'jpeg' ? 'ffd8' : 'WEBP')
    await output.selectOption('png')
    await expect(output).toHaveValue('png')
    await expect(
      page.getByLabel('Quality (0–100)', { exact: true }),
    ).toHaveCount(0)
    await page.getByRole('button', { name: 'Reset to original' }).click()
    await expect(output).toHaveValue(format)
    const replacement = format === 'jpeg' ? 'webp' : 'jpeg'
    await page
      .getByLabel('Choose an image')
      .setInputFiles(await imageFile(page, replacement))
    await expect(output).toHaveValue(replacement)
    await expect(
      page.getByLabel('JPG background color (HEX)', { exact: true }),
    ).toHaveCount(replacement === 'jpeg' ? 1 : 0)
  })
}

test('resizes, exports all formats and downloads the exact previewed result', async ({
  page,
}) => {
  await open(page)
  const file = await imageFile(page)
  await page.getByLabel('Choose an image').setInputFiles(file)
  await expect(page.getByAltText('Original image preview')).toBeVisible()
  await expect(page.locator('dd')).toContainText([
    'source.png',
    'PNG',
    'B',
    '60 × 40 px',
    '3:2',
  ])
  await page.getByLabel('Width (px)', { exact: true }).fill('30')
  await expect(page.getByLabel('Height (px)', { exact: true })).toHaveValue(
    '20',
  )
  await generate(page)
  expect(await pixels(page)).toMatchObject({
    width: 30,
    height: 20,
    corner: [0, 0, 0, 0],
  })
  for (const format of ['png', 'jpeg', 'webp']) {
    await page.getByLabel('Output format', { exact: true }).selectOption(format)
    await expect(page.getByAltText('Result image preview')).toHaveCount(0)
    if (format !== 'png')
      await page.getByLabel('Quality (0–100)', { exact: true }).fill('80')
    if (format === 'jpeg')
      await page
        .getByLabel('JPG background color (HEX)', { exact: true })
        .fill('#00ff00')
    await generate(page)
    const data = await pixels(page)
    expect(data).toMatchObject({ width: 30, height: 20 })
    if (format === 'jpeg') {
      expect(data.corner[1]).toBeGreaterThan(245)
      expect(data.corner[0]).toBeLessThan(10)
      expect(data.corner[3]).toBe(255)
    } else expect(data.corner[3]).toBe(0)
    const response = await page
      .getByAltText('Result image preview')
      .evaluate(async (img) => {
        const response = await fetch((img as HTMLImageElement).src)
        const blob = await response.blob()
        return {
          type: blob.type,
          size: blob.size,
          bytes: [...new Uint8Array(await blob.arrayBuffer())],
        }
      })
    const promise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download', exact: true }).click()
    const download = await promise
    expect(download.suggestedFilename()).toBe(
      `source-edited.${format === 'jpeg' ? 'jpg' : format}`,
    )
    const downloaded = await readFile((await download.path())!)
    expect([...downloaded]).toEqual(response.bytes)
    expect(response.type).toBe(`image/${format}`)
    const detected =
      format === 'png'
        ? downloaded.subarray(1, 4).toString()
        : format === 'webp'
          ? downloaded.subarray(8, 12).toString()
          : downloaded.subarray(0, 2).toString('hex')
    expect(detected).toBe(
      format === 'png' ? 'PNG' : format === 'webp' ? 'WEBP' : 'ffd8',
    )
    await expect(page.locator('.result')).toContainText(
      new Intl.NumberFormat('en').format(response.size) + ' B',
    )
    const delta =
      ((response.size - file.buffer.length) / file.buffer.length) * 100
    await expect(page.locator('.comparison')).toContainText(
      new Intl.NumberFormat('en', {
        maximumFractionDigits: 2,
        signDisplay: 'always',
      }).format(delta) + '%',
    )
    if (delta > 0) await expect(page.locator('.larger')).toBeVisible()
  }
})

test('supports percent, unlocked dimensions, enlargement, settings validation and reset', async ({
  page,
}) => {
  await open(page)
  await page.getByLabel('Choose an image').setInputFiles(await imageFile(page))
  await expect(
    page.getByRole('button', { name: 'Generate result' }),
  ).toBeEnabled()
  await page.getByLabel('Size input mode').selectOption('percent')
  await page.getByLabel('Width (%)', { exact: true }).fill('50')
  await expect(page.getByLabel('Height (%)', { exact: true })).toHaveValue('50')
  await generate(page)
  expect(await pixels(page)).toMatchObject({ width: 30, height: 20 })
  await page.getByLabel('Keep aspect ratio').uncheck()
  await page.getByLabel('Height (%)', { exact: true }).fill('25')
  await generate(page)
  expect(await pixels(page)).toMatchObject({ width: 30, height: 10 })
  await page.getByLabel('Width (%)', { exact: true }).fill('200')
  await page.getByRole('button', { name: 'Generate result' }).click()
  await expect(page.getByRole('alert')).toContainText('Enable enlargement')
  await expect(
    page.getByRole('button', { name: 'Download', exact: true }),
  ).toHaveCount(0)
  await page.getByLabel('Allow enlargement').check()
  await generate(page)
  expect(await pixels(page)).toMatchObject({ width: 120, height: 10 })
  await page.getByLabel('Width (%)', { exact: true }).fill('')
  await page.getByRole('button', { name: 'Generate result' }).click()
  await expect(page.getByRole('alert')).toContainText('positive dimensions')
  await page.getByLabel('Size input mode').selectOption('pixels')
  await expect(page.getByLabel('Size input mode')).toHaveValue('percent')
  await expect(page.getByLabel('Width (%)', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Reset to original' }).click()
  await expect(page.getByLabel('Width (px)', { exact: true })).toHaveValue('60')
  await expect(page.getByLabel('Keep aspect ratio')).toBeChecked()
  await expect(page.getByLabel('Allow enlargement')).not.toBeChecked()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByAltText('Result image preview')).toHaveCount(0)
  await expect(page.getByAltText('Original image preview')).toBeVisible()
  await page.getByLabel('Output format', { exact: true }).selectOption('jpeg')
  await page.getByLabel('Quality (0–100)', { exact: true }).fill('101')
  await page.getByRole('button', { name: 'Generate result' }).click()
  await expect(page.getByRole('alert')).toContainText('quality from 0 to 100')
  await page.getByLabel('Quality (0–100)', { exact: true }).fill('90')
  await page
    .getByLabel('JPG background color (HEX)', { exact: true })
    .fill('#fff')
  await page.getByRole('button', { name: 'Generate result' }).click()
  await expect(page.getByRole('alert')).toContainText('#RRGGBB')
})

test('accepts JPG and WebP input and honors EXIF orientation once', async ({
  page,
}) => {
  await open(page)
  for (const format of ['jpeg', 'webp']) {
    const file = await imageFile(page, format)
    if (format === 'jpeg') file.buffer = orientedJpeg(file.buffer)
    await page.getByLabel('Choose an image').setInputFiles(file)
    await expect(page.getByAltText('Original image preview')).toBeVisible()
    await expect(page.getByLabel('Width (px)', { exact: true })).toHaveValue(
      format === 'jpeg' ? '40' : '60',
    )
    await generate(page)
    expect(await pixels(page)).toMatchObject(
      format === 'jpeg' ? { width: 40, height: 60 } : { width: 60, height: 40 },
    )
  }
})

test('rejects unsupported, damaged, animated, oversized and multiple files while keeping the original', async ({
  page,
}) => {
  await open(page)
  const valid = await imageFile(page)
  await page.getByLabel('Choose an image').setInputFiles(valid)
  await expect(page.getByAltText('Original image preview')).toBeVisible()
  const cases = [
    { buffer: Buffer.from('GIF89a'), message: 'Only still PNG' },
    { buffer: valid.buffer.subarray(0, 24), message: 'could not be read' },
    { buffer: Buffer.alloc(10 * 1024 * 1024 + 1), message: 'exceeds 10 MiB' },
  ]
  // Insert an APNG animation chunk before IDAT; rejection happens before decoding.
  const animation = Buffer.alloc(20)
  animation.writeUInt32BE(8)
  animation.write('acTL', 4)
  cases.push({
    buffer: Buffer.concat([
      valid.buffer.subarray(0, 33),
      animation,
      valid.buffer.subarray(33),
    ]),
    message: 'Animated images',
  })
  const webp = Buffer.alloc(30)
  webp.write('RIFF')
  webp.writeUInt32LE(22, 4)
  webp.write('WEBPVP8X', 8)
  webp.writeUInt32LE(10, 16)
  webp[20] = 2
  cases.push({ buffer: webp, message: 'Animated images' })
  for (const [width, height] of [
    [8193, 1],
    [4001, 4000],
  ]) {
    const large = Buffer.from(valid.buffer)
    large.writeUInt32BE(width!, 16)
    large.writeUInt32BE(height!, 20)
    cases.push({ buffer: large, message: '16 million pixels' })
  }
  for (const item of cases) {
    await page
      .getByLabel('Choose an image')
      .setInputFiles({ ...valid, buffer: item.buffer })
    await expect(page.getByRole('alert')).toContainText(item.message)
    await expect(page.getByLabel('Width (px)', { exact: true })).toHaveValue(
      '60',
    )
    await expect(page.getByAltText('Original image preview')).toBeVisible()
  }
  const data = await page.evaluateHandle(
    (bytes) => {
      const dt = new DataTransfer()
      for (let i = 0; i < 2; i++)
        dt.items.add(
          new File([new Uint8Array(bytes)], `file${i}.png`, {
            type: 'image/png',
          }),
        )
      return dt
    },
    [...valid.buffer],
  )
  await page.locator('.drop').dispatchEvent('drop', { dataTransfer: data })
  await expect(page.getByRole('alert')).toContainText('one image at a time')
})

test('finds the tool, accepts drop and remains usable on mobile with keyboard and language changes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/tools/')
  await page.getByRole('searchbox', { name: 'Search tools' }).fill('이미지')
  await page
    .locator('[data-tool-id="image-editor-converter"]')
    .getByRole('button', { name: 'Open', exact: true })
    .click()
  await expect(page.getByLabel('Choose an image')).toBeEnabled()
  const file = await imageFile(page)
  const data = await page.evaluateHandle(
    (bytes) => {
      const dt = new DataTransfer()
      dt.items.add(
        new File([new Uint8Array(bytes)], 'drop.png', { type: 'image/png' }),
      )
      return dt
    },
    [...file.buffer],
  )
  await page.locator('.drop').dispatchEvent('drop', { dataTransfer: data })
  const width = page.getByLabel('Width (px)', { exact: true })
  await expect(width).toHaveValue('60')
  await width.focus()
  await page.keyboard.press('ArrowDown')
  await expect(width).toHaveValue('59')
  await generate(page)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  const language = page.locator('app-header wa-dropdown').first()
  await language.locator('[slot="trigger"]').click()
  await language.locator('wa-dropdown-item[value="ko"]').click()
  await expect(page.getByLabel('가로 (px)', { exact: true })).toHaveValue('59')
  await expect(page.getByAltText('결과 이미지 미리보기')).toBeVisible()
  await page
    .locator('app-header wa-dropdown')
    .nth(1)
    .locator('[slot="trigger"]')
    .click()
  await page.locator('wa-dropdown-item[value="dark"]').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByAltText('결과 이미지 미리보기')).toBeVisible()
})

test('disables unsupported encoders and rejects unexpected fallback or failed encoding', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      return original.call(
        this,
        callback,
        type === 'image/webp' && this.width === 1 ? 'image/png' : type,
        quality,
      )
    }
  })
  await open(page)
  await page
    .getByLabel('Choose an image')
    .setInputFiles(await imageFile(page, 'webp'))
  await expect(
    page
      .getByLabel('Output format', { exact: true })
      .locator('option[value="webp"]'),
  ).toBeDisabled()
  await expect(page.locator('dd').nth(1)).toHaveText('WebP')
  await expect(page.getByLabel('Output format', { exact: true })).toHaveValue(
    'png',
  )
  await expect(page.getByLabel('Quality (0–100)', { exact: true })).toHaveCount(
    0,
  )
  await expect(page.getByRole('status')).toContainText(
    'supported output format has been selected',
  )
  await generate(page)
  expect(
    await page
      .getByAltText('Result image preview')
      .evaluate(async (image) =>
        (await fetch((image as HTMLImageElement).src)).headers.get(
          'content-type',
        ),
      ),
  ).toBe('image/png')
  // Capability probe succeeded for JPG; force a later fallback and verify no mislabeled download.
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      return original.call(
        this,
        callback,
        type === 'image/jpeg' ? 'image/png' : type,
        quality,
      )
    }
  })
  await page.getByLabel('Output format', { exact: true }).selectOption('jpeg')
  await page.getByRole('button', { name: 'Generate result' }).click()
  await expect(page.getByRole('alert')).toContainText('requested format')
  await expect(
    page.getByRole('button', { name: 'Download', exact: true }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Reset to original' }).click()
  await expect(page.getByLabel('Output format', { exact: true })).toHaveValue(
    'png',
  )
  await expect(page.getByLabel('Quality (0–100)', { exact: true })).toHaveCount(
    0,
  )
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.toBlob = function (callback) {
      callback(null)
    }
  })
  await page.getByRole('button', { name: 'Generate result' }).click()
  await expect(page.getByRole('alert')).toContainText('could not be generated')
  await expect(page.getByAltText('Result image preview')).toHaveCount(0)
})

test('releases preview URLs on edit, reset, replacement and navigation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const originalCreate = URL.createObjectURL,
      originalRevoke = URL.revokeObjectURL
    const active = new Set<string>()
    Object.assign(window, { imagePreviewUrls: active })
    URL.createObjectURL = function (blob) {
      const url = originalCreate.call(URL, blob)
      active.add(url)
      return url
    }
    URL.revokeObjectURL = function (url) {
      active.delete(url)
      originalRevoke.call(URL, url)
    }
  })
  await open(page)
  const file = await imageFile(page)
  const count = () =>
    page.evaluate(
      () =>
        (window as unknown as { imagePreviewUrls: Set<string> })
          .imagePreviewUrls.size,
    )
  await page.getByLabel('Choose an image').setInputFiles(file)
  await generate(page)
  expect(await count()).toBe(2)
  await page.getByLabel('Width (px)', { exact: true }).fill('30')
  expect(await count()).toBe(1)
  await generate(page)
  await page.getByRole('button', { name: 'Reset to original' }).click()
  expect(await count()).toBe(1)
  await page.getByLabel('Choose an image').setInputFiles(file)
  await expect(
    page.getByRole('button', { name: 'Generate result' }),
  ).toBeEnabled()
  expect(await count()).toBe(1)
  await page.goto('/tools/#/json-formatter')
  await expect.poll(count).toBe(0)
})

test('discards encoding completed after leaving the editor and closes the source bitmap', async ({
  page,
}) => {
  await open(page)
  await page.getByLabel('Choose an image').setInputFiles(await imageFile(page))
  await expect(
    page.getByRole('button', { name: 'Generate result' }),
  ).toBeEnabled()
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob
    const close = ImageBitmap.prototype.close
    const state = { finish: null as (() => void) | null, closed: 0, urls: 0 }
    Object.assign(window, { pendingImage: state })
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      original.call(
        this,
        (blob) => {
          state.finish = () => callback(blob)
        },
        type,
        quality,
      )
    }
    ImageBitmap.prototype.close = function () {
      state.closed++
      close.call(this)
    }
    const create = URL.createObjectURL
    URL.createObjectURL = function (blob) {
      state.urls++
      return create.call(URL, blob)
    }
  })
  await page.getByRole('button', { name: 'Generate result' }).click()
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(
          (window as unknown as { pendingImage: { finish: unknown } })
            .pendingImage.finish,
        ),
      ),
    )
    .toBe(true)
  await page.goto('/tools/#/json-formatter')
  await expect(page.getByLabel('Input JSON')).toBeVisible()
  await page.evaluate(async () => {
    ;(
      window as unknown as { pendingImage: { finish: () => void } }
    ).pendingImage.finish()
    // Flush the toBlob, format verification and UI continuations.
    await new Promise((resolve) => setTimeout(resolve, 100))
  })
  expect(
    await page.evaluate(() => {
      const state = (
        window as unknown as { pendingImage: { closed: number; urls: number } }
      ).pendingImage
      return { closed: state.closed, urls: state.urls }
    }),
  ).toEqual({ closed: 1, urls: 0 })
  await expect(page.locator('image-editor-converter-tool')).toHaveCount(0)
})
