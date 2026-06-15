import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { storageSchema } from '@/lib/validations/storage'
import { successResponse, errorResponse } from '@/lib/api-response'
import { validateRequest } from '@/lib/utils/helpers'
import { logger } from '@/lib/logger'
import { deleteImageFile } from '@/lib/utils/file'
import { logActivity } from '@/lib/activity-log'
import { getSessionUser } from '@/lib/get-session-user'
import { buildDiffDescription, formatDateForDiff } from '@/lib/utils/diff-fields'
import type { Storage } from '@/types/entities'
import { cache, invalidateDashboardCache } from '@/lib/cache'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storageId = parseInt(id)

    // Generate cache key
    const cacheKey = `/api/storage/${storageId}`

    // Check cache
    const cachedResponse = await cache.get<Storage>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Cache': 'HIT',
        },
      })
    }

    const storage = await prisma.storage.findUnique({
      where: { id: storageId },
    })

    if (!storage) {
      return errorResponse('Storage not found', 404)
    }

    // Cache the response (30 seconds TTL)
    await cache.set(cacheKey, storage as Storage, 30000)

    return NextResponse.json(storage, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    logger.error('Error fetching storage:', error)
    
    if (error instanceof Error && (error.name === 'PrismaClientInitializationError' || error.message.includes('Can\'t reach database server'))) {
      return errorResponse(
        'Database connection failed',
        503,
        'Cannot connect to database server. Please ensure PostgreSQL is running at localhost:5432'
      )
    }
    
    return errorResponse(
      'Failed to fetch storage',
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

    // Get existing storage to check for old photo
    const existingStorage = await prisma.storage.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existingStorage) {
      return errorResponse('Storage not found', 404)
    }

    // Validate request dengan Zod schema
    const validation = await validateRequest(storageSchema, body)
    if (!validation.success) {
      return validation.response
    }
    
    const validatedData = validation.data

    // Delete old photo if a new one is uploaded or photo is removed
    if (existingStorage.foto && (body.foto !== existingStorage.foto || !body.foto)) {
      try {
        const oldPhotoPath = existingStorage.foto.replace('/uploads/', '')
        const fullPath = join(process.cwd(), 'public', 'uploads', oldPhotoPath)
        if (existsSync(fullPath)) {
          await unlink(fullPath)
        }
      } catch (error) {
        logger.error('Error deleting old photo:', error)
        // Continue with update even if photo deletion fails
      }
    }

    const storage = await prisma.storage.update({
      where: { id: parseInt(id) },
      data: {
        brand: validatedData.brand.trim(),
        storage: validatedData.storage.trim(),
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
    await cache.delete(`/api/storage/${id}`)
    await cache.delete('/api/storage')
    await invalidateDashboardCache()

    const user = await getSessionUser(request)
    const diffDesc = buildDiffDescription([
      { label: 'Brand', oldValue: existingStorage.brand, newValue: validatedData.brand },
      { label: 'Site', oldValue: existingStorage.site, newValue: validatedData.site },
      { label: 'Departemen', oldValue: existingStorage.departemen, newValue: validatedData.departemen },
      { label: 'Status', oldValue: existingStorage.statusBarang, newValue: validatedData.statusBarang },
      { label: 'Storage', oldValue: existingStorage.storage, newValue: validatedData.storage },
      { label: 'Jumlah', oldValue: existingStorage.jumlahOrderan, newValue: validatedData.jumlahOrderan },
      { label: 'Diperuntukan', oldValue: existingStorage.diperuntukan, newValue: validatedData.diperuntukan },
      { label: 'Nomor PO', oldValue: existingStorage.nomorPO, newValue: validatedData.nomorPO },
      { label: 'Surat Jalan', oldValue: existingStorage.nomorSuratJalan, newValue: validatedData.nomorSuratJalan },
      { label: 'Keterangan', oldValue: existingStorage.keterangan, newValue: validatedData.keterangan },
      { label: 'Tgl Masuk', oldValue: formatDateForDiff(existingStorage.tanggalMasuk), newValue: formatDateForDiff(new Date(validatedData.tanggalMasuk)) },
      { label: 'Tgl Kirim', oldValue: formatDateForDiff(existingStorage.tanggalKirim), newValue: formatDateForDiff(validatedData.tanggalKirim ? new Date(validatedData.tanggalKirim) : null) },
      { label: 'Foto', oldValue: existingStorage.foto ? 'Ada' : '-', newValue: validatedData.foto ? (validatedData.foto !== existingStorage.foto ? 'Diperbarui' : 'Ada') : (existingStorage.foto ? 'Dihapus' : '-') },
    ])
    logActivity({ entityType: 'storage', entityId: parseInt(id), action: 'UPDATE', description: diffDesc ?? `Data Storage "${validatedData.brand}" diperbarui`, userId: user?.id, userName: user?.name })

    return successResponse(storage)
  } catch (error: unknown) {
    logger.error('Error updating storage:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to update storage', message: errorMessage },
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

    // Get storage to check for photo
    const storage = await prisma.storage.findUnique({
      where: { id: parseInt(id) },
    })

    if (!storage) {
      return errorResponse('Storage not found', 404)
    }

    // Delete photo if exists
    if (storage.foto) {
      try {
        const photoPath = storage.foto.replace('/uploads/', '')
        const fullPath = join(process.cwd(), 'public', 'uploads', photoPath)
        if (existsSync(fullPath)) {
          await unlink(fullPath)
        }
      } catch (error) {
        logger.error('Error deleting photo:', error)
        // Continue with deletion even if photo deletion fails
      }
    }

    await prisma.storage.delete({
      where: { id: parseInt(id) },
    })

    // Invalidate cache
    await cache.delete(`/api/storage/${id}`)
    await cache.delete('/api/storage')
    await invalidateDashboardCache()

    const user = await getSessionUser(request)
    logActivity({ entityType: 'storage', entityId: parseInt(id), action: 'DELETE', description: 'Data Storage dihapus', userId: user?.id, userName: user?.name })

    return successResponse({ message: 'Storage deleted successfully' })
  } catch (error: unknown) {
    logger.error('Error deleting storage:', error)
    
    if (error instanceof Error && (error.name === 'PrismaClientInitializationError' || error.message.includes('Can\'t reach database server'))) {
      return errorResponse(
        'Database connection failed',
        503,
        'Cannot connect to database server. Please ensure PostgreSQL is running at localhost:5432'
      )
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return errorResponse(
      'Failed to delete storage',
      500,
      errorMessage
    )
  }
}

