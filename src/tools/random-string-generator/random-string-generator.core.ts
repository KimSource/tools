export const characterSets = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  special: '!@#$%^&*()-_=+[]{};:,.?',
} as const
export type CharacterKind = keyof typeof characterSets
export const ambiguousCharacters = '01IOlo'
export type RandomError = 'length' | 'count' | 'types' | 'short' | 'random'
export type RandomBytes = (bytes: Uint8Array<ArrayBuffer>) => void

export interface GenerateOptions {
  length: number
  count: number
  kinds: readonly CharacterKind[]
  excludeAmbiguous: boolean
  requireEach: boolean
}

export function selectedSets(
  kinds: readonly CharacterKind[],
  exclude: boolean,
): string[] {
  const selected = new Set(kinds)
  return (Object.keys(characterSets) as CharacterKind[])
    .filter((kind) => selected.has(kind))
    .map((kind) =>
      [...characterSets[kind]]
        .filter((char) => !exclude || !ambiguousCharacters.includes(char))
        .join(''),
    )
}

// Rejection sampling keeps every index equally likely even when 256 is not divisible by size.
export function randomIndex(size: number, nextByte: () => number): number {
  if (!Number.isInteger(size) || size < 1 || size > 256)
    throw new Error('random')
  const limit = 256 - (256 % size)
  for (let attempt = 0; attempt < 10000; attempt++) {
    const value = nextByte()
    if (!Number.isInteger(value) || value < 0 || value > 255)
      throw new Error('random')
    if (value < limit) return value % size
  }
  throw new Error('random')
}

export function generateStrings(
  options: GenerateOptions,
  fill: RandomBytes = (bytes) => crypto.getRandomValues(bytes),
): string[] {
  const { length, count, kinds, excludeAmbiguous, requireEach } = options
  if (!Number.isInteger(length) || length < 1 || length > 256)
    throw new Error('length')
  if (!Number.isInteger(count) || count < 1 || count > 100)
    throw new Error('count')
  if (kinds.some((kind) => !Object.hasOwn(characterSets, kind)))
    throw new Error('types')
  const sets = selectedSets(kinds, excludeAmbiguous)
  if (sets.length === 0) throw new Error('types')
  if (requireEach && length < sets.length) throw new Error('short')
  const pool = sets.join('')
  const bytes = new Uint8Array(512)
  let cursor = bytes.length
  const nextByte = () => {
    if (cursor === bytes.length) {
      fill(bytes)
      cursor = 0
    }
    return bytes[cursor++]!
  }
  const results: string[] = []
  for (let item = 0; item < count; item++) {
    let accepted = false
    for (let attempt = 0; attempt < 10000; attempt++) {
      let candidate = ''
      for (let i = 0; i < length; i++)
        candidate += pool[randomIndex(pool.length, nextByte)]
      if (
        !requireEach ||
        sets.every((set) => [...candidate].some((char) => set.includes(char)))
      ) {
        results.push(candidate)
        accepted = true
        break
      }
    }
    if (!accepted) throw new Error('random')
  }
  return results
}
