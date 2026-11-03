import { describe, expect, it } from 'vitest'
import { transformUrl } from './url-encoder.core'

describe('URL conversion', () => {
  it('round trips Unicode and encodes reserved characters as a component', () => {
    const input = '한글 🌍 /?&=+'
    expect(transformUrl(input, 'encode')).toBe(
      '%ED%95%9C%EA%B8%80%20%F0%9F%8C%8D%20%2F%3F%26%3D%2B',
    )
    expect(transformUrl(transformUrl(input, 'encode'), 'decode')).toBe(input)
    expect(transformUrl('a+b%20c', 'decode')).toBe('a+b c')
  })
  it('parses query strings and URLs with duplicate and empty values', () => {
    const expected = [
      { key: 'a', value: '한 글' },
      { key: 'a', value: '' },
      { key: '', value: 'x=y' },
      { key: 'flag', value: '' },
    ]
    const query = 'a=%ED%95%9C+%EA%B8%80&a=&=x%3Dy&flag'
    expect(JSON.parse(transformUrl(`?${query}#fragment`, 'query'))).toEqual(
      expected,
    )
    expect(
      JSON.parse(
        transformUrl(`https://example.com/?${query}#fragment`, 'query'),
      ),
    ).toEqual(expected)
    expect(JSON.parse(transformUrl('https://example.com/', 'query'))).toEqual(
      [],
    )
  })
  it('rejects empty input, invalid escapes, malformed UTF-8 and lone surrogates', () => {
    expect(() => transformUrl('', 'encode')).toThrow('empty-input')
    for (const value of ['%', '%GG', '%FF', '%E3%81']) {
      expect(() => transformUrl(value, 'decode')).toThrow('invalid-input')
      expect(() => transformUrl(`a=${value}`, 'query')).toThrow('invalid-input')
    }
    expect(() => transformUrl('\ud800', 'encode')).toThrow('invalid-input')
    expect(() => transformUrl('https://[bad', 'query')).toThrow('invalid-input')
  })
})
