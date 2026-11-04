import { expect, test, type Page } from '@playwright/test'

async function setLanguage(page: Page, language: 'ko' | 'en') {
  const dropdown = page.locator('app-header wa-dropdown').first()
  await dropdown.locator('[slot="trigger"]').click()
  await dropdown.locator(`wa-dropdown-item[value="${language}"]`).click()
}

for (const tool of [
  {
    route: 'json-formatter',
    input: 'Input JSON',
    value: '{"a":1}',
    action: 'Format',
    selector: 'json-formatter-tool',
  },
  {
    route: 'base64',
    input: 'Text input',
    value: 'hello',
    action: 'Convert',
    selector: 'base64-tool',
  },
  {
    route: 'hash-generator',
    input: 'Text input',
    value: 'hello',
    action: 'Generate hash',
    selector: 'hash-generator-tool',
  },
]) {
  test(`${tool.route} translates an existing copy notice`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto(`/tools/#/${tool.route}`)
    await page.getByLabel(tool.input).fill(tool.value)
    await page.getByRole('button', { name: tool.action }).click()
    await page.getByRole('button', { name: 'Copy result' }).click()
    const notice = page.locator(tool.selector).getByRole('status')
    await expect(notice).toHaveText('Copied.')
    await setLanguage(page, 'ko')
    await expect(notice).toHaveText('복사했습니다.')
    await setLanguage(page, 'en')
    await expect(notice).toHaveText('Copied.')
  })
}

for (const tool of [
  {
    route: 'json-formatter',
    input: 'Input JSON',
    value: '{"a":1}',
    action: 'Format',
    selector: 'json-formatter-tool',
    error: 'The input is not valid JSON.',
    koError: '올바른 JSON 형식이 아닙니다.',
    invalid: '{',
  },
  {
    route: 'base64',
    input: 'Text input',
    value: 'hello',
    action: 'Convert',
    selector: 'base64-tool',
    error: 'Enter a value.',
    koError: '값을 입력해주세요.',
    invalid: '',
  },
]) {
  test(`${tool.route} translates existing download and error messages`, async ({
    page,
  }) => {
    await page.goto(`/tools/#/${tool.route}`)
    await page.getByLabel(tool.input).fill(tool.value)
    await page.getByRole('button', { name: tool.action }).click()
    await page.getByRole('button', { name: 'Download' }).click()
    const notice = page.locator(tool.selector).getByRole('status')
    await expect(notice).toHaveText('Download started.')
    await setLanguage(page, 'ko')
    await expect(notice).toHaveText('다운로드를 시작했습니다.')
    await setLanguage(page, 'en')
    await page.getByLabel(tool.input).fill(tool.invalid)
    await page.getByRole('button', { name: tool.action }).click()
    const error = page.locator(tool.selector).getByRole('alert')
    await expect(error).toHaveText(tool.error)
    await setLanguage(page, 'ko')
    await expect(error).toHaveText(tool.koError)
  })
}
