import { expect, test } from '@playwright/test'

test('converts components, reports errors, and copies parsed query parameters', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/tools/#/url-encoder')
  const input = page.getByLabel('Input', { exact: true })
  const output = page.getByLabel('Result')
  await input.fill('한글 &+')
  await page.getByRole('button', { name: 'Convert' }).click()
  await expect(output).toHaveValue('%ED%95%9C%EA%B8%80%20%26%2B')
  await page.getByLabel('Conversion mode').selectOption('decode')
  await input.fill('%FF')
  await page.getByRole('button', { name: 'Convert' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page.getByLabel('Conversion mode').selectOption('query')
  await input.fill('https://example.com/?a=hello+world&a=&x=%2B')
  await page.getByRole('button', { name: 'Convert' }).click()
  const result = JSON.stringify(
    [
      { key: 'a', value: 'hello world' },
      { key: 'a', value: '' },
      { key: 'x', value: '+' },
    ],
    null,
    2,
  )
  await expect(output).toHaveValue(result)
  await page.getByRole('button', { name: 'Copy result' }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(result)
  await input.fill('changed')
  await expect(output).toHaveValue('')
})
