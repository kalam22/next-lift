import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Note: Redis tidak bisa digunakan di middleware karena middleware berjalan di Edge Runtime
// yang tidak support Node.js modules. Redis hanya bisa digunakan di API routes (server-side).

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 120 // 120 requests per minute per IP (reasonable for SPA)

function getRateLimitKey(request: NextRequest): string {
  // Use IP address as the key
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
  return ip
}

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  // Cleanup expired entries (inline cleanup untuk Edge Runtime compatibility)
  if (rateLimitMap.size > 1000) {
    // Only cleanup if map is getting large
    for (const [k, r] of rateLimitMap.entries()) {
      if (now > r.resetTime) {
        rateLimitMap.delete(k)
      }
    }
  }

  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  record.count++
  return true
}

// Note: Rate limiting di middleware menggunakan in-memory karena Edge Runtime limitation
// Untuk persistent rate limiting dengan Redis, bisa diimplementasikan di API routes level
// Cleanup dilakukan inline saat checkRateLimit untuk menghindari setInterval di Edge Runtime

export function middleware(request: NextRequest) {
  const startTime = Date.now()

  // Only apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const key = getRateLimitKey(request)
    const allowed = checkRateLimit(key)

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
          },
        }
      )
    }
  }

  // Create response with performance monitoring
  const response = NextResponse.next()

  // Add security headers to all responses
  const securityHeaders: Record<string, string> = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }

  // Add HSTS for production
  if (process.env.NODE_ENV === 'production') {
    securityHeaders['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
  }

  // Content Security Policy - adjusted for Next.js and Tailwind
  securityHeaders['Content-Security-Policy'] = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // 'unsafe-eval' for Next.js, 'unsafe-inline' for inline scripts
    "style-src 'self' 'unsafe-inline'", // 'unsafe-inline' for Tailwind
    "img-src 'self' data: https:",
    "font-src 'self' data: https:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; ')

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Track API response time
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('X-Request-Start-Time', startTime.toString())
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

