export type ColorFormat = 'hex' | 'rgb' | 'hsl'
export type ColorError = 'empty' | 'invalid' | 'range'
export type ColorValues = Record<ColorFormat, string>
type RGB = [number, number, number]

function parseColor(format: ColorFormat, input: string): RGB {
  const value = input.trim()
  if (!value) throw new Error('empty')
  if (format === 'hex') {
    if (!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value)) throw new Error('invalid')
    let hex = value.slice(1)
    if (hex.length === 3) hex = [...hex].map((c) => c + c).join('')
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB
  }
  const number = format === 'rgb' ? '(\\d+)' : '(\\d+(?:\\.\\d{1,2})?)'
  const suffix = format === 'rgb' ? '' : '%'
  const match = new RegExp(
    `^${format}\\(\\s*${number}\\s*,\\s*${number}${suffix}\\s*,\\s*${number}${suffix}\\s*\\)$`,
    'i',
  ).exec(value)
  if (!match) throw new Error('invalid')
  const [a, b, c] = [Number(match[1]), Number(match[2]), Number(match[3])]
  if (a === undefined || b === undefined || c === undefined)
    throw new Error('invalid')
  if (format === 'rgb') {
    if (a > 255 || b > 255 || c > 255) throw new Error('range')
    return [a, b, c]
  }
  if (a > 360 || b > 100 || c > 100) throw new Error('range')
  const h = (a % 360) / 60
  const s = b / 100
  const l = c / 100
  const chroma = (1 - Math.abs(2 * l - 1)) * s
  const x = chroma * (1 - Math.abs((h % 2) - 1))
  const m = l - chroma / 2
  const channels: RGB =
    h < 1
      ? [chroma, x, 0]
      : h < 2
        ? [x, chroma, 0]
        : h < 3
          ? [0, chroma, x]
          : h < 4
            ? [0, x, chroma]
            : h < 5
              ? [x, 0, chroma]
              : [chroma, 0, x]
  return channels.map((channel) => Math.round((channel + m) * 255)) as RGB
}

export function convertColor(format: ColorFormat, input: string): ColorValues {
  const [r, g, b] = parseColor(format, input)
  const [red, green, blue] = [r / 255, g / 255, b / 255]
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  const lightness = (max + min) / 2
  let hue = 0
  if (delta !== 0) {
    if (max === red) hue = ((green - blue) / delta) % 6
    else if (max === green) hue = (blue - red) / delta + 2
    else hue = (red - green) / delta + 4
    hue = (hue * 60 + 360) % 360
  }
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1))
  const round = (value: number) => Number(value.toFixed(2))
  const roundedHue = round(hue) % 360
  return {
    hex: `#${[r, g, b]
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()}`,
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${roundedHue}, ${round(saturation * 100)}%, ${round(lightness * 100)}%)`,
  }
}
