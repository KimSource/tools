import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import bash from 'highlight.js/lib/languages/bash'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'

for (const [name, grammar] of Object.entries({
  javascript,
  typescript,
  json,
  xml,
  css,
  bash,
  python,
  sql,
})) {
  hljs.registerLanguage(name, grammar)
}

const parser = new MarkdownIt({
  html: false,
  highlight(code, language) {
    if (!language || !hljs.getLanguage(language)) return ''
    try {
      return hljs.highlight(code, { language, ignoreIllegals: true }).value
    } catch {
      return ''
    }
  },
})

parser.renderer.rules.image = (tokens, index) =>
  parser.utils.escapeHtml(tokens[index]?.content ?? '')
parser.renderer.rules.link_open = (tokens, index, options, _env, renderer) => {
  const token = tokens[index]!
  const href = String(token.attrGet('href') ?? '')
  let allowed = false
  try {
    const url = new URL(href)
    allowed =
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      Boolean(url.hostname)
  } catch {
    // Relative and malformed URLs are not navigable.
  }
  if (allowed) {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noopener noreferrer')
  } else {
    const hrefIndex = token.attrIndex('href')
    if (hrefIndex >= 0) token.attrs?.splice(hrefIndex, 1)
  }
  return renderer.renderToken(tokens, index, options)
}

export function renderMarkdown(input: string): string {
  return parser.render(input)
}
