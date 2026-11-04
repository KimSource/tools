import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown-preview.core'

describe('Markdown preview', () => {
  it('renders tables, Unicode and highlighted supported code', () => {
    const result = renderMarkdown(
      '| 이름 | 값 |\n| --- | --- |\n| 한글 | 😀 |\n\n```js\nconst x = 1\n```',
    )
    expect(result).toContain('<table>')
    expect(result).toContain('한글')
    expect(result).toContain('😀')
    expect(result).toContain('hljs-keyword')
  })
  it('escapes raw HTML and unknown or unlabelled code', () => {
    const result = renderMarkdown(
      '<img src=x onerror=alert(1)>\n\n```unknown\n<script>alert(1)</script>\n```\n\n```\n<b>\n```',
    )
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('<img')
    expect(result).toContain('&lt;script&gt;')
    expect(result).toContain('&lt;b&gt;')
    expect(renderMarkdown('')).toBe('')
  })
  it('suppresses image requests and only links absolute HTTP URLs', () => {
    const result = renderMarkdown(
      '![alt](https://example.com/a.png) [ok](https://example.com) [relative](/private) [bad](javascript:alert(1))',
    )
    expect(result).not.toContain('<img')
    expect(result).toContain('alt')
    expect(result).toContain('href="https://example.com"')
    expect(result).not.toContain('href="/private"')
    expect(result).not.toContain('href="javascript:')
  })
})
