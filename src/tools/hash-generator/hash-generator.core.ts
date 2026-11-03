export type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512'

export async function generateHash(
  input: string,
  algorithm: HashAlgorithm,
): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest(algorithm, bytes)
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}
