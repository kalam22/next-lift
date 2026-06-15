import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'
import { handleDbError, safeSortOrder, safeInt, safeLimit, safeSearch } from '@/lib/security/security'
import { logActivity } from '@/lib/activity-log'
import { getSessionUser } from '@/lib/get-session-user'
import type { Printer, ApiResponse } from '@/types/entities'
import { cache, invalidateDashboardCache } from '@/lib/cache'

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
    const cacheKey = cache.generateKey('/api/printer', {
      page: page.toString(),
      limit: limitParam,
      search: search || null,
      sort_by: sortBy,
      sort_order: sortOrder,
    })

    const cachedResponse = await cache.get<ApiResponse<Printer>>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: { 'Cache-Control': 'private, no-store', 'X-Cache': 'HIT' },
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
        { kerusakan: search.trim() ? { contains: search, mode: 'insensitive' as const } : undefined },
      ].filter((condition: any) => condition !== undefined)
    }

    // Only count if we need total for pagination
    const needsTotal = limitParam !== 'all'

    const queryPromise = prisma.printer.findMany({
      where,
      select: {
        id: true,
        brand: true,
        jumlah: true,
        diperuntukan: true,
        site: true,
        departemen: true,
        nomorPO: true,
        nomorSuratJalan: true,
        statusBarang: true,
        tanggalMasuk: true,
        tanggalKirim: true,
        kerusakan: true,
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

    const [printers, total] = await Promise.all([
      queryPromise,
      needsTotal ? prisma.printer.count({ where }) : Promise.resolve(0),
    ])

    const responseData: ApiResponse<Printer> = {
      data: printers as Printer[],
      pagination: needsTotal
        ? {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          }
        : {
            page: 1,
            limit: printers.length,
            total: printers.length,
            totalPages: 1,
          },
    }

    // Cache the response (10 seconds TTL)
    await cache.set(cacheKey, responseData, 10000)

    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'private, no-store', 'X-Cache': 'MISS' },
    })
  } catch (error: any) {
    logger.error('Error fetching printers:', error)
    return handleDbError(error, 'mengambil data printer')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      brand,
      jumlah,
      diperuntukan,
      site,
      nomorPO,
      nomorSuratJalan,
      statusBarang,
      tanggalMasuk,
      tanggalKirim,
      kerusakan,
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
    // Jumlah is optional, but if provided must be a valid number
    let jumlahValue = 0
    if (jumlah !== null && jumlah !== undefined && jumlah !== '') {
      const parsed = parseInt(String(jumlah))
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json(
          { error: 'Validation error', message: 'Jumlah must be a valid positive number' },
          { status: 400 }
        )
      }
      jumlahValue = parsed
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

    const printer = await prisma.printer.create({
      data: {
        brand: brand.trim(),
        jumlah: jumlahValue,
        diperuntukan: diperuntukan.trim(),
        site: site.trim(),
        nomorPO: nomorPO.trim(),
        nomorSuratJalan: nomorSuratJalan?.trim() || null,
        statusBarang: statusBarang.trim(),
        tanggalMasuk: tanggalMasukDate,
        tanggalKirim: tanggalKirimDate,
        kerusakan: kerusakan?.trim() || null,
        keterangan: keterangan?.trim() || null,
        foto: foto?.trim() || null,
        departemen: departemen || null,
      },
    })

    // Invalidate cache
    await cache.delete('/api/printer')
    await invalidateDashboardCache()

    const user = await getSessionUser(request)
    logActivity({ entityType: 'printer', entityId: printer.id, action: 'CREATE', description: `Data Printer "${brand}" ditambahkan`, userId: user?.id, userName: user?.name })

    return NextResponse.json(printer, { status: 201 })
  } catch (error: unknown) {
    logger.error('Error creating printer:', error)
    return handleDbError(error, 'membuat printer')
  }
}

