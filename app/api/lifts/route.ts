import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'
import { validateRequest } from '@/lib/utils/helpers'
import { liftSchema } from '@/lib/validations/lifts'
import { handleDbError, safeSortOrder, safeInt, safeLimit, safeSearch } from '@/lib/security/security'
import { logActivity } from '@/lib/activity-log'
import { getSessionUser } from '@/lib/get-session-user'
import type { Lift } from '@/types/lift'
import { cache, invalidateDashboardCache } from '@/lib/cache'

// Helper function untuk compute fields - now uses per-call timestamp (no stale cache)
function computeLiftFields(lift: Lift, now: number = Date.now()): Lift {
  // Cache JSON.parse result if akses is simple
  let aksesArray: number[] = []
  if (lift.akses) {
    try {
      const parsed = typeof lift.akses === 'string' ? JSON.parse(lift.akses) : lift.akses
      aksesArray = Array.isArray(parsed) ? parsed.map(Number) : []
    } catch {
      aksesArray = []
    }
  }

  // Only compute sisaHari if diperlukan
  let sisaHari: string | undefined = undefined
  if (lift.berlaku) {
    const masaBerlaku = new Date(lift.berlaku).getTime()
    const diff = masaBerlaku - now
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
    sisaHari = daysLeft < 0 ? 'Expired' : `${daysLeft} Hari`
  }

  return {
    ...lift,
    aksesArray,
    formattedLantai: aksesArray.length > 0 ? aksesArray.join(', ') : '-',
    sisaHari,
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all'
    const page = safeInt(searchParams.get('page'), 1)
    const limitParam = searchParams.get('limit') || 'all'
    const { limit, isAll } = safeLimit(limitParam)
    const skip = isAll ? 0 : (page - 1) * limit
    const sortBy = searchParams.get('sort_by')
    const sortOrder = safeSortOrder(searchParams.get('sort_order'))
    const search = safeSearch(searchParams.get('search'))

    // Generate cache key
    const cacheKey = cache.generateKey('/api/lifts', {
      status,
      page: page.toString(),
      limit: limitParam,
      sort_by: sortBy || null,
      sort_order: sortOrder,
      search: search || null,
    })

    // Check cache
    const cachedResponse = await cache.get<{ data: Lift[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
          'X-Cache': 'HIT',
        },
      })
    }

    // Build where clause untuk filter di database
    let where: any = {
      AND: [] as any[]
    }

    // Date object untuk filter status (berbeda dari timestamp untuk computation)
    const currentDate = new Date()

    if (status === 'expired') {
      where.AND.push({
        berlaku: {
          lt: currentDate
        }
      })
    } else if (status === 'expiring_soon') {
      const nextWeek = new Date()
      nextWeek.setDate(currentDate.getDate() + 7)
      where.AND.push({
        berlaku: {
          gte: currentDate,
          lte: nextWeek
        }
      })
    } else if (status === 'active') {
      where.AND.push({
        OR: [
          { berlaku: { gte: currentDate } },
          { berlaku: null }
        ]
      })
    }

    if (search && search.trim()) {
      where.AND.push({
        OR: [
          { nama: { contains: search, mode: 'insensitive' as const } },
          { pt: { contains: search, mode: 'insensitive' as const } },
          { departemen: { contains: search, mode: 'insensitive' as const } },
        ]
      })
    }

    // Cleanup where clause - jika AND kosong, hapus properti AND
    if (where.AND.length === 0) {
      delete where.AND
      // Jika tidak ada filter sama sekali, gunakan empty object
      if (Object.keys(where).length === 0) {
        where = {}
      }
    }

    // Validasi sortBy agar hanya field yang ada di database
    const allowedSortFields = ['nama', 'pt', 'departemen', 'berlaku', 'created_at', 'akses']
    // Only apply sorting if sortBy is provided
    let orderBy: any[] = []
    if (sortBy && allowedSortFields.includes(sortBy)) {
      const finalSortOrder = sortOrder === 'desc' ? 'desc' : 'asc'
      orderBy = [
        { [sortBy]: finalSortOrder },
        { id: 'desc' } // Tie-breaker for stable pagination
      ]
    } else {
      // Default: sort by created_at desc if no sort specified
      orderBy = [
        { created_at: 'desc' },
        { id: 'desc' }
      ]
    }

    // Optimize: Only count if we need total for pagination
    const needsTotal = !isAll
    
    // Query dengan pagination dan filter di database
    const queryOptions: any = {
      select: {
        id: true,
        nama: true,
        pt: true,
        departemen: true,
        berlaku: true,
        akses: true,
        created_at: true,
        updated_at: true,
      },
      orderBy,
      skip,
      take: limit,
    }
    
    // Hanya tambahkan where jika ada filter
    if (Object.keys(where).length > 0) {
      queryOptions.where = where
    }
    
    const queryPromise = prisma.lifts.findMany(queryOptions)
    
    const countOptions: {
      where?: typeof where
    } = {}
    if (Object.keys(where).length > 0) {
      countOptions.where = where
    }
    const countPromise = needsTotal ? prisma.lifts.count(countOptions) : Promise.resolve(0)
    
    const [lifts, total] = await Promise.all([queryPromise, countPromise])

    // Process computed fields with cached timestamp (using timestamp for computation)
    const timestampForComputation = Date.now()
    // Transform to match Lift type (using snake_case for created_at and updated_at)
    const liftsWithComputed = lifts.map(lift => {
      const transformed: Lift = {
        id: lift.id,
        nama: lift.nama,
        pt: lift.pt,
        departemen: lift.departemen,
        berlaku: lift.berlaku,
        akses: lift.akses,
        created_at: lift.created_at,
        updated_at: lift.updated_at,
      }
      return computeLiftFields(transformed, timestampForComputation)
    })

    // Use total from count or lifts length
    const finalTotal = isAll ? lifts.length : total

    const responseData = {
      data: liftsWithComputed,
      pagination: {
        page, limit, total: finalTotal,
        totalPages: isAll ? 1 : Math.ceil(finalTotal / limit),
      },
    }

    await cache.set(cacheKey, responseData, 10000)

    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'private, no-store', 'X-Cache': 'MISS' },
    })
  } catch (error) {
    logger.error('Error fetching lifts:', error)
    return handleDbError(error, 'mengambil data lifts')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = await validateRequest(liftSchema, body)
    if (!validation.success) return validation.response

    const { nama, pt, departemen, berlaku, akses } = validation.data

    const lift = await prisma.lifts.create({
      data: {
        nama,
        pt,
        departemen: departemen || null,
        berlaku: berlaku ? new Date(berlaku) : null,
        akses: akses ? JSON.stringify(akses) : null,
      },
    })

    await cache.deleteByPrefix('/api/lifts')

    const user = await getSessionUser(request)
    logActivity({
      entityType: 'lift',
      entityId: lift.id,
      action: 'CREATE',
      description: `Data lift "${nama}" ditambahkan`,
      userId: user?.id,
      userName: user?.name,
    })

    return NextResponse.json(lift, { status: 201 })
  } catch (error) {
    logger.error('Error creating lift:', error)
    return handleDbError(error, 'membuat lift')
  }
}

