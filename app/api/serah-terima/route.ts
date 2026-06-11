import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { cache } from '@/lib/cache'
import { validateRequest } from '@/lib/validation-helpers'
import { handoverSchema } from '@/lib/validations/handover'
import { handleDbError, safeSortOrder, safeInt, safeLimit, safeSearch } from '@/lib/security'
import { logActivity } from '@/lib/activity-log'
import { getSessionUser } from '@/lib/get-session-user'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = safeInt(searchParams.get('page'), 1)
    const limitParam = searchParams.get('limit') || '10'
    const { limit, isAll } = safeLimit(limitParam)
    const skip = isAll ? 0 : (page - 1) * limit
    const sortBy = searchParams.get('sort_by') || 'tanggal'
    const sortOrder = safeSortOrder(searchParams.get('sort_order'))
    const search = safeSearch(searchParams.get('search'))

    const cacheKey = cache.generateKey('/api/serah-terima', {
      page: page.toString(),
      limit: limitParam,
      sort_by: sortBy,
      sort_order: sortOrder,
      search: search || null,
    })

    const cachedResponse = await cache.get<any>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
          'X-Cache': 'HIT',
        },
      })
    }

    let where: any = { AND: [] as any[] }

    if (search && search.trim()) {
      where.AND.push({
        OR: [
          { barang: { contains: search, mode: 'insensitive' as const } },
          { pic: { contains: search, mode: 'insensitive' as const } },
          { site: { contains: search, mode: 'insensitive' as const } },
          { namaPenerima: { contains: search, mode: 'insensitive' as const } },
        ]
      })
    }

    if (where.AND.length === 0) {
      delete where.AND
      if (Object.keys(where).length === 0) {
        where = {}
      }
    }

    const allowedSortFields = ['tanggal', 'barang', 'pic', 'site', 'namaPenerima', 'created_at']
    let orderBy: any[] = []
    if (sortBy && allowedSortFields.includes(sortBy)) {
      const finalSortOrder = sortOrder === 'desc' ? 'desc' : 'asc'
      orderBy = [
        { [sortBy]: finalSortOrder },
        { id: 'desc' }
      ]
    } else {
      orderBy = [
        { tanggal: 'desc' },
        { id: 'desc' }
      ]
    }

    const needsTotal = !isAll
    
    const queryOptions: any = {
      orderBy,
      skip,
      take: limit,
    }
    
    if (Object.keys(where).length > 0) {
      queryOptions.where = where
    }
    
    const queryPromise = prisma.handover.findMany(queryOptions)
    
    const countOptions: { where?: typeof where } = {}
    if (Object.keys(where).length > 0) {
      countOptions.where = where
    }
    const countPromise = needsTotal ? prisma.handover.count(countOptions) : Promise.resolve(0)
    
    const [handovers, total] = await Promise.all([queryPromise, countPromise])

    const finalTotal = isAll ? handovers.length : total

    const responseData = {
      data: handovers,
      pagination: {
        page,
        limit,
        total: finalTotal,
        totalPages: isAll ? 1 : Math.ceil(finalTotal / limit),
      },
    }

    await cache.set(cacheKey, responseData, 10000)

    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'private, no-store', 'X-Cache': 'MISS' },
    })
  } catch (error) {
    logger.error('Error fetching handovers:', error)
    return handleDbError(error, 'mengambil data serah terima')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = await validateRequest(handoverSchema, body)
    if (!validation.success) return validation.response

    const { tanggal, barang, pic, site, namaPenerima, ttd } = validation.data

    const handover = await prisma.handover.create({
      data: {
        tanggal: new Date(tanggal),
        barang,
        pic,
        site,
        namaPenerima,
        ttd: ttd || null,
      },
    })

    await cache.deleteByPrefix('/api/serah-terima')

    const user = await getSessionUser(request)
    logActivity({
      entityType: 'handover',
      entityId: handover.id,
      action: 'CREATE',
      description: `Serah terima barang PIC "${pic}" di site "${site}" ke "${namaPenerima}" ditambahkan`,
      userId: user?.id,
      userName: user?.name,
    })

    return NextResponse.json(handover, { status: 201 })
  } catch (error) {
    logger.error('Error creating handover:', error)
    return handleDbError(error, 'membuat serah terima')
  }
}
