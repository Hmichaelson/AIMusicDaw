export * from './time'
export * from './audio'

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Check if a file is a supported audio format
 */
export function isSupportedAudioFile(file: File): boolean {
  const supportedTypes = [
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/ogg',
    'audio/webm',
    'audio/aac',
    'audio/flac',
    'audio/x-m4a',
  ]

  return supportedTypes.includes(file.type) ||
    /\.(wav|mp3|ogg|webm|aac|flac|m4a)$/i.test(file.name)
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Create a blob URL and track it for cleanup
 */
const blobUrls = new Set<string>()

export function createTrackedBlobUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob)
  blobUrls.add(url)
  return url
}

export function revokeTrackedBlobUrl(url: string): void {
  if (blobUrls.has(url)) {
    URL.revokeObjectURL(url)
    blobUrls.delete(url)
  }
}

export function revokeAllBlobUrls(): void {
  blobUrls.forEach(url => URL.revokeObjectURL(url))
  blobUrls.clear()
}
