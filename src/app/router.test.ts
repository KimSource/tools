import { describe, expect, it } from 'vitest'
import { parseHash } from './router'

describe('parseHash', () => {
  it('parses the home route', () => {
    expect(parseHash('#/')).toEqual({ kind: 'home' })
    expect(parseHash('')).toEqual({ kind: 'home' })
  })

  it('parses a tool route', () => {
    expect(parseHash('#/json-formatter')).toEqual({
      kind: 'tool',
      id: 'json-formatter',
    })
  })

  it('rejects malformed paths', () => {
    expect(parseHash('#/unknown/path')).toEqual({
      kind: 'not-found',
      path: 'unknown/path',
    })
  })
})
