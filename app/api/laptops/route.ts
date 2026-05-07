import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { cache } from '@/lib/cache'
import { invalidateDashboardCache } from '@/lib/cache-invalidation'
import { validateRequest } from '@/lib/validation-helpers'
import { laptopSchema } from '@/lib/validations/laptops'
import { handleDbError, safeSortOrder, safeInt, safeLimit, safeSearch } from '@/lib/security'
import type { Laptop, ApiResponse } from '@/types/entities'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = safeInt(searchParams.get('page'), 1)
    const limitParam = searchParams.get('limit') || 'all'
    const { limit, isAll } = safeLimit(limitParam)
    const skip = isAll ? 0 : (page - 1) * limit

    const search = safeSearch(searchParams.get('search'))
    const sortByParam = searchParams.get('sort_by') || 'created_at'
    // Map camelCase to snake_case for Prisma
    const sortByMap: Record<string, string> = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'ssdHdd': 'ssd_hdd',
      'suratJalan': 'surat_jalan',
    }
    const allowedSortFields = ['created_at', 'updated_at', 'merk', 'prosesor', 'site', 'status', 'id']
    const rawSortBy = sortByMap[sortByParam] || sortByParam
    const sortBy = allowedSortFields.includes(rawSortBy) ? rawSortBy : 'created_at'
    const sortOrder = safeSortOrder(searchParams.get('sort_order'))

    // Build where clause
    const where: any = {}
    if (search && search.trim()) {
      where.OR = [
        { merk: { contains: search, mode: 'insensitive' as const } },
        { untuk: { contains: search, mode: 'insensitive' as const } },
        { site: { contains: search, mode: 'insensitive' as const } },
        { prosesor: { contains: search, mode: 'insensitive' as const } },
        { sn: { contains: search, mode: 'insensitive' as const } },
      ]
    }

    // Generate cache key
    const cacheKey = cache.generateKey('/api/laptops', {
      page: page.toString(),
      limit: limitParam,
      search: search || null,
      sort_by: sortByParam,
      sort_order: sortOrder,
    })

    // Check cache
    const cachedResponse = await cache.get<ApiResponse<Laptop>>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'private, no-store',
          'X-Cache': 'HIT',
        },
      })
    }
    
    // Only count if we need total for pagination
    const needsTotal = !isAll

    const queryPromise = prisma.laptops.findMany({
      where,
      select: {
        id: true,
        merk: true,
        prosesor: true,
        sn: true,
        ssd_hdd: true,
        ram: true,
        monitor: true,
        printer: true,
        keyboard: true,
        masuk: true,
        kirim: true,
        unit: true,
        untuk: true,
        site: true,
        departemen: true,
        po: true,
        status: true,
        kerusakan: true,
        surat_jalan: true,
        catatan: true,
        gambar: true,
        serah_terima_pdf: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: [
        { [sortBy]: sortOrder },
        { id: 'desc' }
      ],
      skip,
      take: limit,
    })
    
    const countPromise = needsTotal ? prisma.laptops.count({ where }) : Promise.resolve(0)
    
    const [laptops, total] = await Promise.all([queryPromise, countPromise])

    // Transform snake_case to camelCase for frontend consistency
    const laptopsTransformed = laptops.map(laptop => {
      const transformed: Laptop = {
        id: laptop.id,
        merk: laptop.merk,
        prosesor: laptop.prosesor,
        sn: laptop.sn,
        ssdHdd: laptop.ssd_hdd,
        ram: laptop.ram,
        monitor: laptop.monitor,
        printer: laptop.printer,
        keyboard: laptop.keyboard,
        masuk: laptop.masuk,
        kirim: laptop.kirim,
        unit: laptop.unit,
        untuk: laptop.untuk,
        site: laptop.site,
        departemen: laptop.departemen,
        po: laptop.po,
        status: laptop.status,
        kerusakan: laptop.kerusakan,
        suratJalan: laptop.surat_jalan,
        catatan: laptop.catatan,
        gambar: laptop.gambar,
        serahTerimaPdf: laptop.serah_terima_pdf,
        createdAt: laptop.created_at,
        updatedAt: laptop.updated_at,
      }
      
      return transformed
    })

    const finalTotal = isAll ? laptopsTransformed.length : total

    const responseData: ApiResponse<Laptop> = {
      data: laptopsTransformed,
      pagination: {
        page,
        limit,
        total: finalTotal,
        totalPages: isAll ? 1 : Math.ceil(finalTotal / limit),
      },
    }

    // Cache the response (10 seconds TTL)
    await cache.set(cacheKey, responseData, 10000)

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'private, no-store',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    logger.error('Error fetching laptops:', error)
    return handleDbError(error, 'mengambil data laptops')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate with Zod schema
    const validation = await validateRequest(laptopSchema, body)
    if (!validation.success) {
      return validation.response
    }
    const {
      merk, prosesor, sn, ssdHdd, ram, monitor, printer, keyboard,
      masuk, kirim, unit, untuk, site, departemen, po, status, kerusakan,
      suratJalan, catatan, gambar,
    } = validation.data

    // Convert dates to UTC+8 (WITA) before saving to database
    const convertToUTC8 = (dateString: string): Date | undefined => {
      if (!dateString) return undefined
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return undefined
      const year = date.getFullYear()
      const month = date.getMonth()
      const day = date.getDate()
      const hour = date.getHours()
      const minute = date.getMinutes()
      const second = date.getSeconds()
      const utcDate = new Date(Date.UTC(year, month, day, hour, minute, second))
      return new Date(utcDate.getTime() - (8 * 60 * 60 * 1000))
    }

    const convertedMasuk = convertToUTC8(masuk)
    if (!convertedMasuk) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Invalid date format for "masuk"' },
        { status: 400 }
      )
    }

    const laptop = await prisma.laptops.create({
      data: {
        merk, prosesor,
        sn: sn || null,
        ssd_hdd: ssdHdd ?? '',
        ram: ram ?? '',
        monitor: monitor || null,
        printer: printer || null,
        keyboard: keyboard || null,
        masuk: convertedMasuk,
        kirim: kirim ? convertToUTC8(kirim) : undefined,
        unit: unit || null,
        untuk, site,
        departemen: departemen || null,
        po,
        status,
        kerusakan: kerusakan || null,
        surat_jalan: suratJalan || null,
        catatan: catatan || null,
        gambar: gambar || null,
      },
    })

    const transformed = {
      id: laptop.id, merk: laptop.merk, prosesor: laptop.prosesor, sn: laptop.sn,
      ssdHdd: laptop.ssd_hdd, ram: laptop.ram, monitor: laptop.monitor,
      printer: laptop.printer, keyboard: laptop.keyboard, masuk: laptop.masuk,
      kirim: laptop.kirim, unit: laptop.unit, untuk: laptop.untuk, site: laptop.site,
      departemen: laptop.departemen,
      po: laptop.po, status: laptop.status, kerusakan: laptop.kerusakan,
      suratJalan: laptop.surat_jalan, catatan: laptop.catatan, gambar: laptop.gambar,
      serahTerimaPdf: laptop.serah_terima_pdf,
      createdAt: laptop.created_at, updatedAt: laptop.updated_at,
    }

    await cache.delete('/api/laptops')
    await invalidateDashboardCache()

    return NextResponse.json(transformed, { status: 201 })
  } catch (error) {
    logger.error('Error creating laptop:', error)
    return handleDbError(error, 'membuat laptop')
  }
}

