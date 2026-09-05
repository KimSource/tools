const prefix = 'local-tools:'
export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(prefix + key)
  } catch {
    return null
  }
}
export function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(prefix + key, value)
  } catch {
    /* Storage is optional. */
  }
}
