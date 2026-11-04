import { describe, expect, it } from 'vitest'
import QRCode from 'qrcode'
import { createQr, decodeQr, safeUrl } from './qr-code.core'

describe('QR core', () => {
  it('rejects empty generation before accessing the canvas', async () => {
    await expect(createQr('', 256)).rejects.toThrow('empty')
  })
  it('decodes Unicode from a QR image and returns null for blank pixels', () => {
    const value = '안녕하세요 🌍 https://example.com'
    const matrix = QRCode.create(value, { errorCorrectionLevel: 'M' }).modules
    const scale = 5,
      margin = 4,
      width = (matrix.size + margin * 2) * scale
    const data = new Uint8ClampedArray(width * width * 4).fill(255)
    for (let y = 0; y < matrix.size; y++)
      for (let x = 0; x < matrix.size; x++) {
        if (!matrix.get(y, x)) continue
        for (let dy = 0; dy < scale; dy++)
          for (let dx = 0; dx < scale; dx++) {
            const i =
              (((y + margin) * scale + dy) * width +
                (x + margin) * scale +
                dx) *
              4
            data[i] = data[i + 1] = data[i + 2] = 0
          }
      }
    expect(decodeQr({ data, width, height: width, colorSpace: 'srgb' })).toBe(
      value,
    )
    expect(
      decodeQr({
        data: new Uint8ClampedArray(100 * 100 * 4).fill(255),
        width: 100,
        height: 100,
        colorSpace: 'srgb',
      }),
    ).toBeNull()
  })
  it('only exposes absolute HTTP(S) links', () => {
    expect(safeUrl('https://example.com/path')).toBe('https://example.com/path')
    for (const input of [
      'javascript:alert(1)',
      'data:text/html,hi',
      '/relative',
      'example.com',
      'mailto:a@example.com',
    ])
      expect(safeUrl(input)).toBeNull()
  })
})
