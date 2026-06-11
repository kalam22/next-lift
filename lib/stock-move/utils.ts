/**
 * Stock Move Utility Functions
 * Shared utilities for stock movement operations
 */

import { logger } from '@/lib/logger'

/**
 * Extract error message from various error types
 * Handles Axios errors, standard errors, and unknown types
 */
export function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    return axiosError.response?.data?.message || 'Terjadi kesalahan'
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'Terjadi kesalahan'
}

/**
 * Log and extract error message
 * Combines logging and message extraction for consistent error handling
 */
export function handleError(error: unknown, context: string): string {
  logger.error(`${context}:`, error)
  return extractErrorMessage(error)
}

/**
 * Format date to Indonesian locale
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
