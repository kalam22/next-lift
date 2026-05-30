import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cctvSchema } from '@/lib/validations/cctv'
import { successResponse, errorResponse } from '@/lib/api-response'
import { validateRequest } from '@/lib/validation-helpers'
import { logger } from '@/lib/logger'
import { cache } from '@/lib/cache'
import { invalidateDashboardCache } from '@/lib/cache-invalidation'
import { logActivity } from '@/lib/activity-log'
import { getSessionUser } from '@/lib/get-session-user'
import type { Cctv, ApiResponse } from '@/types/entities'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const pageParam = parseInt(searchParams.get('page') || '1')
    const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
    const limitParam = searchParams.get('limit') || 'all'
    const limit = limitParam === 'all' ? 10000 : Math.max(1, parseInt(limitParam) || 10)
    const skip = limitParam === 'all' ? 0 : Math.max(0, (page - 1) * limit)

    const search = searchParams.get('search')
    const sortByParam = searchParams.get('sort_by') || 'createdAt'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // Valid sort fields
    const validSortFields = ['id', 'brand', 'storage', 'jumlahOrderan', 'diperuntukan', 'site', 'nomorPO', 'statusBarang', 'createdAt', 'updatedAt']
    const sortBy = validSortFields.includes(sortByParam) ? sortByParam : 'createdAt'

    // Generate cache key
    const cacheKey = cache.generateKey('/api/cctv', {
      page: page.toString(),
      limit: limitParam,
      search: search || null,
      sort_by: sortByParam,
      sort_order: sortOrder,
    })

    // Check cache
    const cachedResponse = await cache.get<ApiResponse<Cctv>>(cacheKey)
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
        { storage: { contains: search, mode: 'insensitive' as const } },
      ]
    }

    // Only count if we need total for pagination
    const needsTotal = limitParam !== 'all'

    const queryPromise = prisma.cctv.findMany({
      where,
      select: {
        id: true,
        brand: true,
        storage: true,
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

    const [cctvs, total] = await Promise.all([
      queryPromise,
      needsTotal ? prisma.cctv.count({ where }) : Promise.resolve(0),
    ])

    const responseData: ApiResponse<Cctv> = {
      data: cctvs as Cctv[],
      pagination: needsTotal && limit > 0
        ? {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
          }
        : {
            page: 1,
            limit: cctvs.length,
            total: cctvs.length,
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
  } catch (error) {
    logger.error('Error fetching cctv:', error)
    
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
      { error: 'Failed to fetch cctv', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request dengan Zod schema
    const validation = await validateRequest(cctvSchema, body)
    if (!validation.success) {
      return validation.response
    }
    
    const validatedData = validation.data

    const cctv = await prisma.cctv.create({
      data: {
        brand: validatedData.brand.trim(),
        storage: validatedData.storage?.trim() || null,
        jumlahOrderan: validatedData.jumlahOrderan,
        diperuntukan: validatedData.diperuntukan.trim(),
        site: validatedData.site.trim(),
        nomorPO: validatedData.nomorPO.trim(),
        nomorSuratJalan: validatedData.nomorSuratJalan?.trim() || null,
        statusBarang: validatedData.statusBarang,
        tanggalMasuk: new Date(validatedData.tanggalMasuk),
        tanggalKirim: validatedData.tanggalKirim ? new Date(validatedData.tanggalKirim) : null,
        keterangan: validatedData.keterangan?.trim() || null,
        foto: validatedData.foto?.trim() || null,
        departemen: validatedData.departemen || null,
      },
    })

    // Invalidate cache
    await cache.delete('/api/cctv')
    await invalidateDashboardCache()

    const user = await getSessionUser(request)
    logActivity({ entityType: 'cctv', entityId: cctv.id, action: 'CREATE', description: `Data CCTV "${validatedData.brand}" ditambahkan`, userId: user?.id, userName: user?.name })

    return successResponse(cctv, 201)
  } catch (error: unknown) {
    logger.error('Error creating cctv:', error)
    
    if (error instanceof Error && (error.name === 'PrismaClientInitializationError' || error.message.includes('Can\'t reach database server'))) {
      return errorResponse(
        'Database connection failed',
        503,
        'Cannot connect to database server. Please ensure PostgreSQL is running at localhost:5432'
      )
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return errorResponse(
      'Failed to create cctv',
      500,
      errorMessage
    )
  }
}

