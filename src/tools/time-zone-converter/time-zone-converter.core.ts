import { DateTime } from 'luxon'

export type BaseTimeResult =
  { kind: 'invalid' | 'gap' } | { kind: 'valid'; possibilities: DateTime[] }

/** Interpret a wall time without silently accepting Luxon's gap adjustment. */
export function resolveBaseTime(value: string, zone: string): BaseTimeResult {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return { kind: 'invalid' }
  const parsed = DateTime.fromISO(value, { zone })
  if (!parsed.isValid || parsed.year < 1 || parsed.year > 9999)
    return { kind: 'invalid' }
  if (parsed.toFormat("yyyy-MM-dd'T'HH:mm") !== value) return { kind: 'gap' }
  return { kind: 'valid', possibilities: parsed.getPossibleOffsets() }
}

/** Sample every day; short-lived historical offsets may be missed. */
export function annualOffsets(zone: string, year: number): number[] {
  if (!Number.isInteger(year) || year < 1 || year > 9999) return []
  let current = DateTime.utc(year, 1, 1).minus({ days: 1 })
  const end = DateTime.utc(year, 12, 31).plus({ days: 2 })
  const offsets = new Set<number>()
  while (current < end) {
    const local = current.setZone(zone)
    if (!local.isValid) return []
    if (local.year === year) offsets.add(local.offset)
    current = current.plus({ days: 1 })
  }
  return [...offsets].sort((a, b) => a - b)
}

export function convertTime(base: DateTime, zone: string) {
  const result = base.setZone(zone)
  if (!result.isValid) throw new Error('invalid-zone')
  const sourceDay = DateTime.utc(base.year, base.month, base.day)
  const targetDay = DateTime.utc(result.year, result.month, result.day)
  return { time: result, dayDifference: targetDay.diff(sourceDay, 'days').days }
}
