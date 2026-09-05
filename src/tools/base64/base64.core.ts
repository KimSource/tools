export type Base64Operation = 'encode' | 'decode'

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBytes(input: string): Uint8Array {
  const normalized = input.replace(/[\t\n\r ]/g, '')
  if (
    normalized === '' ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      normalized,
    )
  )
    throw new Error('invalid-base64')
  const binary = atob(normalized)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

export function transformBase64(
  input: string,
  operation: Base64Operation,
): string {
  if (input.trim() === '') throw new Error('empty-input')
  if (operation === 'encode')
    return bytesToBase64(new TextEncoder().encode(input))

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(
      base64ToBytes(input),
    )
  } catch {
    throw new Error('invalid-base64')
  }
}

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength
}
