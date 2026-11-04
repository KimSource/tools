export function downloadText(
  filename: string,
  text: string,
  type = 'text/plain;charset=utf-8',
): void {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function readImagePixels(file: File): Promise<ImageData> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    throw new Error('fileType')
  if (file.size > 10 * 1024 * 1024) throw new Error('fileSize')
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('imageInvalid')
  }
  try {
    if (
      !bitmap.width ||
      !bitmap.height ||
      bitmap.width * bitmap.height > 16_000_000
    )
      throw new Error('imageSize')
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('imageInvalid')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0)
    return context.getImageData(0, 0, canvas.width, canvas.height)
  } finally {
    bitmap.close()
  }
}

// Keep file access and temporary browser URLs behind the shared file service.
export function singleFile(
  files: FileList | readonly File[] | null,
): File | null {
  if (!files?.length) return null
  if (files.length !== 1) throw new Error('multiple')
  return files[0] ?? null
}

export async function readFileBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer())
}

export function decodeImage(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: 'from-image' })
}

export interface PreviewUrl {
  url: string
  revoke(): void
}

export function previewUrl(blob: Blob): PreviewUrl {
  const url = URL.createObjectURL(blob)
  return { url, revoke: () => URL.revokeObjectURL(url) }
}
