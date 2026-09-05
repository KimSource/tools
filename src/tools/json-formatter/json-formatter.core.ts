export type JsonOperation = 'format' | 'minify'

export function transformJson(
  input: string,
  operation: JsonOperation,
  indentation: 2 | 4,
): string {
  if (input.trim() === '') throw new Error('empty-input')
  const value: unknown = JSON.parse(input)
  return JSON.stringify(value, null, operation === 'minify' ? 0 : indentation)
}
