import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'
import { deleteImageFile } from '@/lib/utils/file'
import { logActivity } from '@/lib/activity-log'
import { getSessionUser } from '@/lib/get-session-user'
import { buildDiffDescription, formatDateForDiff } from '@/lib/utils/diff-fields'
import type { PC } from '@/types/entities'
import { cache, invalidateDashboardCache } from '@/lib/cache'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pcId = parseInt(id)

    // Generate cache key
    const cacheKey = `/api/pcs/${pcId}`

    // Check cache
    const cachedResponse = await cache.get<PC>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Cache': 'HIT',
        },
      })
    }

    const pc = await prisma.pcs.findUnique({
      where: { id: pcId },
    })

    if (!pc) {
      return NextResponse.json({ error: 'PC not found' }, { status: 404 })
    }

    // Transform snake_case to camelCase for frontend consistency
    const transformed: PC = {
      id: pc.id,
      merk: pc.merk,
      prosesor: pc.prosesor,
      ssdHdd: pc.ssd_hdd,
      ram: pc.ram,
      monitor: pc.monitor,
      printer: pc.printer,
      keyboard: pc.keyboard,
      ups: pc.ups,
      masuk: pc.masuk,
      kirim: pc.kirim,
      unit: pc.unit,
      untuk: pc.untuk,
      site: pc.site,
      departemen: pc.departemen,
      po: pc.po,
      status: pc.status,
      kerusakan: pc.kerusakan,
      suratJalan: pc.surat_jalan,
      catatan: pc.catatan,
      gambar: pc.gambar,
      createdAt: pc.created_at,
      updatedAt: pc.updated_at,
    }

    return NextResponse.json(transformed)
  } catch (error) {
    logger.error('Error fetching pc:', error)
    
    // Check if it's a database connection error
    if (error instanceof Error && (error.name === 'PrismaClientInitializationError' || error.message.includes('Can\'t reach database server'))) {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          message: 'Cannot connect to database server. Please ensure PostgreSQL is running at localhost:5432',
          details: error.message
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch pc', message: error instanceof Error ? error.message : 'Unknown error' },
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
      merk,
      prosesor,
      ssdHdd,
      ram,
      monitor,
      printer,
      keyboard,
      ups,
      masuk,
      kirim,
      unit,
      untuk,
      site,
      departemen,
      po,
      status,
      kerusakan,
      suratJalan,
      catatan,
      gambar,
    } = body

    // Convert dates to UTC+8 (WITA) before saving to database
    // Input date is assumed to be in UTC+8 (WITA), convert to UTC for PostgreSQL storage
    const convertToUTC8 = (dateString: string): Date | undefined => {
      if (!dateString) return undefined
      // Parse the date string (assumed to be in UTC+8 format from frontend)
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return undefined
      
      // Get the date components as if they were in UTC+8
      // Extract year, month, day, hour, minute from the date string
      const dateObj = new Date(dateString)
      const year = dateObj.getFullYear()
      const month = dateObj.getMonth()
      const day = dateObj.getDate()
      const hour = dateObj.getHours()
      const minute = dateObj.getMinutes()
      const second = dateObj.getSeconds()
      
      // Create UTC date with UTC+8 time (treat input as UTC+8)
      // To store in UTC, we subtract 8 hours
      const utcDate = new Date(Date.UTC(year, month, day, hour, minute, second))
      // Subtract 8 hours to convert from UTC+8 to UTC for storage
      return new Date(utcDate.getTime() - (8 * 60 * 60 * 1000))
    }

    // Ambil data lama untuk diff
    const oldPc = await prisma.pcs.findUnique({
      where: { id: parseInt(id) },
      select: { merk: true, prosesor: true, ssd_hdd: true, ram: true, untuk: true, unit: true, site: true, departemen: true, status: true, masuk: true, kirim: true, po: true, surat_jalan: true, kerusakan: true, catatan: true, gambar: true },
    })

    // Build update data object conditionally
    const updateData: any = {
      prosesor,
      ssd_hdd: ssdHdd ?? '',
      ram: ram ?? '',
      monitor: monitor || null,
      printer: printer || null,
      keyboard: keyboard || null,
      ups: ups || null,
      unit: unit || null,
      untuk,
      site,
      departemen: departemen || null,
      po: parseInt(po),
      status,
      kerusakan: kerusakan || null,
      surat_jalan: suratJalan || null,
      catatan: catatan || null,
      gambar: gambar || null,
    }

    // Only update masuk if provided (it's required, so must be present)
    if (masuk !== undefined) {
      const convertedMasuk = convertToUTC8(masuk)
      if (convertedMasuk !== undefined) {
        updateData.masuk = convertedMasuk
      }
    }

    // Only update kirim if provided (it's optional)
    if (kirim !== undefined) {
      updateData.kirim = kirim ? convertToUTC8(kirim) : undefined
    }

    const pc = await prisma.pcs.update({
      where: { id: parseInt(id) },
      data: updateData,
    })

    // Transform snake_case to camelCase for frontend consistency
    const transformed = {
      id: pc.id,
      merk: pc.merk,
      prosesor: pc.prosesor,
      ssdHdd: pc.ssd_hdd,
      ram: pc.ram,
      monitor: pc.monitor,
      printer: pc.printer,
      keyboard: pc.keyboard,
      ups: pc.ups,
      masuk: pc.masuk,
      kirim: pc.kirim,
      unit: pc.unit,
      untuk: pc.untuk,
      site: pc.site,
      departemen: pc.departemen,
      po: pc.po,
      status: pc.status,
      kerusakan: pc.kerusakan,
      suratJalan: pc.surat_jalan,
      catatan: pc.catatan,
      gambar: pc.gambar,
      createdAt: pc.created_at,
      updatedAt: pc.updated_at,
    }

    const user = await getSessionUser(request)
    const diffDesc = oldPc ? buildDiffDescription([
      { label: 'Merk', oldValue: oldPc.merk, newValue: merk },
      { label: 'Untuk', oldValue: oldPc.untuk, newValue: untuk },
      { label: 'Unit', oldValue: oldPc.unit, newValue: unit },
      { label: 'Site', oldValue: oldPc.site, newValue: site },
      { label: 'Departemen', oldValue: oldPc.departemen, newValue: departemen },
      { label: 'Status', oldValue: oldPc.status, newValue: status },
      { label: 'Prosesor', oldValue: oldPc.prosesor, newValue: prosesor },
      { label: 'RAM', oldValue: oldPc.ram, newValue: ram },
      { label: 'Storage', oldValue: oldPc.ssd_hdd, newValue: ssdHdd },
      { label: 'Nomor PO', oldValue: oldPc.po?.toString(), newValue: po?.toString() },
      { label: 'Surat Jalan', oldValue: oldPc.surat_jalan, newValue: suratJalan },
      { label: 'Kerusakan', oldValue: oldPc.kerusakan, newValue: kerusakan },
      { label: 'Catatan', oldValue: oldPc.catatan, newValue: catatan },
      { label: 'Tgl Masuk', oldValue: formatDateForDiff(oldPc.masuk), newValue: masuk ? formatDateForDiff(new Date(masuk)) : '-' },
      { label: 'Tgl Kirim', oldValue: formatDateForDiff(oldPc.kirim), newValue: kirim ? formatDateForDiff(new Date(kirim)) : '-' },
      { label: 'Foto', oldValue: oldPc.gambar ? 'Ada' : '-', newValue: gambar ? (gambar !== oldPc.gambar ? 'Diperbarui' : 'Ada') : (oldPc.gambar ? 'Dihapus' : '-') },
    ]) : null
    logActivity({ entityType: 'pc', entityId: parseInt(id), action: 'UPDATE', description: diffDesc ?? `Data PC "${merk}" diperbarui`, userId: user?.id, userName: user?.name })
    return NextResponse.json(transformed)
  } catch (error) {
    logger.error('Error updating pc:', error)
    if (error instanceof Error && (error.name === 'PrismaClientInitializationError' || error.message.includes('Can\'t reach database server'))) {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          message: 'Cannot connect to database server. Please ensure PostgreSQL is running at localhost:5432',
          details: error.message
        },
        { status: 503 }
      )
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to update pc', message: errorMessage },
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
    const pcId = parseInt(id)

    // Get PC data first to get image URL
    const pc = await prisma.pcs.findUnique({
      where: { id: pcId },
      select: { gambar: true },
    })

    // Delete PC record
    await prisma.pcs.delete({
      where: { id: pcId },
    })

    // Delete associated image file if exists
    await deleteImageFile(pc?.gambar)

    // Invalidate cache
    await cache.delete(`/api/pcs/${id}`)
    await cache.delete('/api/pcs')
    await invalidateDashboardCache()

    const user = await getSessionUser(request)
    logActivity({ entityType: 'pc', entityId: pcId, action: 'DELETE', description: 'Data PC dihapus', userId: user?.id, userName: user?.name })

    return NextResponse.json({ message: 'PC deleted successfully' })
  } catch (error: unknown) {
    logger.error('Error deleting pc:', error)
    
    // Check if it's a database connection error
    if (error instanceof Error && (error.name === 'PrismaClientInitializationError' || error.message.includes('Can\'t reach database server'))) {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          message: 'Cannot connect to database server. Please ensure PostgreSQL is running at localhost:5432',
          details: error.message
        },
        { status: 503 }
      )
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to delete pc', message: errorMessage },
      { status: 500 }
    )
  }
}

