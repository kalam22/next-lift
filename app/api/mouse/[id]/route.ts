import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { logger } from '@/lib/logger'
import { cache } from '@/lib/cache'
import { invalidateDashboardCache } from '@/lib/cache-invalidation'
import type { Mouse } from '@/types/entities'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const mouseId = parseInt(id)

    // Generate cache key
    const cacheKey = `/api/mouse/${mouseId}`

    // Check cache
    const cachedResponse = await cache.get<Mouse>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Cache': 'HIT',
        },
      })
    }

    const mouse = await prisma.mouse.findUnique({
      where: { id: mouseId },
    })

    if (!mouse) {
      return NextResponse.json({ error: 'Mouse not found' }, { status: 404 })
    }

    // Cache the response (30 seconds TTL)
    await cache.set(cacheKey, mouse as Mouse, 30000)

    return NextResponse.json(mouse, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    logger.error('Error fetching mouse:', error)
    
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
      { error: 'Failed to fetch mouse', message: error instanceof Error ? error.message : 'Unknown error' },
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

    // Get existing mouse to check for old photo
    const existingMouse = await prisma.mouse.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existingMouse) {
      return NextResponse.json({ error: 'Mouse not found' }, { status: 404 })
    }

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

    // Delete old photo if a new one is uploaded or photo is removed
    if (existingMouse.foto && (foto !== existingMouse.foto || !foto)) {
      try {
        // Extract filename from path (handle both /uploads/filename.jpg and /uploads/filename formats)
        let oldPhotoPath = existingMouse.foto
        if (oldPhotoPath.startsWith('/uploads/')) {
          oldPhotoPath = oldPhotoPath.replace('/uploads/', '')
        } else if (oldPhotoPath.startsWith('uploads/')) {
          oldPhotoPath = oldPhotoPath.replace('uploads/', '')
        }
        
        const fullPath = join(process.cwd(), 'public', 'uploads', oldPhotoPath)
        if (existsSync(fullPath)) {
          await unlink(fullPath)
          logger.log(`✅ Deleted old photo: ${oldPhotoPath}`)
        }
      } catch (error) {
        logger.error('Error deleting old photo:', error)
        // Continue with update even if photo deletion fails
      }
    }

    const mouse = await prisma.mouse.update({
      where: { id: parseInt(id) },
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

    // Invalidate cache
    await cache.delete(`/api/mouse/${id}`)
    await cache.delete('/api/mouse')
    await invalidateDashboardCache()

    return NextResponse.json(mouse)
  } catch (error: unknown) {
    logger.error('Error updating mouse:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to update mouse', message: errorMessage },
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

    const mouse = await prisma.mouse.findUnique({
      where: { id: parseInt(id) },
    })

    if (!mouse) {
      return NextResponse.json({ error: 'Mouse not found' }, { status: 404 })
    }

    // Delete photo if exists
    if (mouse.foto) {
      try {
        // Extract filename from path (handle both /uploads/filename.jpg and /uploads/filename formats)
        let photoPath = mouse.foto
        if (photoPath.startsWith('/uploads/')) {
          photoPath = photoPath.replace('/uploads/', '')
        } else if (photoPath.startsWith('uploads/')) {
          photoPath = photoPath.replace('uploads/', '')
        }
        
        const fullPath = join(process.cwd(), 'public', 'uploads', photoPath)
        if (existsSync(fullPath)) {
          await unlink(fullPath)
          logger.log(`✅ Deleted photo: ${photoPath}`)
        }
      } catch (error) {
        logger.error('Error deleting photo:', error)
        // Continue with deletion even if photo deletion fails
      }
    }

    await prisma.mouse.delete({
      where: { id: parseInt(id) },
    })

    // Invalidate cache
    await cache.delete(`/api/mouse/${id}`)
    await cache.delete('/api/mouse')
    await invalidateDashboardCache()

    return NextResponse.json({ message: 'Mouse deleted successfully' })
  } catch (error: unknown) {
    logger.error('Error deleting mouse:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to delete mouse', message: errorMessage },
      { status: 500 }
    )
  }
}

