import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'
import { handleDbError } from '@/lib/security/security'
import { logActivity } from '@/lib/activity-log'
import { getSessionUser } from '@/lib/get-session-user'
import { cache, invalidateDashboardCache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10') || 10))
    const skip = (page - 1) * limit
    const search = searchParams.get('search')?.trim() || ''
    const filterType = searchParams.get('typeBarang')?.trim() || ''

    // Build where clause for search (all columns) and type filter
    const where: Record<string, unknown> = {}
    const conditions: Record<string, unknown>[] = []

    if (filterType) {
      conditions.push({ typeBarang: { equals: filterType, mode: 'insensitive' } })
    }

    if (search) {
      conditions.push({
        OR: [
          { partType: { contains: search, mode: 'insensitive' } },
          { namaBarang: { contains: search, mode: 'insensitive' } },
          { typeBarang: { contains: search, mode: 'insensitive' } },
          { vendorTujuan: { contains: search, mode: 'insensitive' } },
          { keterangan: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    if (conditions.length > 0) {
      where.AND = conditions
    }

    const cacheKey = cache.generateKey('/api/stock-move', {
      page: page.toString(),
      limit: limit.toString(),
      search: search || '',
      typeBarang: filterType || '',
    })
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'private, no-store', 'X-Cache': 'HIT' },
      })
    }

    const [total, transactions, allTransactions] = await Promise.all([
      prisma.stockTransaction.count({ where }),
      prisma.stockTransaction.findMany({
        where,
        orderBy: { tanggal: 'desc' },
        skip,
        take: limit,
      }),
      // Always fetch all (unfiltered) for summary
      prisma.stockTransaction.findMany({
        select: { typeBarang: true, quality: true, partType: true },
      }),
    ])

    // Calculate summary per typeBarang: MASUK adds, KELUAR subtracts
    const summaryMap: Record<string, number> = {}
    for (const tx of allTransactions) {
      if (!summaryMap[tx.typeBarang]) summaryMap[tx.typeBarang] = 0
      if (tx.partType === 'MASUK') summaryMap[tx.typeBarang] += tx.quality
      else summaryMap[tx.typeBarang] -= tx.quality
    }
    const stockSummary = Object.entries(summaryMap)
      .map(([typeBarang, total]) => ({ typeBarang, total }))
      .sort((a, b) => a.typeBarang.localeCompare(b.typeBarang))

    const responseData = {
      transactions,
      stockSummary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    }

    await cache.set(cacheKey, responseData, 10000)

    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'private, no-store', 'X-Cache': 'MISS' },
    })
  } catch (error: unknown) {
    logger.error('Error fetching stock-move:', error)
    return handleDbError(error, 'mengambil data stock move')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { partType, tanggal, namaBarang, typeBarang, quality, vendorTujuan, keterangan } = body

    if (!partType || !['MASUK', 'KELUAR'].includes(partType)) {
      return NextResponse.json({ error: 'Validation error', message: "partType harus 'MASUK' atau 'KELUAR'" }, { status: 400 })
    }
    if (!tanggal) {
      return NextResponse.json({ error: 'Validation error', message: 'tanggal wajib diisi' }, { status: 400 })
    }
    if (!namaBarang || !String(namaBarang).trim()) {
      return NextResponse.json({ error: 'Validation error', message: 'namaBarang wajib diisi' }, { status: 400 })
    }
    if (!typeBarang || !String(typeBarang).trim()) {
      return NextResponse.json({ error: 'Validation error', message: 'typeBarang wajib diisi' }, { status: 400 })
    }
    if (!Number.isInteger(quality) || quality <= 0) {
      return NextResponse.json({ error: 'Validation error', message: 'quality harus berupa integer positif' }, { status: 400 })
    }

    const tanggalDate = new Date(tanggal)
    if (isNaN(tanggalDate.getTime())) {
      return NextResponse.json({ error: 'Validation error', message: 'tanggal tidak valid' }, { status: 400 })
    }

    const transaction = await prisma.stockTransaction.create({
      data: {
        partType,
        tanggal: tanggalDate,
        namaBarang: String(namaBarang).trim(),
        typeBarang: String(typeBarang).trim(),
        quality,
        vendorTujuan: vendorTujuan ? String(vendorTujuan).trim() : null,
        keterangan: keterangan ? String(keterangan).trim() : null,
      },
    })

    await cache.delete('/api/stock-move')
    await invalidateDashboardCache()

    const user = await getSessionUser(request)
    logActivity({
      entityType: 'stock_move',
      entityId: transaction.id,
      action: 'CREATE',
      description: `${partType} ${namaBarang} (${typeBarang}) — ${quality > 0 ? '+' : ''}${quality} unit${vendorTujuan ? ` · ${vendorTujuan}` : ''}`,
      userId: user?.id,
      userName: user?.name,
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error: unknown) {
    logger.error('Error creating stock transaction:', error)
    return handleDbError(error, 'membuat transaksi stok')
  }
}
