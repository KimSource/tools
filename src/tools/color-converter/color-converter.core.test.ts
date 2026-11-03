import { describe, expect, it } from 'vitest'
import { convertColor, type ColorFormat } from './color-converter.core'

describe('color conversion', () => {
  it.each([
    ['hex', '#f00', '#FF0000', 'rgb(255, 0, 0)', 'hsl(0, 100%, 50%)'],
    [
      'rgb',
      'rgb(0, 255, 0)',
      '#00FF00',
      'rgb(0, 255, 0)',
      'hsl(120, 100%, 50%)',
    ],
    [
      'hsl',
      'hsl(240, 100%, 50%)',
      '#0000FF',
      'rgb(0, 0, 255)',
      'hsl(240, 100%, 50%)',
    ],
    [
      'hsl',
      'hsl(360, 100%, 50%)',
      '#FF0000',
      'rgb(255, 0, 0)',
      'hsl(0, 100%, 50%)',
    ],
    ['hex', '#808080', '#808080', 'rgb(128, 128, 128)', 'hsl(0, 0%, 50.2%)'],
    ['hsl', 'hsl(0, 0%, 0%)', '#000000', 'rgb(0, 0, 0)', 'hsl(0, 0%, 0%)'],
    [
      'hsl',
      'hsl(0, 0%, 100%)',
      '#FFFFFF',
      'rgb(255, 255, 255)',
      'hsl(0, 0%, 100%)',
    ],
  ] as const)('converts %s %s', (format, input, hex, rgb, hsl) => {
    expect(convertColor(format, input)).toEqual({ hex, rgb, hsl })
  })
  it('rounds HSL through 8-bit RGB', () => {
    expect(convertColor('hsl', ' hsl( 330.25 , 100% , 50% ) ')).toEqual({
      hex: '#FF007E',
      rgb: 'rgb(255, 0, 126)',
      hsl: 'hsl(330.35, 100%, 50%)',
    })
  })
  it.each([
    ['hex', '', 'empty'],
    ['hex', 'fff', 'invalid'],
    ['hex', '#1234', 'invalid'],
    ['rgb', 'rgb(256, 0, 0)', 'range'],
    ['rgb', 'rgb(-1, 0, 0)', 'invalid'],
    ['rgb', 'rgb(1.5, 0, 0)', 'invalid'],
    ['hsl', 'hsl(361, 0%, 0%)', 'range'],
    ['hsl', 'hsl(0, 101%, 0%)', 'range'],
    ['hsl', 'hsl(0, 0%, 100.01%)', 'range'],
    ['hsl', 'hsl(0.001, 0%, 0%)', 'invalid'],
    ['hsl', 'hsla(0, 0%, 0%, 1)', 'invalid'],
    ['rgb', 'rgb(1 2 3)', 'invalid'],
  ] as [ColorFormat, string, string][])(
    'rejects %s %s',
    (format, input, error) => {
      expect(() => convertColor(format, input)).toThrow(error)
    },
  )
  it('round trips representative RGB colors through formatted values', () => {
    for (const hex of ['#000000', '#FFFFFF', '#123456', '#ABCDEF', '#FF0080']) {
      const values = convertColor('hex', hex)
      expect(convertColor('rgb', values.rgb).hex).toBe(hex)
      expect(convertColor('hsl', values.hsl).hex).toBe(hex)
    }
  })
})
