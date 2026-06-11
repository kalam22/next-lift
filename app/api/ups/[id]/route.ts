import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { logger } from '@/lib/logger'
import { cache } from '@/lib/cache'
import { invalidateDashboardCache } from '@/lib/cache-invalidation'
import { deleteImageFile } from '@/lib/fileUtils'
import { logActivity } from '@/lib/activity-log'
import { getSessionUser } from '@/lib/get-session-user'
import { buildDiffDescription, formatDateForDiff } from '@/lib/diff-fields'
import type { Ups } from '@/types/entities'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const upsId = parseInt(id)

    // Generate cache key
    const cacheKey = `/api/ups/${upsId}`

    // Check cache
    const cachedResponse = await cache.get<Ups>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Cache': 'HIT',
        },
      })
    }

    const ups = await prisma.ups.findUnique({
      where: { id: upsId },
    })

    if (!ups) {
      return NextResponse.json({ error: 'UPS not found' }, { status: 404 })
    }

    // Cache the response (30 seconds TTL)
    await cache.set(cacheKey, ups as Ups, 30000)

    return NextResponse.json(ups, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    logger.error('Error fetching ups:', error)
    
    if (error instanceof Error && (error.name === 'PrismaClientInitializationError' || error.message.includes('Can\'t reach database server'))) {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          message: 'Cannot connect to database server. Please ensure PostgreSQL is running at localhost:5432',
        },
        { status: 503 }
      )
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch ups', message: errorMessage },
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
      dayaVa,
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

    // Get existing ups to check for old photo
    const existingUps = await prisma.ups.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existingUps) {
      return NextResponse.json({ error: 'UPS not found' }, { status: 404 })
    }

    // Validate required fields
    if (!brand || !brand.trim()) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Brand is required' },
        { status: 400 }
      )
    }
    // Jumlah Orderan is optional, but if provided must be a valid number
    let jumlahOrderanValue = 0
    if (jumlahOrderan !== null && jumlahOrderan !== undefined && jumlahOrderan !== '') {
      const parsed = parseInt(String(jumlahOrderan))
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json(
          { error: 'Validation error', message: 'Jumlah Orderan must be a valid positive number' },
          { status: 400 }
        )
      }
      jumlahOrderanValue = parsed
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
    if (existingUps.foto && (foto !== existingUps.foto || !foto)) {
      try {
        const oldPhotoPath = existingUps.foto.replace('/uploads/', '')
        const fullPath = join(process.cwd(), 'public', 'uploads', oldPhotoPath)
        if (existsSync(fullPath)) {
          await unlink(fullPath)
        }
      } catch (error) {
        logger.error('Error deleting old photo:', error)
        // Continue with update even if photo deletion fails
      }
    }

    const ups = await prisma.ups.update({
      where: { id: parseInt(id) },
      data: {
        brand: brand.trim(),
        dayaVa: dayaVa?.trim() || null,
        jumlahOrderan: jumlahOrderanValue,
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

    // Invalidate cache
    await cache.delete(`/api/ups/${id}`)
    await cache.delete('/api/ups')
    await invalidateDashboardCache()

    const user = await getSessionUser(request)
    const diffDesc = buildDiffDescription([
      { label: 'Brand', oldValue: existingUps.brand, newValue: brand },
      { label: 'Site', oldValue: existingUps.site, newValue: site },
      { label: 'Departemen', oldValue: existingUps.departemen, newValue: departemen },
      { label: 'Status', oldValue: existingUps.statusBarang, newValue: statusBarang },
      { label: 'Daya VA', oldValue: existingUps.dayaVa, newValue: dayaVa },
      { label: 'Jumlah', oldValue: existingUps.jumlahOrderan, newValue: jumlahOrderan },
      { label: 'Diperuntukan', oldValue: existingUps.diperuntukan, newValue: diperuntukan },
      { label: 'Nomor PO', oldValue: existingUps.nomorPO, newValue: nomorPO },
      { label: 'Surat Jalan', oldValue: existingUps.nomorSuratJalan, newValue: nomorSuratJalan },
      { label: 'Keterangan', oldValue: existingUps.keterangan, newValue: keterangan },
      { label: 'Tgl Masuk', oldValue: formatDateForDiff(existingUps.tanggalMasuk), newValue: formatDateForDiff(tanggalMasukDate) },
      { label: 'Tgl Kirim', oldValue: formatDateForDiff(existingUps.tanggalKirim), newValue: formatDateForDiff(tanggalKirimDate) },
      { label: 'Foto', oldValue: existingUps.foto ? 'Ada' : '-', newValue: foto ? (foto !== existingUps.foto ? 'Diperbarui' : 'Ada') : (existingUps.foto ? 'Dihapus' : '-') },
    ])
    logActivity({ entityType: 'ups', entityId: parseInt(id), action: 'UPDATE', description: diffDesc ?? `Data UPS "${brand}" diperbarui`, userId: user?.id, userName: user?.name })

    return NextResponse.json(ups)
  } catch (error: unknown) {
    logger.error('Error updating ups:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to update ups', message: errorMessage },
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
    const upsId = parseInt(id)

    // Get ups data first to get image URL
    const ups = await prisma.ups.findUnique({
      where: { id: upsId },
      select: { foto: true },
    })

    if (!ups) {
      return NextResponse.json({ error: 'UPS not found' }, { status: 404 })
    }

    // Delete ups record
    await prisma.ups.delete({
      where: { id: upsId },
    })

    // Delete associated image file if exists
    await deleteImageFile(ups?.foto)

    // Invalidate cache
    await cache.delete(`/api/ups/${id}`)
    await cache.delete('/api/ups')
    await invalidateDashboardCache()

    const user = await getSessionUser(request)
    logActivity({ entityType: 'ups', entityId: upsId, action: 'DELETE', description: 'Data UPS dihapus', userId: user?.id, userName: user?.name })

    return NextResponse.json({ message: 'UPS deleted successfully' })
  } catch (error: unknown) {
    logger.error('Error deleting ups:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to delete ups', message: errorMessage },
      { status: 500 }
    )
  }
}

