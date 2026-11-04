import { expect, test } from '@playwright/test'

test('searches zones, handles DST, converts multiple targets and copies', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/tools/#/time-zone-converter')
  await page.getByLabel('Date and time').fill('2024-03-10T02:30')
  await page.getByLabel('Search base time zones').fill('뉴욕')
  await page
    .getByRole('combobox', { name: 'Base time zone' })
    .selectOption('America/New_York')
  await page.getByRole('button', { name: 'Convert', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('does not exist')
  await page.getByLabel('Date and time').fill('2024-11-03T01:30')
  await page.getByRole('button', { name: 'Convert', exact: true }).click()
  await expect(
    page.getByText('This time occurs twice. Choose an offset.'),
  ).toBeVisible()
  await page.getByRole('radio', { name: 'UTC−04:00' }).check()
  await page.getByLabel('Search target time zones').fill('대한민국')
  await page
    .getByRole('combobox', { name: 'Target time zone' })
    .selectOption('Asia/Seoul')
  await page.getByRole('button', { name: 'Add target' }).click()
  await page.getByRole('button', { name: 'Convert', exact: true }).click()
  await expect(page.getByText(/2024-11-03 05:30 UTC\+00:00/)).toBeVisible()
  await expect(page.getByText(/2024-11-03 14:30 UTC\+09:00/)).toBeVisible()
  await page.getByRole('button', { name: 'Copy all results' }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('Asia/Seoul')
  await page.getByRole('button', { name: 'Language' }).click()
  await page.getByText('한국어', { exact: true }).click()
  await expect(page.getByRole('radio', { name: 'UTC−04:00' })).toBeChecked()
  await expect(page.getByText(/2024-11-03 14:30 UTC\+09:00/)).toContainText(
    '서울',
  )
  await page.getByRole('button', { name: '전체 결과 복사' }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('2024-11-03 05:30 UTC+00:00')
})

test('supports keyboard selection on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/tools/#/time-zone-converter')
  await page.getByLabel('Search target time zones').fill('seoul')
  const select = page.getByRole('combobox', { name: 'Target time zone' })
  await select.focus()
  await page.keyboard.press('ArrowDown')
  await expect(select).toHaveValue('Asia/Seoul')
})

test('initializes the same instant for supported and fallback time zones', async ({
  browser,
}) => {
  for (const [timezoneId, base, input] of [
    ['Asia/Seoul', 'Asia/Seoul', '2024-01-01T12:00'],
    ['UTC', 'UTC', '2024-01-01T03:00'],
    ['Etc/GMT-9', 'UTC', '2024-01-01T03:00'],
  ]) {
    const context = await browser.newContext({ timezoneId, locale: 'en-US' })
    const page = await context.newPage()
    await page.clock.install({ time: new Date('2024-01-01T03:00:00Z') })
    await page.goto('http://127.0.0.1:3000/tools/#/time-zone-converter')
    await expect(page.getByLabel('Date and time')).toHaveValue(input!)
    await expect(
      page.getByRole('combobox', { name: 'Base time zone' }),
    ).toHaveValue(base!)
    if (timezoneId === 'Etc/GMT-9')
      await expect(
        page.getByText(
          'Your time zone is unavailable; the initial time uses UTC.',
        ),
      ).toBeVisible()
    await page.getByRole('button', { name: 'Convert', exact: true }).click()
    await expect(page.getByText(/2024-01-01 03:00 UTC\+00:00/)).toBeVisible()
    if (timezoneId === 'Asia/Seoul') {
      await page.getByLabel('Date and time').fill('2024-06-15T09:30')
      await page
        .getByRole('combobox', { name: 'Base time zone' })
        .selectOption('UTC')
      await page.locator('time-zone-converter-tool').evaluate((tool) => {
        const parent = tool.parentElement!
        tool.remove()
        parent.append(tool)
      })
      await expect(page.getByLabel('Date and time')).toHaveValue(
        '2024-06-15T09:30',
      )
      await expect(
        page.getByRole('combobox', { name: 'Base time zone' }),
      ).toHaveValue('UTC')
    }
    await context.close()
  }
})

test('updates result text and clipboard in both languages without recalculation', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/tools/#/time-zone-converter')
  await page.getByLabel('Date and time').fill('2024-02-29T23:30')
  await page.getByLabel('Search base time zones').fill('UTC')
  await page
    .getByRole('combobox', { name: 'Base time zone' })
    .selectOption('UTC')
  await page.getByLabel('Search target time zones').fill('seoul')
  await page
    .getByRole('combobox', { name: 'Target time zone' })
    .selectOption('Asia/Seoul')
  await page.getByRole('button', { name: 'Add target' }).click()
  await page.getByRole('button', { name: 'Convert', exact: true }).click()
  const result = page.getByText(/2024-03-01 08:30 UTC\+09:00/)
  await expect(result).toContainText('Seoul · South Korea')
  await expect(result).toContainText('Later date (+1)')
  await page.getByRole('button', { name: 'Language' }).click()
  await page.getByText('한국어', { exact: true }).click()
  await expect(result).toContainText('서울 · 대한민국')
  await expect(result).toContainText('이후 날짜 (+1)')
  await page.getByRole('button', { name: '복사 Asia/Seoul' }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('서울 · 대한민국')
  await page.getByRole('button', { name: '전체 결과 복사' }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('이후 날짜 (+1)')
  await page.getByRole('button', { name: '언어' }).click()
  await page.getByText('English', { exact: true }).click()
  await expect(result).toContainText('Seoul · South Korea')
  await expect(result).toContainText('Later date (+1)')
  await page.getByRole('button', { name: 'Copy all results' }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('Later date (+1)')
})
