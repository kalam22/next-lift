/**
 * Shared security utilities untuk semua API routes
 */

import { NextResponse } from 'next/server'

const isDev = process.env.NODE_ENV === 'development'

/**
 * Safe error response — tidak bocorkan detail internal di production
 */
export function safeErrorResponse(
  publicMessage: string,
  status: number,
  error?: unknown
): NextResponse {
  return NextResponse.json(
    {
      error: publicMessage,
      ...(isDev && error instanceof Error && {
        detail: error.message,
        stack: error.stack,
      }),
    },
    { status }
  )
}

/**
 * Handle Prisma/DB errors secara konsisten
 */
export function handleDbError(error: unknown, context: string): NextResponse {
  if (
    error instanceof Error &&
    (error.name === 'PrismaClientInitializationError' ||
      error.message.includes("Can't reach database server"))
  ) {
    return NextResponse.json(
      { error: 'Database connection failed', message: 'Tidak dapat terhubung ke database.' },
      { status: 503 }
    )
  }
  return safeErrorResponse(`Gagal ${context}`, 500, error)
}

/**
 * Validate & sanitize sortOrder param
 */
export function safeSortOrder(value: string | null): 'asc' | 'desc' {
  return value === 'asc' ? 'asc' : 'desc'
}

/**
 * Validate & sanitize integer param
 */
export function safeInt(value: string | null, fallback: number, min = 1): number {
  const parsed = parseInt(value || '')
  return isNaN(parsed) || parsed < min ? fallback : parsed
}

/**
 * Validate & sanitize limit param — max 500 untuk mencegah dump massal
 */
export function safeLimit(limitParam: string | null): { limit: number; isAll: boolean } {
  if (limitParam === 'all') return { limit: 500, isAll: true }
  const parsed = parseInt(limitParam || '20')
  const limit = isNaN(parsed) || parsed < 1 ? 20 : Math.min(parsed, 500)
  return { limit, isAll: false }
}

/**
 * Validate & sanitize search param — max 200 chars
 */
export function safeSearch(value: string | null): string | null {
  if (!value || !value.trim()) return null
  return value.trim().slice(0, 200)
}
