import { describe, expect, it } from 'vitest'
import { generateHash } from './hash-generator.core'

describe('generateHash', () => {
  it('hashes empty text and preserves whitespace and UTF-8', async () => {
    await expect(generateHash('', 'SHA-256')).resolves.toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
    await expect(generateHash('abc', 'SHA-256')).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
    await expect(generateHash('abc\n', 'SHA-256')).resolves.toBe(
      'edeaaff3f1774ad2888673770c6d64097e391bc362d7d6fb34982ddf0efd18cb',
    )
    await expect(generateHash('안녕 🌍', 'SHA-256')).resolves.toBe(
      'dab455f8894d6ee89b6ee67eb2d815e7914cd44c2849f69b5197e27b704f791a',
    )
  })

  it('supports SHA-384 and SHA-512', async () => {
    await expect(generateHash('abc', 'SHA-384')).resolves.toBe(
      'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7',
    )
    await expect(generateHash('abc', 'SHA-512')).resolves.toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    )
  })
})
