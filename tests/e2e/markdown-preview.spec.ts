import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test('previews, blocks unsafe content and downloads the original', async ({
  page,
}) => {
  const external: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('example.invalid')) external.push(request.url())
  })
  await page.goto('/tools/#/markdown-preview')
  const input =
    '# Hello\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n```js\nconst x = 1\n```\n\n![secret](https://example.invalid/image)\n\n<img src=x onerror=alert(1)>\n\n[bad](javascript:alert(1)) [relative](/test) [safe](https://example.com)'
  await page.getByLabel('Markdown input').fill(input)
  const preview = page.locator('markdown-preview-tool .preview')
  await expect(preview.locator('h1')).toHaveText('Hello')
  await expect(preview.locator('table')).toBeVisible()
  await expect(preview.locator('.hljs-keyword')).toHaveText('const')
  await expect(preview.locator('img, script')).toHaveCount(0)
  await expect(preview.getByText('relative')).not.toHaveAttribute('href')
  await expect(preview.getByText('safe')).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  )
  expect(external).toEqual([])
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download', exact: true }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe('markdown.md')
  expect(await readFile((await file.path())!, 'utf8')).toBe(input)
  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(page.getByLabel('Markdown input')).toHaveValue('')
})

test('supports mobile layout and keyboard input', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/tools/#/markdown-preview')
  await page.getByLabel('Markdown input').focus()
  await page.keyboard.type('Mobile')
  await expect(page.locator('markdown-preview-tool .preview')).toContainText(
    'Mobile',
  )
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})

test('is searchable in Korean and retains input when the language changes', async ({
  page,
}) => {
  await page.goto('/tools/')
  await page.getByRole('searchbox').fill('마크다운')
  await page
    .locator('[data-tool-id="markdown-preview"]')
    .getByRole('button', { name: 'Open' })
    .click()
  await page.getByLabel('Markdown input').fill('# Hello')
  const dropdown = page.locator('app-header wa-dropdown').first()
  await dropdown.locator('[slot="trigger"]').click()
  await dropdown.locator('wa-dropdown-item[value="ko"]').click()
  await expect(page.getByLabel('Markdown 입력')).toHaveValue('# Hello')
  await expect(
    page.getByRole('heading', { name: '미리보기', exact: true }),
  ).toBeVisible()
})
