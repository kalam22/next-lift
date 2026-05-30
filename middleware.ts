import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { PATH_TO_MENU } from '@/lib/permissions'

// ─── Rate Limiting ────────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 120

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
  return ip
}

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)
  if (rateLimitMap.size > 1000) {
    for (const [k, r] of rateLimitMap.entries()) {
      if (now > r.resetTime) rateLimitMap.delete(k)
    }
  }
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) return false
  record.count++
  return true
}

// ─── Public routes (no auth required) ────────────────────────────────────────

const PUBLIC_PATHS = ['/login', '/api/auth']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p))
}

// ─── Super admin check — accepts 'super_admin', 'superadmin', etc. ────────────

function isSuperAdmin(role: unknown): boolean {
  if (!role || typeof role !== 'string') return false
  return role.toLowerCase().replace(/[_\s-]/g, '') === 'superadmin'
}

// ─── Determine required permission from pathname ──────────────────────────────

function getRequiredPermission(pathname: string): 'view' | 'create' | 'edit' {
  // /menu/create → create permission
  if (pathname.endsWith('/create') || pathname.includes('/create/')) return 'create'
  // /menu/[id]/edit → edit permission
  if (pathname.endsWith('/edit') || pathname.includes('/edit/')) return 'edit'
  // everything else (list, view, history) → view permission
  return 'view'
}

function getMenuKeyFromPath(pathname: string): string | null {
  if (PATH_TO_MENU[pathname]) return PATH_TO_MENU[pathname]
  for (const [path, menuKey] of Object.entries(PATH_TO_MENU)) {
    if (pathname.startsWith(path + '/')) return menuKey
  }
  return null
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const startTime = Date.now()

  // Rate limiting for API routes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    const key = getRateLimitKey(request)
    if (!checkRateLimit(key)) {
      return NextResponse.json(
        { error: 'Too many requests', message: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
  }

  // Redirect root / to /dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Auth check — skip for public paths and static assets
  if (!isPublicPath(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      // API routes return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      // Pages redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check if user account is still active
    if (token.isActive === false) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Akun Anda tidak aktif.' },
          { status: 401 }
        )
      }
      // Clear the session cookie and redirect to login (no error param to avoid loops)
      const loginUrl = new URL('/login', request.url)
      const response = NextResponse.redirect(loginUrl)
      // Delete NextAuth session cookies so the token is gone on arrival at /login
      const cookiesToClear = [
        'next-auth.session-token',
        '__Secure-next-auth.session-token',
        'next-auth.csrf-token',
        '__Secure-next-auth.csrf-token',
        '__Host-next-auth.csrf-token',
      ]
      cookiesToClear.forEach((name) => {
        response.cookies.delete(name)
      })
      return response
    }

    // Token exists — run permission checks

    // Protect /user-management — super_admin only (checked before general permission check)
    if (pathname.startsWith('/user-management')) {
      if (!isSuperAdmin(token.role)) {
        return NextResponse.rewrite(new URL('/403', request.url))
      }
    }
    if (pathname.startsWith('/api/user-management')) {
      if (!isSuperAdmin(token.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Permission check for page routes (non-API)
    if (!pathname.startsWith('/api/')) {
      const menuKey = getMenuKeyFromPath(pathname)
      if (menuKey) {
        const requiredPermission = getRequiredPermission(pathname)
        const permissions = token.permissions as Record<string, string[]>
        const hasPermission =
          isSuperAdmin(token.role) ||
          permissions?.[menuKey]?.includes(requiredPermission)
        if (!hasPermission) {
          return NextResponse.rewrite(new URL('/403', request.url))
        }
      }
    }
  }

  // If already logged in and visiting /login, redirect to dashboard
  if (pathname === '/login') {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  const response = NextResponse.next()

  // Security headers
  const securityHeaders: Record<string, string> = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }
  if (process.env.NODE_ENV === 'production') {
    securityHeaders['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
  }
  securityHeaders['Content-Security-Policy'] = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data: https:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; ')

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  if (pathname.startsWith('/api/')) {
    response.headers.set('X-Request-Start-Time', startTime.toString())
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)', '/api/:path*'],
}
