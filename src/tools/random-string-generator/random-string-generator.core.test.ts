import { describe, expect, it } from 'vitest'
import {
  ambiguousCharacters,
  characterSets,
  generateStrings,
  randomIndex,
  selectedSets,
  type GenerateOptions,
  type RandomBytes,
} from './random-string-generator.core'

const defaults: GenerateOptions = {
  length: 16,
  count: 1,
  kinds: ['lowercase', 'uppercase', 'digits'],
  excludeAmbiguous: false,
  requireEach: false,
}
const constant =
  (value: number): RandomBytes =>
  (bytes) => {
    bytes.fill(value)
  }

describe('random string generation', () => {
  it('defines exact sets and removes only the specified confusing characters', () => {
    expect(characterSets).toEqual({
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      digits: '0123456789',
      special: '!@#$%^&*()-_=+[]{};:,.?',
    })
    expect(ambiguousCharacters).toBe('01IOlo')
    expect(
      selectedSets(['lowercase', 'uppercase', 'digits', 'special'], true),
    ).toEqual([
      'abcdefghijkmnpqrstuvwxyz',
      'ABCDEFGHJKLMNPQRSTUVWXYZ',
      '23456789',
      characterSets.special,
    ])
    expect(selectedSets(['digits', 'digits'], false)).toEqual(['0123456789'])
  })
  it('validates bounds, integers, selected kinds and minimum length', () => {
    for (const length of [0, 257, 1.5, NaN, Infinity])
      expect(() => generateStrings({ ...defaults, length })).toThrow('length')
    for (const count of [0, 101, 1.5, NaN, Infinity])
      expect(() => generateStrings({ ...defaults, count })).toThrow('count')
    expect(() => generateStrings({ ...defaults, kinds: [] })).toThrow('types')
    expect(() =>
      generateStrings({ ...defaults, kinds: ['toString' as never] }),
    ).toThrow('types')
    expect(() =>
      generateStrings({ ...defaults, length: 2, requireEach: true }),
    ).toThrow('short')
    expect(
      generateStrings(
        { ...defaults, length: 1, count: 100, kinds: ['digits'] },
        constant(0),
      ),
    ).toEqual(Array(100).fill('0'))
    expect(
      generateStrings({ ...defaults, length: 256, count: 1 }, constant(0))[0],
    ).toHaveLength(256)
  })
  it('rejects the incomplete byte range before mapping to an index', () => {
    const values = [255, 250, 249]
    expect(randomIndex(10, () => values.shift()!)).toBe(9)
    expect(values).toEqual([])
    const indices = Array.from({ length: 250 }, (_, value) =>
      randomIndex(10, () => value),
    )
    expect(
      Array.from(
        { length: 10 },
        (_, index) => indices.filter((x) => x === index).length,
      ),
    ).toEqual(Array(10).fill(25))
    expect(() => randomIndex(0, () => 0)).toThrow('random')
    expect(() => randomIndex(10, () => 255)).toThrow('random')
  })
  it('rejects complete candidates without every selected kind', () => {
    const sequence = [0, 0, 0, 0, 26, 52]
    const fill: RandomBytes = (bytes) => {
      bytes.fill(0)
      bytes.set(sequence)
    }
    expect(
      generateStrings({ ...defaults, length: 3, requireEach: true }, fill),
    ).toEqual(['aA0'])
    expect(() =>
      generateStrings(
        { ...defaults, length: 3, requireEach: true },
        constant(0),
      ),
    ).toThrow('random')
  })
  it('supports every kind independently, exclusions, and errors from the random source', () => {
    for (const kind of Object.keys(
      characterSets,
    ) as (keyof typeof characterSets)[]) {
      const [output] = generateStrings(
        {
          ...defaults,
          kinds: [kind],
          excludeAmbiguous: true,
          requireEach: true,
        },
        constant(0),
      )
      expect(
        [...output!].every(
          (char) =>
            characterSets[kind].includes(char) &&
            !ambiguousCharacters.includes(char),
        ),
      ).toBe(true)
    }
    expect(() =>
      generateStrings(defaults, () => {
        throw new Error('unavailable')
      }),
    ).toThrow('unavailable')
  })
})
