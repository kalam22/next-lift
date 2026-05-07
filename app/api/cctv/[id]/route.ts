import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { cctvSchema } from '@/lib/validations/cctv'
import { successResponse, errorResponse } from '@/lib/api-response'
import { validateRequest } from '@/lib/validation-helpers'
import { logger } from '@/lib/logger'
import { cache } from '@/lib/cache'
import { invalidateDashboardCache } from '@/lib/cache-invalidation'
import { deleteImageFile } from '@/lib/fileUtils'
import type { Cctv } from '@/types/entities'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cctvId = parseInt(id)

    // Generate cache key
    const cacheKey = `/api/cctv/${cctvId}`

    // Check cache
    const cachedResponse = await cache.get<Cctv>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Cache': 'HIT',
        },
      })
    }

    const cctv = await prisma.cctv.findUnique({
      where: { id: cctvId },
    })

    if (!cctv) {
      return errorResponse('CCTV not found', 404)
    }

    // Cache the response (30 seconds TTL)
    await cache.set(cacheKey, cctv as Cctv, 30000)

    return NextResponse.json(cctv, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    logger.error('Error fetching cctv:', error)
    
    if (error instanceof Error && (error.name === 'PrismaClientInitializationError' || error.message.includes('Can\'t reach database server'))) {
      return errorResponse(
        'Database connection failed',
        503,
        'Cannot connect to database server. Please ensure PostgreSQL is running at localhost:5432'
      )
    }
    
    return errorResponse(
      'Failed to fetch cctv',
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

    // Get existing cctv to check for old photo
    const existingCctv = await prisma.cctv.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existingCctv) {
      return errorResponse('CCTV not found', 404)
    }

    // Validate request dengan Zod schema
    const validation = await validateRequest(cctvSchema, body)
    if (!validation.success) {
      return validation.response
    }
    
    const validatedData = validation.data

    // Delete old photo if a new one is uploaded or photo is removed
    if (existingCctv.foto && (body.foto !== existingCctv.foto || !body.foto)) {
      try {
        const oldPhotoPath = existingCctv.foto.replace('/uploads/', '')
        const fullPath = join(process.cwd(), 'public', 'uploads', oldPhotoPath)
        if (existsSync(fullPath)) {
          await unlink(fullPath)
        }
      } catch (error) {
        logger.error('Error deleting old photo:', error)
        // Continue with update even if photo deletion fails
      }
    }

    const cctv = await prisma.cctv.update({
      where: { id: parseInt(id) },
      data: {
        brand: validatedData.brand.trim(),
        storage: validatedData.storage?.trim() || null,
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
    await cache.delete(`/api/cctv/${id}`)
    await cache.delete('/api/cctv')
    await invalidateDashboardCache()

    return successResponse(cctv)
  } catch (error: unknown) {
    logger.error('Error updating cctv:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to update cctv', message: errorMessage },
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
    const cctvId = parseInt(id)

    // Get cctv data first to get image URL
    const cctv = await prisma.cctv.findUnique({
      where: { id: cctvId },
      select: { foto: true },
    })

    if (!cctv) {
      return errorResponse('CCTV not found', 404)
    }

    // Delete cctv record
    await prisma.cctv.delete({
      where: { id: cctvId },
    })

    // Delete associated image file if exists
    await deleteImageFile(cctv?.foto)

    // Invalidate cache
    await cache.delete(`/api/cctv/${id}`)
    await cache.delete('/api/cctv')
    await invalidateDashboardCache()

    return successResponse({ message: 'CCTV deleted successfully' })
  } catch (error: unknown) {
    logger.error('Error deleting cctv:', error)
    
    if (error instanceof Error && (error.name === 'PrismaClientInitializationError' || error.message.includes('Can\'t reach database server'))) {
      return errorResponse(
        'Database connection failed',
        503,
        'Cannot connect to database server. Please ensure PostgreSQL is running at localhost:5432'
      )
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return errorResponse(
      'Failed to delete cctv',
      500,
      errorMessage
    )
  }
}

