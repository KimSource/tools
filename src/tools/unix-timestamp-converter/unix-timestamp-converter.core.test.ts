import { describe, expect, it } from 'vitest'
import {
  dateToMilliseconds,
  formatTimestampSeconds,
  timestampToMilliseconds,
} from './unix-timestamp-converter.core'

describe('Unix timestamp conversion', () => {
  it('detects 10-digit seconds and 13-digit milliseconds including negative values', () => {
    expect(timestampToMilliseconds('1704067200', 'auto')).toBe(1704067200000)
    expect(timestampToMilliseconds('-1704067200000', 'auto')).toBe(
      -1704067200000,
    )
    expect(() => timestampToMilliseconds('0', 'auto')).toThrow('ambiguous')
    expect(() => timestampToMilliseconds('1704067200.5', 'auto')).toThrow(
      'ambiguous',
    )
  })
  it('handles manual units, fractional seconds, and bounds without rounding', () => {
    expect(timestampToMilliseconds('-0.001', 'seconds')).toBe(-1)
    expect(formatTimestampSeconds(-1)).toBe('-0.001')
    expect(
      timestampToMilliseconds(formatTimestampSeconds(1704067200123), 'seconds'),
    ).toBe(1704067200123)
    expect(timestampToMilliseconds('8640000000000000', 'milliseconds')).toBe(
      8640000000000000,
    )
    expect(() =>
      timestampToMilliseconds('8640000000000001', 'milliseconds'),
    ).toThrow('range')
    expect(() => timestampToMilliseconds('1.1', 'milliseconds')).toThrow(
      'invalid',
    )
    expect(() => timestampToMilliseconds('1e3', 'seconds')).toThrow('invalid')
    expect(() => timestampToMilliseconds('', 'seconds')).toThrow('empty')
  })
  it('validates ISO dates and interprets explicit offsets', () => {
    expect(dateToMilliseconds('2024-01-01T09:00:00.123+09:00')).toBe(
      1704067200123,
    )
    expect(dateToMilliseconds('2024-02-29T00:00Z')).toBe(
      Date.parse('2024-02-29T00:00Z'),
    )
    for (const value of [
      '2023-02-29T00:00Z',
      '2024-01-01T00:00',
      '2024-13-01T00:00Z',
      '2024-01-01T24:00Z',
      '2024-01-01T00:00:00.1234Z',
    ])
      expect(() => dateToMilliseconds(value)).toThrow('invalid')
    expect(() => dateToMilliseconds('')).toThrow('empty')
  })
})
