export type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512'

const textEncoder = new TextEncoder()

export function hashInputByteLength(input: string): number {
  return textEncoder.encode(input).byteLength
}

export async function generateHash(
  input: string,
  algorithm: HashAlgorithm,
): Promise<string> {
  const bytes = textEncoder.encode(input)
  const digest = await crypto.subtle.digest(algorithm, bytes)
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}
