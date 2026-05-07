import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { cache } from '@/lib/cache'
import { invalidateDashboardCache } from '@/lib/cache-invalidation'
import { validateRequest } from '@/lib/validation-helpers'
import { laptopSchema } from '@/lib/validations/laptops'
import { handleDbError, safeErrorResponse } from '@/lib/security'
import { deleteImageFile, deletePdfFile } from '@/lib/fileUtils'
import type { Laptop } from '@/types/entities'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const laptopId = parseInt(id)

    // Generate cache key
    const cacheKey = `/api/laptops/${laptopId}`

    // Check cache
    const cachedResponse = await cache.get<Laptop>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Cache': 'HIT',
        },
      })
    }

    const laptop = await prisma.laptops.findUnique({
      where: { id: laptopId },
    })

    if (!laptop) {
      return NextResponse.json({ error: 'Laptop not found' }, { status: 404 })
    }

    // Transform snake_case to camelCase for frontend consistency
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

    // Cache the response (30 seconds TTL)
    await cache.set(cacheKey, transformed, 30000)

    return NextResponse.json(transformed, {
      headers: { 'Cache-Control': 'private, no-store', 'X-Cache': 'MISS' },
    })
  } catch (error: unknown) {
    logger.error('Error fetching laptop:', error)
    return handleDbError(error, 'mengambil laptop')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate with Zod schema
    const validation = await validateRequest(laptopSchema, body)
    if (!validation.success) {
      return validation.response
    }
    const {
      merk, prosesor, sn, ssdHdd, ram, monitor, printer, keyboard,
      masuk, kirim, unit, untuk, site, departemen, po, status, kerusakan,
      suratJalan, catatan, gambar, serahTerimaPdf,
    } = validation.data

    // Get old laptop data to check for file changes
    const oldLaptop = await prisma.laptops.findUnique({
      where: { id: parseInt(id) },
      select: { 
        serah_terima_pdf: true,
      },
    })

    // Check if PDF is being replaced or removed
    if (oldLaptop?.serah_terima_pdf && oldLaptop.serah_terima_pdf !== serahTerimaPdf) {
      // Delete old PDF file
      await deletePdfFile(oldLaptop.serah_terima_pdf)
    }

    const convertToUTC8 = (dateString: string): Date | undefined => {
      if (!dateString) return undefined
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return undefined
      const year = date.getFullYear(); const month = date.getMonth()
      const day = date.getDate(); const hour = date.getHours()
      const minute = date.getMinutes(); const second = date.getSeconds()
      const utcDate = new Date(Date.UTC(year, month, day, hour, minute, second))
      return new Date(utcDate.getTime() - (8 * 60 * 60 * 1000))
    }

    const updateData: any = {
      merk, prosesor,
      sn: sn || null, ssd_hdd: ssdHdd ?? '', ram: ram ?? '',
      monitor: monitor || null, printer: printer || null, keyboard: keyboard || null,
      unit: unit || null, untuk, site, departemen: departemen || null, po, status,
      kerusakan: kerusakan || null, surat_jalan: suratJalan || null,
      catatan: catatan || null, gambar: gambar || null,
      serah_terima_pdf: serahTerimaPdf || null,
    }

    if (masuk !== undefined) {
      const convertedMasuk = convertToUTC8(masuk)
      if (convertedMasuk !== undefined) updateData.masuk = convertedMasuk
    }
    if (kirim !== undefined) {
      updateData.kirim = kirim ? convertToUTC8(kirim) : undefined
    }

    const laptop = await prisma.laptops.update({
      where: { id: parseInt(id) },
      data: updateData,
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

    await cache.delete(`/api/laptops/${id}`)
    await cache.delete('/api/laptops')
    await invalidateDashboardCache()

    return NextResponse.json(transformed)
  } catch (error: unknown) {
    logger.error('Error updating laptop:', error)
    return handleDbError(error, 'mengupdate laptop')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const laptopId = parseInt(id)

    // Get laptop data first to get image and PDF URLs
    const laptop = await prisma.laptops.findUnique({
      where: { id: laptopId },
      select: { 
        gambar: true,
        serah_terima_pdf: true,
      },
    })

    // Delete laptop record
    await prisma.laptops.delete({
      where: { id: laptopId },
    })

    // Delete associated files if exist
    await deleteImageFile(laptop?.gambar)
    await deletePdfFile(laptop?.serah_terima_pdf)

    // Invalidate cache
    await cache.delete(`/api/laptops/${id}`)
    await cache.delete('/api/laptops')
    await invalidateDashboardCache()

    return NextResponse.json({ message: 'Laptop deleted successfully' })
  } catch (error: unknown) {
    logger.error('Error deleting laptop:', error)
    return handleDbError(error, 'menghapus laptop')
  }
}

