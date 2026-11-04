import { decodeImage, readFileBytes } from '../../services/files'
import {
  MAX_FILE_BYTES,
  assertSize,
  inspectImage,
  imageFormats,
  mimeTypes,
  resizeDimensions,
  validateExport,
  validateOutput,
  type EditSettings,
  type ImageFormat,
  type ImageInfo,
} from './image-editor-converter.core'

export interface ImageSource extends ImageInfo {
  file: File
  bitmap: ImageBitmap
}

export async function loadImage(file: File): Promise<ImageSource> {
  if (file.size > MAX_FILE_BYTES) throw new Error('fileSize')
  const info = inspectImage(await readFileBytes(file))
  let bitmap: ImageBitmap
  try {
    bitmap = await decodeImage(file)
  } catch {
    throw new Error('imageInvalid')
  }
  try {
    assertSize(bitmap)
    // Orientation may swap axes. Never accept an unexpected decoded allocation.
    if (!(
      (bitmap.width === info.width && bitmap.height === info.height) ||
      (bitmap.width === info.height && bitmap.height === info.width)
    ))
      throw new Error('imageInvalid')
    return {
      file,
      bitmap,
      format: info.format,
      width: bitmap.width,
      height: bitmap.height,
    }
  } catch (error) {
    bitmap.close()
    throw error
  }
}

function encode(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(resolve, mimeTypes[format], quality)
    } catch {
      reject(new Error('encode'))
    }
  })
}

export async function supportedFormats(): Promise<ReadonlySet<ImageFormat>> {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const supported = new Set<ImageFormat>()
  try {
    for (const format of imageFormats) {
      try {
        await validateOutput(await encode(canvas, format), format)
        supported.add(format)
      } catch {
        // Unsupported encoders commonly return PNG instead of throwing.
      }
    }
    return supported
  } finally {
    canvas.width = canvas.height = 0
  }
}

export async function renderImage(
  source: ImageSource,
  settings: EditSettings,
): Promise<Blob> {
  validateExport(settings)
  const size = resizeDimensions(source, settings)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  try {
    const context = canvas.getContext('2d')
    if (!context) throw new Error('encode')
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    if (settings.format === 'jpeg') {
      context.fillStyle = settings.background
      context.fillRect(0, 0, size.width, size.height)
    }
    // Later stages: crop in oriented source coordinates, rotate, then resize.
    context.drawImage(source.bitmap, 0, 0, size.width, size.height)
    return await validateOutput(
      await encode(
        canvas,
        settings.format,
        settings.format === 'png' ? undefined : Number(settings.quality) / 100,
      ),
      settings.format,
    )
  } finally {
    canvas.width = canvas.height = 0
  }
}

// A small original preview avoids a second full-size decode of the input file.
export async function sourceThumbnail(source: ImageSource): Promise<Blob> {
  const scale = Math.min(1, 1024 / Math.max(source.width, source.height))
  return renderImage(source, {
    mode: 'pixels',
    width: String(Math.max(1, Math.round(source.width * scale))),
    height: String(Math.max(1, Math.round(source.height * scale))),
    anchor: 'width',
    keepAspect: false,
    allowUpscale: false,
    format: 'png',
    quality: '90',
    background: '#ffffff',
  })
}
