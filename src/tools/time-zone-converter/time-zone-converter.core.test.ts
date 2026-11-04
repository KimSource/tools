import { describe, expect, it } from 'vitest'
import {
  annualOffsets,
  convertTime,
  resolveBaseTime,
} from './time-zone-converter.core'

describe('time zone conversion', () => {
  it('rejects a missing local time and exposes both repeated times', () => {
    expect(resolveBaseTime('2024-03-10T02:30', 'America/New_York').kind).toBe(
      'gap',
    )
    const repeated = resolveBaseTime('2024-11-03T01:30', 'America/New_York')
    expect(repeated.kind).toBe('valid')
    if (repeated.kind === 'valid')
      expect(
        repeated.possibilities.map((date) => date.offset).sort((a, b) => a - b),
      ).toEqual([-300, -240])
  })
  it('converts across leap day and the date boundary', () => {
    const base = resolveBaseTime('2024-03-01T00:30', 'Asia/Seoul')
    expect(base.kind).toBe('valid')
    if (base.kind === 'valid' && base.possibilities[0]) {
      const result = convertTime(base.possibilities[0], 'UTC')
      expect(result.time.toISODate()).toBe('2024-02-29')
      expect(result.dayDifference).toBe(-1)
    }
  })
  it('samples offsets over the selected year', () => {
    expect(annualOffsets('America/New_York', 2024)).toEqual([-300, -240])
    expect(annualOffsets('Europe/Moscow', 2010)).not.toEqual(
      annualOffsets('Europe/Moscow', 2015),
    )
  })
})
