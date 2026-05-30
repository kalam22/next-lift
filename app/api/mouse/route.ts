import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { cache } from '@/lib/cache'
import { invalidateDashboardCache } from '@/lib/cache-invalidation'
import { handleDbError, safeSortOrder, safeInt, safeLimit, safeSearch } from '@/lib/security'
import { logActivity } from '@/lib/activity-log'
import { getSessionUser } from '@/lib/get-session-user'
import type { Mouse, ApiResponse } from '@/types/entities'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = safeInt(searchParams.get('page'), 1)
    const limitParam = searchParams.get('limit') || 'all'
    const { limit, isAll } = safeLimit(limitParam)
    const skip = isAll ? 0 : (page - 1) * limit

    const search = safeSearch(searchParams.get('search'))
    const validSortFields = ['id', 'brand', 'jumlahOrderan', 'diperuntukan', 'site', 'nomorPO', 'statusBarang', 'createdAt', 'updatedAt']
    const sortByParam = searchParams.get('sort_by') || 'createdAt'
    const sortBy = validSortFields.includes(sortByParam) ? sortByParam : 'createdAt'
    const sortOrder = safeSortOrder(searchParams.get('sort_order'))

    // Generate cache key
    const cacheKey = cache.generateKey('/api/mouse', {
      page: page.toString(),
      limit: limitParam,
      search: search || null,
      sort_by: sortBy,
      sort_order: sortOrder,
    })

    const cachedResponse = await cache.get<ApiResponse<Mouse>>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: { 'Cache-Control': 'private, no-store', 'X-Cache': 'HIT' },
      })
    }

    const where: any = {}
    if (search) {
      where.OR = [
        { brand: { contains: search, mode: 'insensitive' as const } },
        { diperuntukan: { contains: search, mode: 'insensitive' as const } },
        { site: { contains: search, mode: 'insensitive' as const } },
        { nomorPO: { contains: search, mode: 'insensitive' as const } },
      ]
    }

    const needsTotal = !isAll

    const queryPromise = prisma.mouse.findMany({
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

    const [mice, total] = await Promise.all([
      queryPromise,
      needsTotal ? prisma.mouse.count({ where }) : Promise.resolve(0),
    ])

    const responseData: ApiResponse<Mouse> = {
      data: mice as Mouse[],
      pagination: needsTotal
        ? { page, limit, total, totalPages: Math.ceil(total / limit) }
        : { page: 1, limit: mice.length, total: mice.length, totalPages: 1 },
    }

    await cache.set(cacheKey, responseData, 10000)

    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'private, no-store', 'X-Cache': 'MISS' },
    })
  } catch (error) {
    logger.error('Error fetching mice:', error)
    return handleDbError(error, 'mengambil data mouse')
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

    const mouse = await prisma.mouse.create({
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

    // Invalidate dashboard cache and mouse cache when new data is added
    await invalidateDashboardCache()
    await cache.delete('/api/mouse')

    const user = await getSessionUser(request)
    logActivity({ entityType: 'mouse', entityId: mouse.id, action: 'CREATE', description: `Data Mouse "${brand}" ditambahkan`, userId: user?.id, userName: user?.name })

    return NextResponse.json(mouse, { status: 201 })
  } catch (error: unknown) {
    logger.error('Error creating mouse:', error)
    return handleDbError(error, 'membuat mouse')
  }
}

