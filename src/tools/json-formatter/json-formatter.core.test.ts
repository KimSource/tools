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
  it('formats all JSON value types and nested collections', () => {
    expect(
      transformJson(
        '{"object":{},"array":[],"string":"hello","number":1.5,"boolean":false,"empty":null,"nested":[{"ok":true}]}',
        'format',
        2,
      ),
    ).toBe(`{
  "object": {},
  "array": [],
  "string": "hello",
  "number": 1.5,
  "boolean": false,
  "empty": null,
  "nested": [
    {
      "ok": true
    }
  ]
}`)
  })
  it('preserves Unicode and escaped strings', () => {
    const input = String.raw`{"message":"안녕\n\"JSON\""}`
    expect(transformJson(input, 'format', 4)).toBe(
      String.raw`{
    "message": "안녕\n\"JSON\""
}`,
    )
  })
  it('rejects empty and invalid input', () => {
    expect(() => transformJson('  ', 'format', 2)).toThrow('empty-input')
    expect(() => transformJson('{', 'format', 2)).toThrow()
  })
})
