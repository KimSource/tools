export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}

export function readPastedImages(event: ClipboardEvent): File[] {
  return Array.from(event.clipboardData?.files ?? []).filter((file) =>
    file.type.startsWith('image/'),
  )
}
