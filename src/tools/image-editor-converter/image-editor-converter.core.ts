export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const MAX_PIXELS = 16_000_000
export const MAX_SIDE = 8192
export const imageFormats = ['png', 'jpeg', 'webp'] as const
export type ImageFormat = (typeof imageFormats)[number]
export const mimeTypes: Record<ImageFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}
export type ImageError =
  | 'multiple'
  | 'fileType'
  | 'fileSize'
  | 'imageSize'
  | 'imageInvalid'
  | 'animation'
  | 'dimensions'
  | 'upscale'
  | 'background'
  | 'quality'
  | 'outputFormat'
  | 'encode'

export interface Size {
  width: number
  height: number
}
export interface ImageInfo extends Size {
  format: ImageFormat
}
export interface EditSettings {
  mode: 'pixels' | 'percent'
  width: string
  height: string
  anchor: 'width' | 'height'
  keepAspect: boolean
  allowUpscale: boolean
  format: ImageFormat
  quality: string
  background: string
  // A unit change is a display change, not a new resize request.
  convertedSize?: {
    source: Size
    input: Pick<
      EditSettings,
      'mode' | 'width' | 'height' | 'anchor' | 'keepAspect'
    >
    size: Size
  }
}

export function assertSize({ width, height }: Size): void {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > MAX_SIDE ||
    height > MAX_SIDE ||
    width * height > MAX_PIXELS
  )
    throw new Error('imageSize')
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length))
}

export function detectFormat(bytes: Uint8Array): ImageFormat {
  if (
    bytes.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b)
  )
    return 'png'
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg'
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP')
    return 'webp'
  throw new Error('fileType')
}

// Only container metadata is parsed here; the browser remains the pixel decoder.
export function inspectImage(bytes: Uint8Array): ImageInfo {
  if (bytes.byteLength > MAX_FILE_BYTES) throw new Error('fileSize')
  const format = detectFormat(bytes)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let size: Size | undefined
  const invalid = (): never => {
    throw new Error('imageInvalid')
  }
  if (format === 'png') {
    let end = false
    for (let offset = 8; offset < bytes.length;) {
      if (offset + 12 > bytes.length) invalid()
      const length = view.getUint32(offset)
      const type = ascii(bytes, offset + 4, 4)
      if (offset + length + 12 > bytes.length) invalid()
      if (offset === 8 && (type !== 'IHDR' || length !== 13)) invalid()
      if (type === 'IHDR') {
        if (size || length !== 13) invalid()
        size = {
          width: view.getUint32(offset + 8),
          height: view.getUint32(offset + 12),
        }
        assertSize(size)
      }
      if (['acTL', 'fcTL', 'fdAT'].includes(type)) throw new Error('animation')
      offset += length + 12
      if (type === 'IEND') {
        if (length !== 0 || offset !== bytes.length) invalid()
        end = true
        break
      }
    }
    if (!end) invalid()
  } else if (format === 'jpeg') {
    let offset = 2
    while (offset < bytes.length) {
      if (bytes[offset++] !== 0xff) invalid()
      while (bytes[offset] === 0xff) offset++
      const marker = bytes[offset++]
      if (marker === undefined || marker === 0xd9) return invalid()
      if (offset + 2 > bytes.length) invalid()
      const length = view.getUint16(offset)
      if (length < 2 || offset + length > bytes.length) invalid()
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        ![0xc4, 0xc8, 0xcc].includes(marker)
      ) {
        if (length < 8 || size) invalid()
        size = {
          width: view.getUint16(offset + 5),
          height: view.getUint16(offset + 3),
        }
        assertSize(size)
      }
      if (marker === 0xda) break
      offset += length
    }
  } else {
    if (bytes.length < 20 || view.getUint32(4, true) + 8 !== bytes.length)
      invalid()
    const uint24 = (offset: number) =>
      bytes[offset]! + bytes[offset + 1]! * 256 + bytes[offset + 2]! * 65536
    for (let offset = 12; offset < bytes.length;) {
      if (offset + 8 > bytes.length) invalid()
      const type = ascii(bytes, offset, 4)
      const length = view.getUint32(offset + 4, true)
      const start = offset + 8
      if (start + length + (length % 2) > bytes.length) invalid()
      if (type === 'ANIM' || type === 'ANMF') throw new Error('animation')
      if (type === 'VP8X') {
        if (length !== 10 || offset !== 12) invalid()
        if (bytes[start]! & 2) throw new Error('animation')
        size = { width: uint24(start + 4) + 1, height: uint24(start + 7) + 1 }
      } else if (type === 'VP8 ' && !size) {
        if (length < 10 || ascii(bytes, start + 3, 3) !== '\x9d\x01\x2a')
          invalid()
        size = {
          width: view.getUint16(start + 6, true) & 0x3fff,
          height: view.getUint16(start + 8, true) & 0x3fff,
        }
      } else if (type === 'VP8L' && !size) {
        if (length < 5 || bytes[start] !== 0x2f) invalid()
        const bits = view.getUint32(start + 1, true)
        size = {
          width: (bits & 0x3fff) + 1,
          height: ((bits >>> 14) & 0x3fff) + 1,
        }
      }
      if (size) assertSize(size)
      offset = start + length + (length % 2)
    }
  }
  if (!size) return invalid()
  return { format, ...size }
}

export function resizeDimensions(source: Size, settings: EditSettings): Size {
  const parse = (raw: string) => {
    const value = Number(raw)
    if (
      !raw.trim() ||
      !Number.isFinite(value) ||
      value <= 0 ||
      (settings.mode === 'pixels' && !Number.isSafeInteger(value))
    )
      throw new Error('dimensions')
    return value
  }
  let width: number
  let height: number
  const converted = settings.convertedSize
  if (
    converted &&
    source.width === converted.source.width &&
    source.height === converted.source.height &&
    (['mode', 'width', 'height', 'anchor', 'keepAspect'] as const).every(
      (key) => settings[key] === converted.input[key],
    )
  ) {
    width = converted.size.width
    height = converted.size.height
  } else if (settings.keepAspect) {
    const axis = settings.anchor
    const value = parse(settings[axis])
    const scale =
      settings.mode === 'percent' ? value / 100 : value / source[axis]
    width = Math.round(source.width * scale)
    height = Math.round(source.height * scale)
  } else {
    width = parse(settings.width)
    height = parse(settings.height)
    if (settings.mode === 'percent') {
      width = Math.round((source.width * width) / 100)
      height = Math.round((source.height * height) / 100)
    }
  }
  assertSize({ width, height })
  if (
    !settings.allowUpscale &&
    (width > source.width || height > source.height)
  )
    throw new Error('upscale')
  return { width, height }
}

export function editDimension(
  source: Size,
  settings: EditSettings,
  axis: 'width' | 'height',
  value: string,
): EditSettings {
  const next = {
    ...settings,
    [axis]: value,
    anchor: axis,
    convertedSize: undefined,
  }
  if (
    settings.keepAspect &&
    value &&
    Number.isFinite(Number(value)) &&
    Number(value) > 0
  ) {
    const other = axis === 'width' ? 'height' : 'width'
    next[other] =
      settings.mode === 'percent'
        ? value
        : String(Math.round((Number(value) * source[other]) / source[axis]))
  }
  return next
}

export function changeSizeMode(
  source: Size,
  settings: EditSettings,
  mode: EditSettings['mode'],
): EditSettings {
  const size = resizeDimensions(source, settings)
  const percentage = (axis: 'width' | 'height') =>
    Number(((size[axis] / source[axis]) * 100).toFixed(6))
  const value = (axis: 'width' | 'height') =>
    mode === 'pixels'
      ? String(size[axis])
      : String(percentage(settings.keepAspect ? settings.anchor : axis))
  const input = {
    mode,
    width: value('width'),
    height: value('height'),
    anchor: settings.anchor,
    keepAspect: settings.keepAspect,
  }
  return {
    ...settings,
    ...input,
    convertedSize: {
      source: { width: source.width, height: source.height },
      input,
      size,
    },
  }
}

export function defaultSettings(size: Size, format: ImageFormat): EditSettings {
  return {
    mode: 'pixels',
    width: String(size.width),
    height: String(size.height),
    anchor: 'width',
    keepAspect: true,
    allowUpscale: false,
    format,
    quality: '90',
    background: '#ffffff',
  }
}

export function validateExport(settings: EditSettings): void {
  if (!imageFormats.includes(settings.format)) throw new Error('outputFormat')
  if (settings.format !== 'png') {
    if (
      !settings.quality.trim() ||
      !Number.isFinite(Number(settings.quality)) ||
      Number(settings.quality) < 0 ||
      Number(settings.quality) > 100
    )
      throw new Error('quality')
  }
  if (settings.format === 'jpeg' && !/^#[\da-f]{6}$/i.test(settings.background))
    throw new Error('background')
}

export async function validateOutput(
  blob: Blob | null,
  format: ImageFormat,
): Promise<Blob> {
  if (!blob || !blob.size) throw new Error('encode')
  if (blob.type !== mimeTypes[format]) throw new Error('outputFormat')
  let actual: ImageFormat
  try {
    actual = detectFormat(new Uint8Array(await blob.slice(0, 12).arrayBuffer()))
  } catch {
    throw new Error('outputFormat')
  }
  if (actual !== format) throw new Error('outputFormat')
  return blob
}

export function aspectRatio({ width, height }: Size): string {
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
  const divisor = gcd(width, height)
  return `${width / divisor}:${height / divisor}`
}

export function sizeChange(originalBytes: number, resultBytes: number): number {
  return ((resultBytes - originalBytes) / originalBytes) * 100
}

export function outputFilename(name: string, format: ImageFormat): string {
  const stem =
    [...name.replace(/\.[^.]*$/, '')]
      .map((character) =>
        character.charCodeAt(0) < 32 || character === '/' || character === '\\'
          ? '_'
          : character,
      )
      .join('') || 'image'
  return `${stem}-edited.${format === 'jpeg' ? 'jpg' : format}`
}
