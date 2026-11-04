import { describe, expect, it } from 'vitest'
import { filterTools } from './tool-search'
import { toolRegistry } from './tool-registry'

const ids = (
  query: string,
  category: Parameters<typeof filterTools>[2] = 'all',
) => filterTools(toolRegistry, query, category).map((tool) => tool.id)

describe('tool search', () => {
  it('matches both languages, tags and keywords regardless of case', () => {
    expect(ids('타임스탬프')).toContain('unix-timestamp-converter')
    expect(ids('TIMESTAMP')).toContain('unix-timestamp-converter')
    expect(ids('체크섬')).toContain('hash-generator')
    expect(ids('SHA-256')).toContain('hash-generator')
    expect(ids('쿼리 parameter')).toContain('url-encoder')
    expect(ids('랜덤 문자열', 'text-data')).toContain('random-string-generator')
    expect(ids('random password')).toContain('random-string-generator')
    expect(ids('이미지 resize', 'image-design')).toContain(
      'image-editor-converter',
    )
    expect(ids('색상')).toContain('color-converter')
    expect(ids('HSL', 'image-design')).toContain('color-converter')
  })
  it('combines all query terms with the category', () => {
    expect(ids('  UTF-8   decode ', 'text-data')).toContain('base64')
    expect(ids('timestamp', 'text-data')).toEqual([])
    expect(ids('timestamp unknown')).toEqual([])
  })
  it('handles empty queries and categories', () => {
    expect(ids('   ')).toHaveLength(toolRegistry.length)
    expect(ids('', 'date-time')).toEqual([
      'time-zone-converter',
      'date-calculator',
      'unix-timestamp-converter',
    ])
    expect(ids('', 'image-design')).toEqual([
      'image-editor-converter',
      'qr-code',
      'color-converter',
    ])
  })
})
