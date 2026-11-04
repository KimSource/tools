import QRCode from 'qrcode'
import jsQR from 'jsqr'

export async function createQr(
  text: string,
  size: number,
): Promise<{ svg: string; png: Blob }> {
  if (!text) throw new Error('empty')
  const options = { width: size, margin: 4, errorCorrectionLevel: 'M' as const }
  let svg: string
  const canvas = document.createElement('canvas')
  try {
    svg = await QRCode.toString(text, { ...options, type: 'svg' })
    await QRCode.toCanvas(canvas, text, options)
  } catch {
    throw new Error('capacity')
  }
  const png = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  )
  if (!png) throw new Error('imageInvalid')
  return { svg, png }
}

export function decodeQr(image: ImageData): string | null {
  return jsQR(image.data, image.width, image.height)?.data ?? null
}

export function safeUrl(text: string): string | null {
  try {
    const url = new URL(text)
    return (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.hostname
      ? url.href
      : null
  } catch {
    return null
  }
}
