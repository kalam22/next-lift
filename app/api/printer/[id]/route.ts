import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { logger } from '@/lib/logger'
import { cache } from '@/lib/cache'
import { invalidateDashboardCache } from '@/lib/cache-invalidation'
import type { Printer } from '@/types/entities'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const printerId = parseInt(id)

    // Generate cache key
    const cacheKey = `/api/printer/${printerId}`

    // Check cache
    const cachedResponse = await cache.get<Printer>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Cache': 'HIT',
        },
      })
    }

    const printer = await prisma.printer.findUnique({
      where: { id: printerId },
    })

    if (!printer) {
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 })
    }

    // Cache the response (30 seconds TTL)
    await cache.set(cacheKey, printer as Printer, 30000)

    return NextResponse.json(printer, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    logger.error('Error fetching printer:', error)
    
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
      { error: 'Failed to fetch printer', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Get existing printer to check for old photo
    const existingPrinter = await prisma.printer.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existingPrinter) {
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 })
    }

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

    // Delete old photo if a new one is uploaded or photo is removed
    if (existingPrinter.foto && (foto !== existingPrinter.foto || !foto)) {
      try {
        const oldPhotoPath = existingPrinter.foto.replace('/uploads/', '')
        const fullPath = join(process.cwd(), 'public', 'uploads', oldPhotoPath)
        if (existsSync(fullPath)) {
          await unlink(fullPath)
        }
      } catch (error) {
        logger.error('Error deleting old photo:', error)
        // Continue with update even if photo deletion fails
      }
    }

    const printer = await prisma.printer.update({
      where: { id: parseInt(id) },
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
    await cache.delete(`/api/printer/${id}`)
    await cache.delete('/api/printer')
    await invalidateDashboardCache()

    return NextResponse.json(printer)
  } catch (error: unknown) {
    logger.error('Error updating printer:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to update printer', message: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get printer to check for photo
    const printer = await prisma.printer.findUnique({
      where: { id: parseInt(id) },
    })

    if (!printer) {
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 })
    }

    // Delete photo if exists
    if (printer.foto) {
      try {
        const photoPath = printer.foto.replace('/uploads/', '')
        const fullPath = join(process.cwd(), 'public', 'uploads', photoPath)
        if (existsSync(fullPath)) {
          await unlink(fullPath)
        }
      } catch (error) {
        logger.error('Error deleting photo:', error)
        // Continue with deletion even if photo deletion fails
      }
    }

    await prisma.printer.delete({
      where: { id: parseInt(id) },
    })

    // Invalidate cache
    await cache.delete(`/api/printer/${id}`)
    await cache.delete('/api/printer')
    await invalidateDashboardCache()

    return NextResponse.json({ message: 'Printer deleted successfully' })
  } catch (error: unknown) {
    logger.error('Error deleting printer:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to delete printer', message: errorMessage },
      { status: 500 }
    )
  }
}

