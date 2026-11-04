import { expect, test } from '@playwright/test'

test('searches both languages, combines filters and clears empty results without loading tools', async ({
  page,
}) => {
  const toolRequests: string[] = []
  page.on('request', (request) => {
    if (/\/src\/tools\//.test(request.url())) toolRequests.push(request.url())
  })
  await page.goto('/tools/')
  const search = page.getByRole('searchbox', { name: 'Search tools' })
  await search.fill('타임스탬프')
  await expect(page.locator('[data-tool-id]')).toHaveCount(1)
  await expect(
    page.locator('[data-tool-id="unix-timestamp-converter"]'),
  ).toBeVisible()
  await page.getByRole('radio', { name: 'Text & Data' }).check()
  await expect(page.getByRole('status')).toContainText('No tools match')
  await page.getByRole('button', { name: 'Clear search and filters' }).click()
  await expect(search).toHaveValue('')
  await expect(
    page.getByRole('radio', { name: 'All', exact: true }),
  ).toBeChecked()
  await expect(page.locator('[data-tool-id]')).toHaveCount(11)
  await page.getByRole('radio', { name: 'Image & Design' }).check()
  await expect(page.locator('[data-tool-id="color-converter"]')).toBeVisible()
  await search.fill('색상')
  await expect(page.locator('[data-tool-id]')).toHaveCount(1)
  expect(toolRequests).toEqual([])
})

test('supports English search in Korean and keyboard category selection on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.addInitScript(() =>
    localStorage.setItem('local-tools:locale', 'ko'),
  )
  await page.goto('/tools/')
  const search = page.getByRole('searchbox', { name: '도구 검색' })
  await search.fill('timestamp')
  await expect(
    page.locator('[data-tool-id="unix-timestamp-converter"]'),
  ).toBeVisible()
  await page.getByRole('radio', { name: '전체', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: '텍스트·데이터' })).toBeChecked()
  await expect(page.getByRole('status')).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: '날짜·시간' })).toBeChecked()
  await expect(page.locator('[data-tool-id]')).toHaveCount(1)
})
