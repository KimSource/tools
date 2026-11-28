import { expect, test } from '@playwright/test'

test('converts components, reports errors, and copies parsed query parameters', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/tools/#/url-encoder')
  const tool = page.locator('url-encoder-tool')
  const modes = tool.getByRole('group', { name: 'Conversion mode' })
  const convert = tool.getByRole('button', { name: 'Convert' })
  const copy = tool.getByRole('button', { name: 'Copy result' })
  const input = tool.getByLabel('Plain text')
  const output = tool.getByLabel('Encoded result')
  await expect(modes.getByRole('button', { name: 'Encode' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(copy).toBeDisabled()
  const [inputBox, outputBox] = await Promise.all([
    input.boundingBox(),
    output.boundingBox(),
  ])
  expect(outputBox!.x).toBeGreaterThan(inputBox!.x + inputBox!.width)
  expect(outputBox!.y).toBe(inputBox!.y)

  await input.fill('한글 &+')
  await convert.click()
  await expect(output).toHaveValue('%ED%95%9C%EA%B8%80%20%26%2B')
  await expect(tool.getByRole('status')).toHaveText('Conversion complete.')

  await modes.getByRole('button', { name: 'Decode' }).click()
  const decodeInput = tool.getByLabel('Encoded text')
  const decodeOutput = tool.getByLabel('Decoded result')
  await expect(decodeInput).toHaveValue('한글 &+')
  await expect(decodeOutput).toHaveValue('')
  await expect(copy).toBeDisabled()
  await decodeInput.fill('%FF')
  await convert.click()
  await expect(tool.getByRole('alert')).toHaveText(
    'Check the percent encoding.',
  )
  await decodeInput.fill('hello+%20world')
  await convert.click()
  await expect(decodeOutput).toHaveValue('hello+ world')

  await modes.getByRole('button', { name: 'Parse query' }).click()
  const queryInput = tool.getByLabel('URL or query')
  const queryOutput = tool.getByLabel('Parsed parameters (JSON)')
  await queryInput.fill('https://example.com/?a=hello+world&a=&x=%2B')
  await convert.click()
  const result = JSON.stringify(
    [
      { key: 'a', value: 'hello world' },
      { key: 'a', value: '' },
      { key: 'x', value: '+' },
    ],
    null,
    2,
  )
  await expect(queryOutput).toHaveValue(result)
  await copy.click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(result)
  await expect(tool.getByRole('status')).toHaveText('Copied.')
  await queryInput.fill('changed')
  await expect(queryOutput).toHaveValue('')
  await tool.getByRole('button', { name: 'Reset' }).click()
  await expect(queryInput).toHaveValue('')
  await expect(queryInput).toBeFocused()
  await expect(copy).toBeDisabled()
})

test.describe('Korean mobile layout', () => {
  test.use({
    locale: 'ko-KR',
    colorScheme: 'dark',
    viewport: { width: 320, height: 760 },
  })

  test('places the conversion before the result and supports the keyboard', async ({
    page,
  }) => {
    await page.goto('/tools/#/url-encoder')
    const tool = page.locator('url-encoder-tool')
    const queryMode = tool.getByRole('button', { name: '쿼리 분해' })
    await queryMode.focus()
    await page.keyboard.press('Space')
    await expect(queryMode).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Tab')
    await expect(tool.getByRole('button', { name: '초기화' })).toBeFocused()
    await page.keyboard.press('Tab')
    const input = tool.getByLabel('URL 또는 쿼리')
    await expect(input).toBeFocused()
    const value = '서울'.repeat(32)
    await input.fill('?q=' + encodeURIComponent(value))
    await page.keyboard.press('Tab')
    const convert = tool.getByRole('button', { name: '변환' })
    await expect(convert).toBeFocused()
    await page.keyboard.press('Enter')
    const output = tool.getByLabel('분해 결과 (JSON)')
    await expect(output).toHaveValue(
      JSON.stringify([{ key: 'q', value }], null, 2),
    )
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
