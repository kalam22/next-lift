/**
 * Shared Inventory Utilities
 * Common utilities for all inventory pages (laptops, mouse, monitor, etc.)
 */

import { logger } from '@/lib/logger'

/**
 * Extract error message from various error types
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
 * Format date for display in table
 */
export function formatTableDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Validate required fields
 */
export function validateRequired(value: string | number | null | undefined, fieldName: string): string | null {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} wajib diisi`
  }
  return null
}

/**
 * Debounce function
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
