/**
 * Input sanitization utilities
 */

/**
 * Sanitize string input - remove dangerous characters and trim
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return ''
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 1000) // Limit length
}

/**
 * Sanitize number input
 */
export function sanitizeNumber(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null
  
  const num = typeof input === 'number' ? input : parseFloat(String(input))
  
  if (isNaN(num)) return null
  
  // Prevent extremely large numbers
  if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
    return null
  }
  
  return num
}

/**
 * Sanitize date input
 */
export function sanitizeDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null
  
  const date = input instanceof Date ? input : new Date(input)
  
  if (isNaN(date.getTime())) return null
  
  return date
}

/**
 * Validate file type
 */
export function isValidImageType(mimeType: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ]
  
  return allowedTypes.includes(mimeType.toLowerCase())
}

/**
 * Validate file size (in bytes)
 */
export function isValidFileSize(size: number, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return size > 0 && size <= maxSizeBytes
}

/**
 * Validate file name
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .slice(0, 255) // Limit length
}

/**
 * Check if file content matches declared MIME type
 */
export async function validateFileContent(file: File): Promise<boolean> {
  // Read first bytes to check magic numbers
  const arrayBuffer = await file.slice(0, 4).arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return file.type.startsWith('image/jpeg')
  }
  
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return file.type === 'image/png'
  }
  
  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return file.type === 'image/gif'
  }
  
  // WebP: Check for RIFF header (more complex, simplified check)
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return file.type === 'image/webp'
  }
  
  // If we can't verify, allow if MIME type is valid
  return isValidImageType(file.type)
}

