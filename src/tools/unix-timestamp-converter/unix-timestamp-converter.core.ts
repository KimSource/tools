export type Unit = 'auto' | 'seconds' | 'milliseconds'
export type ConversionError = 'empty' | 'invalid' | 'ambiguous' | 'range'

const LIMIT = 8640000000000000n

export function timestampToMilliseconds(input: string, unit: Unit): number {
  const value = input.trim()
  if (!value) throw new Error('empty')
  const match = /^([+-]?)(\d+)(?:\.(\d{1,3}))?$/.exec(value)
  if (!match) throw new Error('invalid')
  const digits = match[2]!
  const fraction = match[3]
  if (unit === 'auto') {
    if (fraction || (digits.length !== 10 && digits.length !== 13))
      throw new Error('ambiguous')
    unit = digits.length === 10 ? 'seconds' : 'milliseconds'
  }
  if (unit === 'milliseconds' && fraction) throw new Error('invalid')
  let ms = BigInt(digits) * (unit === 'seconds' ? 1000n : 1n)
  if (fraction) ms += BigInt(fraction.padEnd(3, '0'))
  if (match[1] === '-') ms = -ms
  if (ms < -LIMIT || ms > LIMIT) throw new Error('range')
  return Number(ms)
}

export function dateToMilliseconds(input: string): number {
  const value = input.trim()
  if (!value) throw new Error('empty')
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    )
  if (!match) throw new Error('invalid')
  const [, year, month, day, hour, minute, second = '0', , zone] = match
  const y = Number(year),
    m = Number(month),
    d = Number(day)
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > days[m - 1]! ||
    Number(hour) > 23 ||
    Number(minute) > 59 ||
    Number(second) > 59 ||
    (zone !== 'Z' &&
      (Number(zone!.slice(1, 3)) > 23 || Number(zone!.slice(4)) > 59))
  )
    throw new Error('invalid')
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) throw new Error('range')
  return ms
}

export function formatTimestampSeconds(ms: number): string {
  const sign = ms < 0 ? '-' : ''
  const absolute = Math.abs(ms)
  const fraction = absolute % 1000
  return `${sign}${Math.floor(absolute / 1000)}${fraction ? `.${String(fraction).padStart(3, '0').replace(/0+$/, '')}` : ''}`
}
