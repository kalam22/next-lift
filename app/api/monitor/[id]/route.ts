import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { monitorSchema } from '@/lib/validations/monitor'
import { successResponse, errorResponse } from '@/lib/api-response'
import { validateRequest } from '@/lib/validation-helpers'
import { logger } from '@/lib/logger'
import { cache } from '@/lib/cache'
import { invalidateDashboardCache } from '@/lib/cache-invalidation'
import type { Monitor } from '@/types/entities'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const monitorId = parseInt(id)

    // Generate cache key
    const cacheKey = `/api/monitor/${monitorId}`

    // Check cache
    const cachedResponse = await cache.get<Monitor>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Cache': 'HIT',
        },
      })
    }

    const monitor = await prisma.monitor.findUnique({
      where: { id: monitorId },
    })

    if (!monitor) {
      return errorResponse('Monitor not found', 404)
    }

    // Cache the response (30 seconds TTL)
    await cache.set(cacheKey, monitor as Monitor, 30000)

    return NextResponse.json(monitor, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    logger.error('Error fetching monitor:', error)
    
    if (error instanceof Error && (error.name === 'PrismaClientInitializationError' || error.message.includes('Can\'t reach database server'))) {
      return errorResponse(
        'Database connection failed',
        503,
        'Cannot connect to database server. Please ensure PostgreSQL is running at localhost:5432'
      )
    }
    
    return errorResponse(
      'Failed to fetch monitor',
      500,
      error instanceof Error ? error.message : 'Unknown error'
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
    } = body

    // Get existing monitor to check for old photo
    const existingMonitor = await prisma.monitor.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existingMonitor) {
      return errorResponse('Monitor not found', 404)
    }

    // Validate request dengan Zod schema
    const validation = await validateRequest(monitorSchema, body)
    if (!validation.success) {
      return validation.response
    }
    
    const validatedData = validation.data

    // Delete old photo if a new one is uploaded or photo is removed
    if (existingMonitor.foto && (foto !== existingMonitor.foto || !foto)) {
      try {
        const oldPhotoPath = existingMonitor.foto.replace('/uploads/', '')
        const fullPath = join(process.cwd(), 'public', 'uploads', oldPhotoPath)
        if (existsSync(fullPath)) {
          await unlink(fullPath)
        }
      } catch (error) {
        logger.error('Error deleting old photo:', error)
        // Continue with update even if photo deletion fails
      }
    }

    const monitor = await prisma.monitor.update({
      where: { id: parseInt(id) },
      data: {
        brand: validatedData.brand.trim(),
        jumlahOrderan: validatedData.jumlahOrderan,
        diperuntukan: validatedData.diperuntukan.trim(),
        site: validatedData.site.trim(),
        nomorPO: validatedData.nomorPO.trim(),
        nomorSuratJalan: validatedData.nomorSuratJalan?.trim() || null,
        statusBarang: validatedData.statusBarang,
        tanggalMasuk: new Date(validatedData.tanggalMasuk),
        tanggalKirim: validatedData.tanggalKirim ? new Date(validatedData.tanggalKirim) : null,
        keterangan: validatedData.keterangan?.trim() || null,
        foto: validatedData.foto?.trim() || null,
        departemen: validatedData.departemen || null,
      },
    })

    // Invalidate cache
    await cache.delete(`/api/monitor/${id}`)
    await cache.delete('/api/monitor')
    await invalidateDashboardCache()

    return successResponse(monitor)
  } catch (error: unknown) {
    logger.error('Error updating monitor:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to update monitor', message: errorMessage },
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

    // Get monitor to check for photo
    const monitor = await prisma.monitor.findUnique({
      where: { id: parseInt(id) },
    })

    if (!monitor) {
      return errorResponse('Monitor not found', 404)
    }

    // Delete photo if exists
    if (monitor.foto) {
      try {
        const photoPath = monitor.foto.replace('/uploads/', '')
        const fullPath = join(process.cwd(), 'public', 'uploads', photoPath)
        if (existsSync(fullPath)) {
          await unlink(fullPath)
        }
      } catch (error) {
        logger.error('Error deleting photo:', error)
        // Continue with deletion even if photo deletion fails
      }
    }

    await prisma.monitor.delete({
      where: { id: parseInt(id) },
    })

    // Invalidate cache
    await cache.delete(`/api/monitor/${id}`)
    await cache.delete('/api/monitor')
    await invalidateDashboardCache()

    return successResponse({ message: 'Monitor deleted successfully' })
  } catch (error: unknown) {
    logger.error('Error deleting monitor:', error)
    
    if (error instanceof Error && (error.name === 'PrismaClientInitializationError' || error.message.includes('Can\'t reach database server'))) {
      return errorResponse(
        'Database connection failed',
        503,
        'Cannot connect to database server. Please ensure PostgreSQL is running at localhost:5432'
      )
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return errorResponse(
      'Failed to delete monitor',
      500,
      errorMessage
    )
  }
}

