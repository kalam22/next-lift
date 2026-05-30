import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { logger } from '@/lib/logger'
import { cache } from '@/lib/cache'
import { invalidateDashboardCache } from '@/lib/cache-invalidation'
import { logActivity } from '@/lib/activity-log'
import { getSessionUser } from '@/lib/get-session-user'
import type { ToolsJaringan, ApiResponse } from '@/types/entities'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limitParam = searchParams.get('limit') || 'all'
    const limit = limitParam === 'all' ? 10000 : parseInt(limitParam)
    const skip = limitParam === 'all' ? 0 : (page - 1) * limit

    const search = searchParams.get('search')
    const sortBy = searchParams.get('sort_by') || 'createdAt'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // Generate cache key
    const cacheKey = cache.generateKey('/api/tools-jaringan', {
      page: page.toString(),
      limit: limitParam,
      search: search || null,
      sort_by: sortBy,
      sort_order: sortOrder,
    })

    // Check cache
    const cachedResponse = await cache.get<ApiResponse<ToolsJaringan>>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
          'X-Cache': 'HIT',
        },
      })
    }

    // Build where clause
    const where: any = {}
    if (search && search.trim()) {
      where.OR = [
        { brand: { contains: search, mode: 'insensitive' as const } },
        { diperuntukan: { contains: search, mode: 'insensitive' as const } },
        { site: { contains: search, mode: 'insensitive' as const } },
        { nomorPO: { contains: search, mode: 'insensitive' as const } },
      ]
    }

    // Only count if we need total for pagination
    const needsTotal = limitParam !== 'all'

    const queryPromise = prisma.toolsJaringan.findMany({
      where,
      select: {
        id: true,
        brand: true,
        jumlahOrderan: true,
        diperuntukan: true,
        site: true,
        departemen: true,
        nomorPO: true,
        nomorSuratJalan: true,
        statusBarang: true,
        tanggalMasuk: true,
        tanggalKirim: true,
        keterangan: true,
        foto: true,
        createdAt: true,
        updatedAt: true,
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    })

    const [toolsJaringan, total] = await Promise.all([
      queryPromise,
      needsTotal ? prisma.toolsJaringan.count({ where }) : Promise.resolve(0),
    ])

    const responseData: ApiResponse<ToolsJaringan> = {
      data: toolsJaringan as ToolsJaringan[],
      pagination: needsTotal
        ? {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          }
        : {
            page: 1,
            limit: toolsJaringan.length,
            total: toolsJaringan.length,
            totalPages: 1,
          },
    }

    // Cache the response (10 seconds TTL)
    await cache.set(cacheKey, responseData, 10000)

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        'X-Cache': 'MISS',
      },
    })
  } catch (error: unknown) {
    logger.error('Error fetching tools jaringan:', error)
    
    // Check if it's a Prisma model not found error (Prisma Client not regenerated)
    const isPrismaError = error && typeof error === 'object' && 'message' in error && 'code' in error
    if (isPrismaError) {
      const prismaError = error as { message?: string; code?: string }
      if (
        (typeof prismaError.message === 'string' && prismaError.message.includes('toolsJaringan')) ||
        prismaError.code === 'P2001' ||
        prismaError.code === 'P2025' ||
        (typeof prismaError.message === 'string' && prismaError.message.includes('Unknown model')) ||
        (typeof prismaError.message === 'string' && prismaError.message.includes('does not exist'))
      ) {
        return NextResponse.json(
          { 
            error: 'Model not found',
            message: 'ToolsJaringan model not found. Please restart the dev server to regenerate Prisma Client.',
          },
          { status: 500 }
        )
      }
    }
    
    if (error instanceof Error && (error.name === 'PrismaClientInitializationError' || error.message.includes('Can\'t reach database server'))) {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          message: 'Cannot connect to database server. Please ensure PostgreSQL is running at localhost:5432',
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch tools jaringan', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      brand,
      jumlahOrderan,
      diperuntukan,
      site,
      nomorPO,
      nomorSuratJalan,
      statusBarang,
      tanggalMasuk,
      tanggalKirim,
      keterangan,
      foto,
      departemen,
    } = body

    // Validate required fields
    if (!brand || !brand.trim()) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Brand is required' },
        { status: 400 }
      )
    }
    if (!jumlahOrderan || isNaN(parseInt(String(jumlahOrderan)))) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Jumlah Orderan is required and must be a valid number' },
        { status: 400 }
      )
    }
    if (!diperuntukan || !diperuntukan.trim()) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Diperuntukan is required' },
        { status: 400 }
      )
    }
    if (!site || !site.trim()) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Site is required' },
        { status: 400 }
      )
    }
    if (!nomorPO || !nomorPO.trim()) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Nomor PO is required' },
        { status: 400 }
      )
    }
    if (!statusBarang || !statusBarang.trim()) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Status Barang is required' },
        { status: 400 }
      )
    }
    if (!tanggalMasuk) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Tanggal Masuk is required' },
        { status: 400 }
      )
    }

    // Validate date format
    const tanggalMasukDate = new Date(tanggalMasuk)
    if (isNaN(tanggalMasukDate.getTime())) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Invalid date format for tanggal masuk' },
        { status: 400 }
      )
    }

    let tanggalKirimDate = null
    if (tanggalKirim) {
      tanggalKirimDate = new Date(tanggalKirim)
      if (isNaN(tanggalKirimDate.getTime())) {
        return NextResponse.json(
          { error: 'Validation error', message: 'Invalid date format for tanggal kirim' },
          { status: 400 }
        )
      }
    }

    const toolsJaringan = await prisma.toolsJaringan.create({
      data: {
        brand: brand.trim(),
        jumlahOrderan: parseInt(String(jumlahOrderan)),
        diperuntukan: diperuntukan.trim(),
        site: site.trim(),
        nomorPO: nomorPO.trim(),
        nomorSuratJalan: nomorSuratJalan?.trim() || null,
        statusBarang: statusBarang.trim(),
        tanggalMasuk: tanggalMasukDate,
        tanggalKirim: tanggalKirimDate,
        keterangan: keterangan?.trim() || null,
        foto: foto?.trim() || null,
        departemen: departemen || null,
      },
    })

    // Invalidate cache
    await cache.delete('/api/tools-jaringan')
    await invalidateDashboardCache()

    const user = await getSessionUser(request)
    logActivity({ entityType: 'tools_jaringan', entityId: toolsJaringan.id, action: 'CREATE', description: `Data Tools Jaringan "${brand}" ditambahkan`, userId: user?.id, userName: user?.name })

    return NextResponse.json(toolsJaringan, { status: 201 })
  } catch (error: unknown) {
    logger.error('Error creating tools jaringan:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create tools jaringan', message: errorMessage },
      { status: 500 }
    )
  }
}

