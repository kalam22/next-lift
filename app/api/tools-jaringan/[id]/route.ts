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
import type { ToolsJaringan } from '@/types/entities'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const toolsJaringanId = parseInt(id)

    // Generate cache key
    const cacheKey = `/api/tools-jaringan/${toolsJaringanId}`

    // Check cache
    const cachedResponse = await cache.get<ToolsJaringan>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Cache': 'HIT',
        },
      })
    }

    const toolsJaringan = await prisma.toolsJaringan.findUnique({
      where: { id: toolsJaringanId },
    })

    if (!toolsJaringan) {
      return NextResponse.json({ error: 'Tools Jaringan not found' }, { status: 404 })
    }

    // Cache the response (30 seconds TTL)
    await cache.set(cacheKey, toolsJaringan as ToolsJaringan, 30000)

    return NextResponse.json(toolsJaringan, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Cache': 'MISS',
      },
    })
  } catch (error: unknown) {
    logger.error('Error fetching tools jaringan:', error)
    
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
      { error: 'Failed to fetch tools jaringan', message: error instanceof Error ? error.message : 'Unknown error' },
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

    // Get existing tools jaringan to check for old photo
    const existingToolsJaringan = await prisma.toolsJaringan.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existingToolsJaringan) {
      return NextResponse.json({ error: 'Tools Jaringan not found' }, { status: 404 })
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
    if (existingToolsJaringan.foto && (foto !== existingToolsJaringan.foto || !foto)) {
      try {
        const oldPhotoPath = existingToolsJaringan.foto.replace('/uploads/', '')
        const fullPath = join(process.cwd(), 'public', 'uploads', oldPhotoPath)
        if (existsSync(fullPath)) {
          await unlink(fullPath)
        }
      } catch (error) {
        logger.error('Error deleting old photo:', error)
        // Continue with update even if photo deletion fails
      }
    }

    const toolsJaringan = await prisma.toolsJaringan.update({
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
    await cache.delete(`/api/tools-jaringan/${id}`)
    await cache.delete('/api/tools-jaringan')
    await invalidateDashboardCache()

    const user = await getSessionUser(request)
    const diffDesc = buildDiffDescription([
      { label: 'Brand', oldValue: existingToolsJaringan.brand, newValue: brand },
      { label: 'Site', oldValue: existingToolsJaringan.site, newValue: site },
      { label: 'Departemen', oldValue: existingToolsJaringan.departemen, newValue: departemen },
      { label: 'Status', oldValue: existingToolsJaringan.statusBarang, newValue: statusBarang },
      { label: 'Jumlah', oldValue: existingToolsJaringan.jumlahOrderan, newValue: jumlahOrderan },
      { label: 'Diperuntukan', oldValue: existingToolsJaringan.diperuntukan, newValue: diperuntukan },
      { label: 'Nomor PO', oldValue: existingToolsJaringan.nomorPO, newValue: nomorPO },
      { label: 'Surat Jalan', oldValue: existingToolsJaringan.nomorSuratJalan, newValue: nomorSuratJalan },
      { label: 'Keterangan', oldValue: existingToolsJaringan.keterangan, newValue: keterangan },
      { label: 'Tgl Masuk', oldValue: formatDateForDiff(existingToolsJaringan.tanggalMasuk), newValue: formatDateForDiff(tanggalMasukDate) },
      { label: 'Tgl Kirim', oldValue: formatDateForDiff(existingToolsJaringan.tanggalKirim), newValue: formatDateForDiff(tanggalKirimDate) },
      { label: 'Foto', oldValue: existingToolsJaringan.foto ? 'Ada' : '-', newValue: foto ? (foto !== existingToolsJaringan.foto ? 'Diperbarui' : 'Ada') : (existingToolsJaringan.foto ? 'Dihapus' : '-') },
    ])
    logActivity({ entityType: 'tools_jaringan', entityId: parseInt(id), action: 'UPDATE', description: diffDesc ?? `Data Tools Jaringan "${brand}" diperbarui`, userId: user?.id, userName: user?.name })

    return NextResponse.json(toolsJaringan)
  } catch (error: unknown) {
    logger.error('Error updating tools jaringan:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to update tools jaringan', message: errorMessage },
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
    const toolsJaringanId = parseInt(id)

    // Get tools jaringan data first to get image URL
    const toolsJaringan = await prisma.toolsJaringan.findUnique({
      where: { id: toolsJaringanId },
      select: { foto: true },
    })

    if (!toolsJaringan) {
      return NextResponse.json({ error: 'Tools Jaringan not found' }, { status: 404 })
    }

    // Delete tools jaringan record
    await prisma.toolsJaringan.delete({
      where: { id: toolsJaringanId },
    })

    // Delete associated image file if exists
    await deleteImageFile(toolsJaringan?.foto)

    // Invalidate cache
    await cache.delete(`/api/tools-jaringan/${id}`)
    await cache.delete('/api/tools-jaringan')
    await invalidateDashboardCache()

    const user = await getSessionUser(request)
    logActivity({ entityType: 'tools_jaringan', entityId: toolsJaringanId, action: 'DELETE', description: 'Data Tools Jaringan dihapus', userId: user?.id, userName: user?.name })

    return NextResponse.json({ message: 'Tools Jaringan deleted successfully' })
  } catch (error: unknown) {
    logger.error('Error deleting tools jaringan:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to delete tools jaringan', message: errorMessage },
      { status: 500 }
    )
  }
}

