import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test.describe('Base64 Encoder / Decoder', () => {
  test('preserves input across modes and downloads the decoded result', async ({
    page,
  }) => {
    await page.goto('/tools/#/base64')
    const tool = page.locator('base64-tool')
    const encode = tool.getByRole('button', { name: 'Encode' })
    const decode = tool.getByRole('button', { name: 'Decode' })
    const convert = tool.getByRole('button', { name: 'Convert' })
    const copy = tool.getByRole('button', { name: 'Copy result' })
    const downloadButton = tool.getByRole('button', { name: 'Download' })
    const input = tool.getByLabel('Text input')
    const output = tool.getByLabel('Base64 result')
    await expect(encode).toHaveAttribute('aria-pressed', 'true')
    await expect(copy).toBeDisabled()
    await expect(downloadButton).toBeDisabled()

    const [inputBox, outputBox] = await Promise.all([
      input.boundingBox(),
      output.boundingBox(),
    ])
    expect(outputBox!.x).toBeGreaterThan(inputBox!.x + inputBox!.width)
    expect(outputBox!.y).toBe(inputBox!.y)

    const text = 'Hello, 안녕 🌍'
    const encoded = 'SGVsbG8sIOyViOuFlSDwn4yN'
    await input.fill(text)
    await convert.click()
    await expect(output).toHaveValue(encoded)
    await expect(tool.getByRole('status')).toHaveText('Conversion complete.')
    await encode.click()
    await expect(output).toHaveValue(encoded)

    await decode.click()
    await expect(decode).toHaveAttribute('aria-pressed', 'true')
    const decodeInput = tool.getByLabel('Base64 input')
    const decodeOutput = tool.getByLabel('Text result')
    await expect(decodeInput).toHaveValue(text)
    await expect(decodeOutput).toHaveValue('')
    await expect(copy).toBeDisabled()
    await expect(downloadButton).toBeDisabled()

    await convert.click()
    await expect(tool.getByRole('alert')).toHaveText(
      'The input is not valid Base64 text.',
    )
    await decodeInput.fill(encoded)
    await expect(tool.getByRole('alert')).toBeHidden()
    await convert.click()
    await expect(decodeOutput).toHaveValue(text)
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadButton.click(),
    ])
    expect(download.suggestedFilename()).toBe('decoded.txt')
    expect(await readFile(await download.path(), 'utf8')).toBe(text)

    await tool.getByRole('button', { name: 'Reset' }).click()
    await expect(decodeInput).toHaveValue('')
    await expect(decodeInput).toBeFocused()
    await expect(decodeOutput).toHaveValue('')
    await expect(downloadButton).toBeDisabled()
  })
})

test.describe('Korean mobile layout', () => {
  test.use({
    locale: 'ko-KR',
    colorScheme: 'dark',
    viewport: { width: 320, height: 760 },
  })

  test('places conversion before the result and wraps long Base64 output', async ({
    page,
  }) => {
    await page.goto('/tools/#/base64')
    const tool = page.locator('base64-tool')
    const encode = tool.getByRole('button', { name: '인코딩' })
    const decode = tool.getByRole('button', { name: '디코딩' })
    await decode.focus()
    await page.keyboard.press('Space')
    await expect(decode).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Shift+Tab')
    await expect(encode).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(encode).toHaveAttribute('aria-pressed', 'true')

    const input = tool.getByLabel('텍스트 입력')
    const output = tool.getByLabel('Base64 결과')
    const convert = tool.getByRole('button', { name: '변환' })
    const text = '한글'.repeat(48)
    await input.fill(text)
    await expect(input).toHaveAccessibleDescription('UTF-8 · 96자 · 288바이트')
    await page.keyboard.press('Tab')
    await expect(convert).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(output).toHaveValue(Buffer.from(text).toString('base64'))

    const [convertBox, outputBox] = await Promise.all([
      convert.boundingBox(),
      output.boundingBox(),
    ])
    expect(outputBox!.y).toBeGreaterThan(convertBox!.y + convertBox!.height)
    expect(
      await output.evaluate((field) => field.scrollWidth <= field.clientWidth),
    ).toBe(true)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(320)
  })
})
