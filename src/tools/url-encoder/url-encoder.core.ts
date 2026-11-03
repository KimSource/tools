export type UrlOperation = 'encode' | 'decode' | 'query'

export function transformUrl(input: string, operation: UrlOperation): string {
  if (!input) throw new Error('empty-input')
  try {
    if (operation === 'encode') return encodeURIComponent(input)
    if (operation === 'decode') return decodeURIComponent(input)

    let query = input
    if (/^[a-z][a-z\d+.-]*:\/\//i.test(input)) {
      query = new URL(input).search.slice(1)
    } else {
      query = (input.split('#', 1)[0] ?? '').replace(/^\?/, '')
    }
    const parameters = query
      ? query
          .split('&')
          .filter(Boolean)
          .map((part) => {
            const separator = part.indexOf('=')
            const key = separator < 0 ? part : part.slice(0, separator)
            const value = separator < 0 ? '' : part.slice(separator + 1)
            const decode = (text: string) =>
              decodeURIComponent(text.replaceAll('+', ' '))
            return { key: decode(key), value: decode(value) }
          })
      : []
    return JSON.stringify(parameters, null, 2)
  } catch {
    throw new Error('invalid-input')
  }
}
