import { describe, expect, it } from 'vitest'
import { transformJson } from './json-formatter.core'

describe('transformJson', () => {
  it('formats nested JSON', () => {
    expect(transformJson('{"a":{"b":true}}', 'format', 2)).toBe(
      '{\n  "a": {\n    "b": true\n  }\n}',
    )
  })
  it('minifies JSON', () => {
    expect(transformJson('{ "a": [1, 2] }', 'minify', 4)).toBe('{"a":[1,2]}')
  })
  it('rejects empty and invalid input', () => {
    expect(() => transformJson('  ', 'format', 2)).toThrow('empty-input')
    expect(() => transformJson('{', 'format', 2)).toThrow()
  })
})
