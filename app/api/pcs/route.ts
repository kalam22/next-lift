import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { cache } from '@/lib/cache'
import { invalidateDashboardCache } from '@/lib/cache-invalidation'
import { validateRequest } from '@/lib/validation-helpers'
import { pcSchema } from '@/lib/validations/pcs'
import { handleDbError, safeSortOrder, safeInt, safeLimit, safeSearch } from '@/lib/security'
import { logActivity } from '@/lib/activity-log'
import { getSessionUser } from '@/lib/get-session-user'
import type { PC, ApiResponse } from '@/types/entities'

const convertToUTC8 = (dateString: string): Date | undefined => {
  if (!dateString) return undefined
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return undefined
  const utcDate = new Date(Date.UTC(
    date.getFullYear(), date.getMonth(), date.getDate(),
    date.getHours(), date.getMinutes(), date.getSeconds()
  ))
  return new Date(utcDate.getTime() - 8 * 60 * 60 * 1000)
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = safeInt(searchParams.get('page'), 1)
    const limitParam = searchParams.get('limit') || 'all'
    const { limit, isAll } = safeLimit(limitParam)
    const skip = isAll ? 0 : (page - 1) * limit

    const search = safeSearch(searchParams.get('search'))
    const sortByParam = searchParams.get('sort_by') || 'created_at'
    const sortByMap: Record<string, string> = {
      createdAt: 'created_at', updatedAt: 'updated_at',
      ssdHdd: 'ssd_hdd', suratJalan: 'surat_jalan',
    }
    const allowedSortFields = ['created_at', 'updated_at', 'merk', 'prosesor', 'site', 'status', 'id']
    const rawSortBy = sortByMap[sortByParam] || sortByParam
    const sortBy = allowedSortFields.includes(rawSortBy) ? rawSortBy : 'created_at'
    const sortOrder = safeSortOrder(searchParams.get('sort_order'))

    const cacheKey = cache.generateKey('/api/pcs', {
      page: page.toString(), limit: limitParam,
      search: search || null, sort_by: sortByParam, sort_order: sortOrder,
    })

    const cachedResponse = await cache.get<ApiResponse<PC>>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: { 'Cache-Control': 'private, no-store', 'X-Cache': 'HIT' },
      })
    }

    const where: any = {}
    if (search) {
      where.OR = [
        { merk: { contains: search, mode: 'insensitive' as const } },
        { untuk: { contains: search, mode: 'insensitive' as const } },
        { site: { contains: search, mode: 'insensitive' as const } },
        { prosesor: { contains: search, mode: 'insensitive' as const } },
      ]
    }

    const [pcs, total] = await Promise.all([
      prisma.pcs.findMany({
        where,
        select: {
          id: true, merk: true, prosesor: true, ssd_hdd: true, ram: true,
          monitor: true, printer: true, keyboard: true, ups: true,
          masuk: true, kirim: true, unit: true, untuk: true, site: true,
          departemen: true,
          po: true, status: true, kerusakan: true, surat_jalan: true,
          catatan: true, gambar: true, created_at: true, updated_at: true,
        },
        orderBy: [{ [sortBy]: sortOrder }, { id: 'desc' }],
        skip, take: limit,
      }),
      !isAll ? prisma.pcs.count({ where }) : Promise.resolve(0),
    ])

    const pcsTransformed = pcs.map(pc => ({
      id: pc.id, merk: pc.merk, prosesor: pc.prosesor, ssdHdd: pc.ssd_hdd,
      ram: pc.ram, monitor: pc.monitor, printer: pc.printer, keyboard: pc.keyboard,
      ups: pc.ups, masuk: pc.masuk, kirim: pc.kirim, unit: pc.unit,
      untuk: pc.untuk, site: pc.site, departemen: pc.departemen, po: pc.po, status: pc.status,
      kerusakan: pc.kerusakan, suratJalan: pc.surat_jalan, catatan: pc.catatan,
      gambar: pc.gambar, createdAt: pc.created_at, updatedAt: pc.updated_at,
    } as PC))

    const finalTotal = isAll ? pcsTransformed.length : total
    const responseData: ApiResponse<PC> = {
      data: pcsTransformed,
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
    logger.error('Error fetching pcs:', error)
    return handleDbError(error, 'mengambil data PCs')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = await validateRequest(pcSchema, body)
    if (!validation.success) return validation.response

    const {
      merk, prosesor, ssdHdd, ram, monitor, printer, keyboard, ups,
      masuk, kirim, unit, untuk, site, departemen, po, status, kerusakan,
      suratJalan, catatan, gambar,
    } = validation.data

    const convertedMasuk = convertToUTC8(masuk)
    if (!convertedMasuk) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Invalid date format for "masuk"' },
        { status: 400 }
      )
    }

    const pc = await prisma.pcs.create({
      data: {
        merk, prosesor, ssd_hdd: ssdHdd ?? '', ram: ram ?? '',
        monitor: monitor || null, printer: printer || null,
        keyboard: keyboard || null, ups: ups || null,
        masuk: convertedMasuk,
        kirim: kirim ? convertToUTC8(kirim) : undefined,
        unit: unit || null, untuk, site, departemen: departemen || null, po, status,
        kerusakan: kerusakan || null, surat_jalan: suratJalan || null,
        catatan: catatan || null, gambar: gambar || null,
      },
    })

    await cache.delete('/api/pcs')
    await invalidateDashboardCache()

    const user = await getSessionUser(request)
    logActivity({ entityType: 'pc', entityId: pc.id, action: 'CREATE', description: `Data PC "${pc.merk}" ditambahkan`, userId: user?.id, userName: user?.name })

    return NextResponse.json({
      id: pc.id, merk: pc.merk, prosesor: pc.prosesor, ssdHdd: pc.ssd_hdd,
      ram: pc.ram, monitor: pc.monitor, printer: pc.printer, keyboard: pc.keyboard,
      ups: pc.ups, masuk: pc.masuk, kirim: pc.kirim, unit: pc.unit,
      untuk: pc.untuk, site: pc.site, departemen: pc.departemen, po: pc.po, status: pc.status,
      kerusakan: pc.kerusakan, suratJalan: pc.surat_jalan, catatan: pc.catatan,
      gambar: pc.gambar, createdAt: pc.created_at, updatedAt: pc.updated_at,
    }, { status: 201 })
  } catch (error) {
    logger.error('Error creating pc:', error)
    return handleDbError(error, 'membuat PC')
  }
}
