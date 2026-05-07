/**
 * PDF utility functions
 * Only validation and formatting - no compression
 */

/**
 * Validate PDF file
 * @param file - File to validate
 * @returns true if valid PDF
 */
export function validatePDF(file: File): boolean {
  // Check file type
  if (file.type !== 'application/pdf') {
    return false;
  }

  // Check file extension
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return false;
  }

  return true;
}

/**
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
