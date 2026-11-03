import { DateTime } from 'luxon'

export type DateError = 'empty' | 'invalid' | 'range' | 'amount'
export type Amounts = {
  years: string
  months: string
  weeks: string
  days: string
}

function parseDate(value: string): DateTime {
  if (!value) throw new Error('empty')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('invalid')
  if (value < '0001-01-01' || value > '9999-12-31') throw new Error('range')
  const date = DateTime.fromISO(value, { zone: 'utc' })
  if (!date.isValid) throw new Error('invalid')
  return date
}

export function dateDifference(
  startValue: string,
  endValue: string,
  inclusive: boolean,
) {
  const start = parseDate(startValue)
  const end = parseDate(endValue)
  const signed = end.diff(start, 'days').days
  const total = Math.abs(signed) + (inclusive ? 1 : 0)
  return {
    total,
    weeks: Math.floor(total / 7),
    days: total % 7,
    direction: Math.sign(signed),
  }
}

export function calculateDate(
  value: string,
  amounts: Amounts,
  operation: 'add' | 'subtract',
): string {
  const date = parseDate(value)
  const parsed = {} as Record<keyof Amounts, number>
  for (const key of ['years', 'months', 'weeks', 'days'] as const) {
    const input = amounts[key]
    if (!/^\d+$/.test(input) || Number(input) > 9999) throw new Error('amount')
    parsed[key] = Number(input)
  }
  const result = operation === 'add' ? date.plus(parsed) : date.minus(parsed)
  if (!result.isValid || result.year < 1 || result.year > 9999)
    throw new Error('range')
  const formatted = result.toISODate()
  if (!formatted) throw new Error('range')
  return formatted
}
