import type { Page } from '@playwright/test'

export async function imageFile(
  page: Page,
  format = 'png',
  width = 60,
  height = 40,
) {
  const bytes = await page.evaluate(
    async ({ format, width, height }) => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ff0000'
      ctx.fillRect(0, 0, width / 2, height)
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((blob) => resolve(blob!), `image/${format}`),
      )
      return [...new Uint8Array(await blob.arrayBuffer())]
    },
    { format, width, height },
  )
  return {
    name: `source.${format === 'jpeg' ? 'jpg' : format}`,
    mimeType: `image/${format}`,
    buffer: Buffer.from(bytes),
  }
}

// Inject an EXIF IFD with orientation 6 (90 degrees clockwise).
export function orientedJpeg(buffer: Buffer): Buffer {
  const exif = Buffer.from([
    0xff, 0xe1, 0, 34, 69, 120, 105, 102, 0, 0, 73, 73, 42, 0, 8, 0, 0, 0, 1, 0,
    0x12, 1, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0,
  ])
  return Buffer.concat([buffer.subarray(0, 2), exif, buffer.subarray(2)])
}
