import { describe, expect, it } from 'vitest'
import { Settings } from 'luxon'
import { calculateDate, dateDifference } from './date-calculator.core'

const zero = { years: '0', months: '0', weeks: '0', days: '0' }
describe('date calculator', () => {
  it('counts days, inclusion, direction and weeks', () => {
    expect(dateDifference('2024-03-01', '2024-03-10', false)).toEqual({
      total: 9,
      weeks: 1,
      days: 2,
      direction: 1,
    })
    expect(dateDifference('2024-03-10', '2024-03-01', true)).toEqual({
      total: 10,
      weeks: 1,
      days: 3,
      direction: -1,
    })
    expect(dateDifference('2024-02-29', '2024-02-29', false).total).toBe(0)
    expect(dateDifference('2024-02-29', '2024-02-29', true).total).toBe(1)
  })
  it('applies combined units and clamps month ends', () => {
    expect(calculateDate('2023-01-31', { ...zero, months: '1' }, 'add')).toBe(
      '2023-02-28',
    )
    expect(calculateDate('2024-01-31', { ...zero, months: '1' }, 'add')).toBe(
      '2024-02-29',
    )
    expect(calculateDate('2024-02-29', { ...zero, years: '1' }, 'add')).toBe(
      '2025-02-28',
    )
    expect(
      calculateDate('2024-02-29', { ...zero, years: '1', months: '1' }, 'add'),
    ).toBe('2025-03-29')
    expect(
      calculateDate('2017-04-30', { ...zero, months: '1', days: '1' }, 'add'),
    ).toBe('2017-05-31')
    expect(
      calculateDate(
        '2024-03-31',
        { ...zero, months: '1', weeks: '1', days: '2' },
        'subtract',
      ),
    ).toBe('2024-02-20')
    expect(calculateDate('0001-01-01', zero, 'add')).toBe('0001-01-01')
    expect(calculateDate('9999-12-31', zero, 'add')).toBe('9999-12-31')
  })
  it('rejects invalid input and out-of-range results', () => {
    for (const date of ['', '2023-02-29', '0000-01-01', '2024-1-01'])
      expect(() => dateDifference(date, '2024-01-01', false)).toThrow()
    for (const amount of ['', '-1', '1.5', '10000'])
      expect(() =>
        calculateDate('2024-01-01', { ...zero, days: amount }, 'add'),
      ).toThrow('amount')
    expect(() =>
      calculateDate('9999-12-31', { ...zero, days: '1' }, 'add'),
    ).toThrow('range')
    expect(() =>
      calculateDate('0001-01-01', { ...zero, days: '1' }, 'subtract'),
    ).toThrow('range')
  })
  it('uses UTC regardless of the default zone across DST transitions', () => {
    try {
      for (const zone of ['America/New_York', 'Asia/Seoul', 'Pacific/Apia']) {
        Settings.defaultZone = zone
        expect(dateDifference('2024-03-09', '2024-03-11', false).total).toBe(2)
        expect(calculateDate('2024-11-02', { ...zero, days: '2' }, 'add')).toBe(
          '2024-11-04',
        )
      }
    } finally {
      Settings.defaultZone = 'system'
    }
  })
})
