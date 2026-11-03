import { expect, test } from '@playwright/test'

test('generates, copies and validates independent options', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/tools/#/random-string-generator')
  const output = page.getByLabel('Generated strings')
  await page.getByLabel('Lowercase (a–z)').uncheck()
  await page.getByLabel('Uppercase (A–Z)').uncheck()
  await page.getByLabel('Number of strings (1–100)').fill('3')
  await page.getByLabel('String length (1–256)').fill('8')
  await page
    .getByLabel('Exclude confusing characters (0, 1, I, O, l, o)')
    .check()
  await page.getByRole('button', { name: 'Generate strings' }).click()
  const value = await output.inputValue()
  expect(value.split('\n')).toHaveLength(3)
  expect(value.split('\n').every((line) => /^[2-9]{8}$/.test(line))).toBe(true)
  await page.getByRole('button', { name: 'Copy result' }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(value)
  await page.getByLabel('Digits (0–9)').uncheck()
  await expect(output).toHaveValue('')
  await page.getByRole('button', { name: 'Generate strings' }).click()
  await expect(page.getByRole('alert')).toContainText('Select at least one')
  await page.getByLabel('Lowercase (a–z)').check()
  await page.getByLabel('Uppercase (A–Z)').check()
  await page.getByLabel('Special characters').check()
  await expect(page.getByText('!@#$%^&*()-_=+[]{};:,.?')).toBeVisible()
  await page.getByLabel('Include at least one from each selected type').check()
  await page.getByLabel('String length (1–256)').fill('2')
  await page.getByRole('button', { name: 'Generate strings' }).click()
  await expect(page.getByRole('alert')).toContainText('3')
  await page.getByLabel('String length (1–256)').fill('16')
  await page.getByRole('button', { name: 'Generate strings' }).click()
  for (const line of (await output.inputValue()).split('\n')) {
    expect(line).toMatch(/[a-z]/)
    expect(line).toMatch(/[A-Z]/)
    expect(
      [...line].some((char) => '!@#$%^&*()-_=+[]{};:,.?'.includes(char)),
    ).toBe(true)
    expect(line).not.toMatch(/[01IOlo]/)
  }
  await page.getByLabel('Number of strings (1–100)').fill('101')
  await page.getByRole('button', { name: 'Generate strings' }).click()
  await expect(page.getByRole('alert')).toContainText('1 to 100')
  await expect(output).toHaveValue('')
})

test('finds the tool in Korean and English', async ({ page }) => {
  await page.goto('/tools/')
  const search = page.getByRole('searchbox', { name: 'Search tools' })
  for (const query of ['랜덤 문자열', 'random password']) {
    await search.fill(query)
    await expect(
      page.locator('[data-tool-id="random-string-generator"]'),
    ).toBeVisible()
  }
})
