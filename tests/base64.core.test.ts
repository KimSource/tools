import { describe, expect, it } from 'vitest'
import { transformBase64 } from '../src/tools/base64/base64.core'

describe('transformBase64', () => {
  it('encodes and decodes UTF-8 text', () => {
    const encoded = transformBase64('안녕하세요 🌍', 'encode')
    expect(encoded).toBe('7JWI64WV7ZWY7IS47JqUIPCfjI0=')
    expect(transformBase64(encoded, 'decode')).toBe('안녕하세요 🌍')
  })
  it('accepts whitespace while decoding', () => {
    expect(transformBase64('SGVs\n bG8=', 'decode')).toBe('Hello')
  })
  it('rejects empty and invalid input', () => {
    expect(() => transformBase64('', 'encode')).toThrow('empty-input')
    expect(() => transformBase64('not-base64!', 'decode')).toThrow(
      'invalid-base64',
    )
  })
})
