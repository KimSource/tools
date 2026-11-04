import { describe, expect, it } from 'vitest'
import {
  MAX_FILE_BYTES,
  MAX_PIXELS,
  MAX_SIDE,
  aspectRatio,
  changeSizeMode,
  editDimension,
  assertSize,
  defaultSettings,
  detectFormat,
  inspectImage,
  outputFilename,
  resizeDimensions,
  sizeChange,
  validateExport,
  validateOutput,
} from './image-editor-converter.core'

function png(
  width = 600,
  height = 400,
  animation = false,
): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(8 + 25 + (animation ? 20 : 0) + 12)
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10])
  const view = new DataView(bytes.buffer)
  const chunk = (offset: number, name: string, length: number) => {
    view.setUint32(offset, length)
    bytes.set(
      [...name].map((c) => c.charCodeAt(0)),
      offset + 4,
    )
  }
  chunk(8, 'IHDR', 13)
  view.setUint32(16, width)
  view.setUint32(20, height)
  if (animation) chunk(33, 'acTL', 8)
  chunk(animation ? 53 : 33, 'IEND', 0)
  return bytes
}
function webp(type: string, payload: number[]): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(20 + payload.length + (payload.length % 2))
  bytes.set([...`RIFF\0\0\0\0WEBP${type}`].map((c) => c.charCodeAt(0)))
  const view = new DataView(bytes.buffer)
  view.setUint32(4, bytes.length - 8, true)
  view.setUint32(16, payload.length, true)
  bytes.set(payload, 20)
  return bytes
}
const source = { width: 600, height: 400 }
const defaults = defaultSettings(source, 'png')

describe('image size calculations', () => {
  it('calculates both anchors from the original aspect ratio', () => {
    expect(resizeDimensions(source, { ...defaults, width: '301' })).toEqual({
      width: 301,
      height: 201,
    })
    expect(
      resizeDimensions(source, {
        ...defaults,
        anchor: 'height',
        height: '100',
      }),
    ).toEqual({ width: 150, height: 100 })
    expect(
      resizeDimensions(source, { ...defaults, mode: 'percent', width: '12.5' }),
    ).toEqual({ width: 75, height: 50 })
    expect(
      resizeDimensions(source, {
        ...defaults,
        keepAspect: false,
        mode: 'percent',
        width: '50',
        height: '25',
      }),
    ).toEqual({ width: 300, height: 100 })
    expect(
      resizeDimensions(source, {
        ...defaults,
        keepAspect: false,
        width: '200',
        height: '100',
      }),
    ).toEqual({ width: 200, height: 100 })
  })
  it('synchronizes locked edits and converts units without accumulating aspect errors', () => {
    const edited = editDimension(source, defaults, 'width', '301')
    expect(edited).toMatchObject({
      width: '301',
      height: '201',
      anchor: 'width',
    })
    const percent = changeSizeMode(source, edited, 'percent')
    expect(percent.width).toBe(percent.height)
    expect(resizeDimensions(source, percent)).toEqual({
      width: 301,
      height: 201,
    })
    expect(changeSizeMode(source, percent, 'pixels')).toMatchObject({
      width: '301',
      height: '201',
    })
    expect(
      editDimension(source, { ...defaults, keepAspect: false }, 'width', '300'),
    ).toMatchObject({ width: '300', height: '400' })
    expect(
      editDimension(source, { ...defaults, mode: 'percent' }, 'height', '25'),
    ).toMatchObject({ width: '25', height: '25', anchor: 'height' })
    expect(() =>
      changeSizeMode(source, { ...defaults, width: '' }, 'percent'),
    ).toThrow('dimensions')
  })
  it('rejects empty, fractional pixels, non-finite and zero values', () => {
    for (const width of ['', ' ', '0', '-1', '1.5', 'NaN', 'Infinity'])
      expect(() => resizeDimensions(source, { ...defaults, width })).toThrow(
        'dimensions',
      )
    expect(() =>
      resizeDimensions(source, { ...defaults, mode: 'percent', width: '0.01' }),
    ).toThrow('imageSize')
  })
  it('enforces enlargement on each axis and output memory limits', () => {
    expect(() =>
      resizeDimensions(source, { ...defaults, width: '601' }),
    ).toThrow('upscale')
    expect(() =>
      resizeDimensions(source, {
        ...defaults,
        keepAspect: false,
        height: '401',
      }),
    ).toThrow('upscale')
    expect(
      resizeDimensions(source, {
        ...defaults,
        width: '1200',
        allowUpscale: true,
      }),
    ).toEqual({ width: 1200, height: 800 })
    expect(() =>
      resizeDimensions(source, {
        ...defaults,
        width: '8193',
        allowUpscale: true,
      }),
    ).toThrow('imageSize')
    expect(() => assertSize({ width: 4001, height: 4000 })).toThrow('imageSize')
    expect(() => assertSize({ width: MAX_SIDE, height: 1 })).not.toThrow()
    expect(() =>
      assertSize({ width: 4000, height: MAX_PIXELS / 4000 }),
    ).not.toThrow()
  })
  it('provides initial settings, exact ratios and signed size changes', () => {
    expect(defaults).toMatchObject({
      width: '600',
      height: '400',
      keepAspect: true,
      allowUpscale: false,
      quality: '90',
      background: '#ffffff',
    })
    expect(aspectRatio(source)).toBe('3:2')
    expect(aspectRatio({ width: 1, height: 8192 })).toBe('1:8192')
    expect(sizeChange(100, 150)).toBe(50)
    expect(sizeChange(100, 25)).toBe(-75)
    expect(sizeChange(100, 100)).toBe(0)
  })
})

describe('image input containers', () => {
  it('recognizes signatures independently of names and MIME', () => {
    expect(inspectImage(png())).toEqual({ ...source, format: 'png' })
    const jpeg = new Uint8Array([
      255, 216, 255, 192, 0, 8, 8, 1, 144, 2, 88, 1, 255, 218, 0, 2, 255, 217,
    ])
    expect(inspectImage(jpeg)).toEqual({ ...source, format: 'jpeg' })
    expect(
      inspectImage(webp('VP8 ', [0, 0, 0, 157, 1, 42, 88, 2, 144, 1])),
    ).toEqual({ ...source, format: 'webp' })
    expect(inspectImage(webp('VP8L', [47, 0, 0, 0, 0]))).toEqual({
      width: 1,
      height: 1,
      format: 'webp',
    })
    expect(
      inspectImage(webp('VP8X', [0, 0, 0, 0, 87, 2, 0, 143, 1, 0])),
    ).toEqual({ ...source, format: 'webp' })
  })
  it('rejects APNG and animated WebP, including single-frame containers', () => {
    expect(() => inspectImage(png(2, 2, true))).toThrow('animation')
    expect(() =>
      inspectImage(webp('VP8X', [2, 0, 0, 0, 1, 0, 0, 1, 0, 0])),
    ).toThrow('animation')
    for (const chunk of ['ANIM', 'ANMF'])
      expect(() => inspectImage(webp(chunk, [0, 0]))).toThrow('animation')
  })
  it('rejects unknown, truncated, malformed and oversized inputs', () => {
    expect(() => detectFormat(new Uint8Array([71, 73, 70]))).toThrow('fileType')
    expect(() => inspectImage(png().subarray(0, 20))).toThrow('imageInvalid')
    const malformed = png()
    new DataView(malformed.buffer).setUint32(8, 0xffffffff)
    expect(() => inspectImage(malformed)).toThrow('imageInvalid')
    expect(() => inspectImage(png(8193, 1))).toThrow('imageSize')
    expect(() => inspectImage(png(4001, 4000))).toThrow('imageSize')
    expect(() => inspectImage(new Uint8Array(MAX_FILE_BYTES + 1))).toThrow(
      'fileSize',
    )
    expect(() => inspectImage(webp('VP8L', [47]))).toThrow('imageInvalid')
    expect(() =>
      inspectImage(new Uint8Array([255, 216, 255, 192, 255, 255])),
    ).toThrow('imageInvalid')
    // A typed-array view must not accidentally inspect bytes outside its bounds.
    const padded = new Uint8Array(100)
    padded.set(png(), 7)
    expect(inspectImage(padded.subarray(7, 52))).toEqual({
      ...source,
      format: 'png',
    })
  })
})

describe('image export validation', () => {
  it('validates quality and solid background only when applicable', () => {
    for (const quality of ['0', '90', '100'])
      expect(() =>
        validateExport({ ...defaults, format: 'webp', quality }),
      ).not.toThrow()
    for (const quality of ['', '-1', '101', 'Infinity'])
      expect(() =>
        validateExport({ ...defaults, format: 'jpeg', quality }),
      ).toThrow('quality')
    for (const background of ['#fff', 'transparent', '#ffffff00', 'red'])
      expect(() =>
        validateExport({ ...defaults, format: 'jpeg', background }),
      ).toThrow('background')
    expect(() =>
      validateExport({ ...defaults, format: 'jpeg', background: '#AaBB09' }),
    ).not.toThrow()
    expect(() =>
      validateExport({ ...defaults, quality: '', background: '' }),
    ).not.toThrow()
  })
  it('rejects MIME fallback, signature mismatch, empty and missing output', async () => {
    const blob = new Blob([png()], { type: 'image/png' })
    await expect(validateOutput(blob, 'png')).resolves.toBe(blob)
    await expect(validateOutput(blob, 'webp')).rejects.toThrow('outputFormat')
    await expect(
      validateOutput(new Blob([png()], { type: 'image/webp' }), 'webp'),
    ).rejects.toThrow('outputFormat')
    await expect(
      validateOutput(new Blob(['bad'], { type: 'image/png' }), 'png'),
    ).rejects.toThrow('outputFormat')
    await expect(
      validateOutput(new Blob([], { type: 'image/png' }), 'png'),
    ).rejects.toThrow('encode')
    await expect(validateOutput(null, 'png')).rejects.toThrow('encode')
  })
  it('assigns extensions using the validated output format', () => {
    expect(outputFilename('photo.PNG', 'jpeg')).toBe('photo-edited.jpg')
    expect(outputFilename('photo', 'webp')).toBe('photo-edited.webp')
    expect(outputFilename('a.b.jpg', 'png')).toBe('a.b-edited.png')
    expect(outputFilename('a/b.jpg', 'png')).toBe('a_b-edited.png')
  })
})
