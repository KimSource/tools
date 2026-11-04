import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { imageFile } from './image-fixtures'

test('loads the manifest and works offline after the service worker is ready', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://127.0.0.1:3001',
  })
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
  const jsonToolCard = page.locator('[data-tool-id="json-formatter"]')
  await expect(
    jsonToolCard.getByText('Available offline', { exact: true }),
  ).toBeVisible()
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

  await page.getByRole('button', { name: 'Copy result' }).click()
  await expect.poll(() =>
    page.evaluate(() =>
      navigator.clipboard
        .readText()
        .then((text) => text.replaceAll('\r\n', '\n')),
    ),
  ).toBe(`{
  "offline": true
}`)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('formatted.json')
  const downloadPath = await download.path()
  expect(downloadPath).not.toBeNull()
  await expect(readFile(downloadPath!, 'utf8')).resolves.toBe(`{
  "offline": true
}`)
})

test('does not use an old tool cache when the current tool asset is missing', async ({
  page,
}) => {
  await page.goto('/tools/')
  const jsonToolCard = page.locator('[data-tool-id="json-formatter"]')
  await expect(
    jsonToolCard.getByText('Available offline', { exact: true }),
  ).toBeVisible()
  await page.evaluate(async () => {
    for (const name of await caches.keys()) {
      const cache = await caches.open(name)
      for (const request of await cache.keys()) {
        if (new URL(request.url).pathname.includes('/assets/json-formatter-')) {
          await cache.delete(request)
        }
      }
    }
    const stale = await caches.open('old-tool-cache')
    await stale.put('/tools/assets/json-formatter-old.js', new Response('old'))
  })
  await page.reload()
  // Wait for the asynchronous readiness check instead of asserting before it runs.
  await page.evaluate(async () => {
    const shell = document.querySelector('app-shell') as HTMLElement & {
      refreshOfflineStatus(): Promise<void>
      updateComplete: Promise<boolean>
    }
    await shell.refreshOfflineStatus()
    await shell.updateComplete
  })
  await expect(
    jsonToolCard.getByText('Available offline', { exact: true }),
  ).toHaveCount(0)
})

test('opens the formatter for the first time while offline', async ({
  page,
  context,
}) => {
  await page.goto('/tools/')
  await expect(
    page.getByRole('heading', { name: 'Small tools for your work' }),
  ).toBeVisible()
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true)

  await context.setOffline(true)
  await page.goto('/tools/#/json-formatter')
  await expect(page.getByLabel('Input JSON')).toBeVisible()
  await page.getByLabel('Input JSON').fill('{"firstOffline":true}')
  await page.getByRole('button', { name: 'Format' }).click()
  await expect(page.getByLabel('Output')).toHaveValue(`{
  "firstOffline": true
}`)
})

test('opens the hash generator for the first time offline', async ({
  page,
  context,
}) => {
  await page.goto('/tools/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect(
    page
      .locator('[data-tool-id="hash-generator"]')
      .getByText('Available offline', { exact: true }),
  ).toBeVisible()
  await context.setOffline(true)
  await page.goto('/tools/#/hash-generator')
  await page.getByLabel('Text input').fill('abc')
  await page.getByRole('button', { name: 'Generate hash' }).click()
  await expect(page.getByLabel('HEX result')).toHaveValue(
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  )
})

test('opens the URL tool for the first time offline', async ({
  page,
  context,
}) => {
  await page.goto('/tools/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect(
    page
      .locator('[data-tool-id="url-encoder"]')
      .getByText('Available offline', { exact: true }),
  ).toBeVisible()
  await context.setOffline(true)
  await page.goto('/tools/#/url-encoder')
  await page.getByLabel('Input', { exact: true }).fill('offline & ready')
  await page.getByRole('button', { name: 'Convert' }).click()
  await expect(page.getByLabel('Result')).toHaveValue('offline%20%26%20ready')
})

test('opens the timestamp converter for the first time offline', async ({
  page,
  context,
}) => {
  await page.goto('/tools/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect(
    page
      .locator('[data-tool-id="unix-timestamp-converter"]')
      .getByText('Available offline', { exact: true }),
  ).toBeVisible()
  await context.setOffline(true)
  await page.goto('/tools/#/unix-timestamp-converter')
  await page.getByLabel('Unix timestamp', { exact: true }).fill('1704067200')
  await page.getByRole('button', { name: 'Convert timestamp' }).click()
  await expect(page.getByLabel('ISO 8601', { exact: true })).toHaveValue(
    '2024-01-01T00:00:00.000Z',
  )
})

test('searches and opens a tool offline after cache preparation', async ({
  page,
  context,
}) => {
  await page.goto('/tools/')
  await expect(
    page
      .locator('[data-tool-id="unix-timestamp-converter"]')
      .getByText('Available offline'),
  ).toBeVisible()
  await context.setOffline(true)
  await page.reload()
  await page.getByRole('searchbox', { name: 'Search tools' }).fill('타임스탬프')
  await page.getByRole('radio', { name: 'Date & Time' }).check()
  await expect(page.locator('[data-tool-id]')).toHaveCount(1)
  await page
    .locator('[data-tool-id="unix-timestamp-converter"]')
    .getByRole('button', { name: 'Open' })
    .click()
  await expect(page.getByLabel('Unix timestamp', { exact: true })).toBeVisible()
})

test('opens the color converter for the first time offline', async ({
  page,
  context,
}) => {
  await page.goto('/tools/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect(
    page
      .locator('[data-tool-id="color-converter"]')
      .getByText('Available offline', { exact: true }),
  ).toBeVisible()
  await context.setOffline(true)
  await page.goto('/tools/#/color-converter')
  await page.getByLabel('HEX input').fill('#f00')
  await page.getByRole('button', { name: 'Convert HEX' }).click()
  await expect(page.getByLabel('RGB result')).toHaveValue('rgb(255, 0, 0)')
})

test('opens the random string generator for the first time offline', async ({
  page,
  context,
}) => {
  await page.goto('/tools/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect(
    page
      .locator('[data-tool-id="random-string-generator"]')
      .getByText('Available offline', { exact: true }),
  ).toBeVisible()
  await context.setOffline(true)
  await page.goto('/tools/#/random-string-generator')
  await page.getByRole('button', { name: 'Generate strings' }).click()
  await expect(page.getByLabel('Generated strings')).toHaveValue(
    /^[a-zA-Z0-9]{16}$/,
  )
})

test('opens the date calculator for the first time offline', async ({
  page,
  context,
}) => {
  await page.goto('/tools/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect(
    page
      .locator('[data-tool-id="date-calculator"]')
      .getByText('Available offline', { exact: true }),
  ).toBeVisible()
  await context.setOffline(true)
  await page.goto('/tools/#/date-calculator')
  await page.getByLabel('Start date', { exact: true }).fill('2024-03-09')
  await page.getByLabel('End date', { exact: true }).fill('2024-03-11')
  await page.getByRole('button', { name: 'Calculate' }).click()
  await expect(page.getByLabel('Result', { exact: true })).toHaveValue(/2 Days/)
})

test('generates and reads a QR code on the first offline visit', async ({
  page,
  context,
}) => {
  await page.goto('/tools/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect(
    page
      .locator('[data-tool-id="qr-code"]')
      .getByText('Available offline', { exact: true }),
  ).toBeVisible()
  await context.setOffline(true)
  await page.goto('/tools/#/qr-code')
  await page.getByLabel('Text or URL').fill('offline QR')
  await page.getByRole('button', { name: 'Generate QR code' }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download PNG' }).click()
  const buffer = await readFile((await (await download).path())!)
  await page.getByRole('button', { name: 'Read', exact: true }).click()
  await page
    .getByLabel('Choose an image')
    .setInputFiles({ name: 'qr.png', mimeType: 'image/png', buffer })
  await expect(page.getByLabel('QR content')).toHaveValue('offline QR')
})

test('opens Markdown preview for the first time offline', async ({
  page,
  context,
}) => {
  await page.goto('/tools/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect(
    page
      .locator('[data-tool-id="markdown-preview"]')
      .getByText('Available offline', { exact: true }),
  ).toBeVisible()
  await context.setOffline(true)
  await page.goto('/tools/#/markdown-preview')
  await page
    .getByLabel('Markdown input')
    .fill('| A | B |\n| - | - |\n| 1 | 2 |\n\n```js\nconst x = 1\n```')
  await expect(page.locator('markdown-preview-tool table')).toBeVisible()
  await expect(page.locator('markdown-preview-tool .hljs-keyword')).toHaveText(
    'const',
  )
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download', exact: true }).click()
  expect(await readFile((await (await download).path())!, 'utf8')).toContain(
    'const x = 1',
  )
})

test('opens and converts time zones on the first offline visit', async ({
  page,
  context,
}) => {
  await page.goto('/tools/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect(
    page
      .locator('[data-tool-id="time-zone-converter"]')
      .getByText('Available offline', { exact: true }),
  ).toBeVisible()
  await context.setOffline(true)
  await page.goto('/tools/#/time-zone-converter')
  await page.getByLabel('Date and time').fill('2024-01-01T12:00')
  await page.getByLabel('Search base time zones').fill('seoul')
  await page
    .getByRole('combobox', { name: 'Base time zone' })
    .selectOption('Asia/Seoul')
  await page.getByRole('button', { name: 'Convert', exact: true }).click()
  await expect(page.getByText(/2024-01-01 03:00 UTC\+00:00/)).toBeVisible()
})

test('opens the image editor for the first time offline and converts and downloads a local image', async ({
  page,
  context,
}) => {
  const onlineToolRequests: string[] = []
  page.on('request', (request) => {
    if (
      request.resourceType() === 'script' &&
      request.url().includes('/assets/image-editor-converter-')
    )
      onlineToolRequests.push(request.url())
  })
  await page.goto('/tools/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect(
    page
      .locator('[data-tool-id="image-editor-converter"]')
      .getByText('Available offline', { exact: true }),
  ).toBeVisible()
  // The service worker precached this chunk, but the page has never imported it.
  expect(onlineToolRequests).toEqual([])
  const input = await imageFile(page)
  await context.setOffline(true)
  await page.goto('/tools/#/image-editor-converter')
  await expect(page.getByLabel('Choose an image')).toBeEnabled()
  await page.reload()
  await page.getByLabel('Choose an image').setInputFiles(input)
  await expect(page.getByLabel('Width (px)', { exact: true })).toHaveValue('60')
  await page.getByLabel('Width (px)', { exact: true }).fill('30')
  await page.getByLabel('Output format', { exact: true }).selectOption('webp')
  await page.getByRole('button', { name: 'Generate result' }).click()
  await expect(page.getByAltText('Result image preview')).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('source-edited.webp')
  const bytes = await readFile((await download.path())!)
  expect(bytes.subarray(8, 12).toString()).toBe('WEBP')
  const dimensions = await page
    .getByAltText('Result image preview')
    .evaluate((img) => [
      (img as HTMLImageElement).naturalWidth,
      (img as HTMLImageElement).naturalHeight,
    ])
  expect(dimensions).toEqual([30, 20])
})
