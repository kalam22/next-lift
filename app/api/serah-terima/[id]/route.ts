import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { cache } from '@/lib/cache'
import { validateRequest } from '@/lib/validation-helpers'
import { handoverSchema } from '@/lib/validations/handover'
import { handleDbError } from '@/lib/security'
import { logActivity } from '@/lib/activity-log'
import { getSessionUser } from '@/lib/get-session-user'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const handoverId = parseInt(id)

    const cacheKey = `/api/serah-terima/${handoverId}`

    const cachedResponse = await cache.get<any>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Cache': 'HIT',
        },
      })
    }

    const handover = await prisma.handover.findUnique({
      where: { id: handoverId },
    })

    if (!handover) {
      return NextResponse.json({ error: 'Data serah terima tidak ditemukan' }, { status: 404 })
    }

    await cache.set(cacheKey, handover, 30000)
    
    return NextResponse.json(handover, {
      headers: { 'Cache-Control': 'private, no-store', 'X-Cache': 'MISS' },
    })
  } catch (error) {
    logger.error('Error fetching handover:', error)
    return handleDbError(error, 'mengambil data serah terima')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const validation = await validateRequest(handoverSchema, body)
    if (!validation.success) return validation.response

    const { tanggal, barang, pic, site, namaPenerima, ttd } = validation.data
    const handoverId = parseInt(id)

    const oldHandover = await prisma.handover.findUnique({ where: { id: handoverId } })

    const handover = await prisma.handover.update({
      where: { id: handoverId },
      data: {
        tanggal: new Date(tanggal),
        barang,
        pic,
        site,
        namaPenerima,
        ttd: ttd || null,
      },
    })

    await cache.delete(`/api/serah-terima/${id}`)
    await cache.deleteByPrefix('/api/serah-terima')

    const changes: string[] = []
    if (oldHandover) {
      if (oldHandover.barang !== barang) changes.push(`Barang: "${oldHandover.barang}" → "${barang}"`)
      if (oldHandover.pic !== pic) changes.push(`PIC: "${oldHandover.pic}" → "${pic}"`)
      if (oldHandover.site !== site) changes.push(`Site: "${oldHandover.site}" → "${site}"`)
      if (oldHandover.namaPenerima !== namaPenerima) changes.push(`Nama Penerima: "${oldHandover.namaPenerima}" → "${namaPenerima}"`)
      if (new Date(oldHandover.tanggal).getTime() !== new Date(tanggal).getTime()) {
        changes.push(`Tanggal: "${new Date(oldHandover.tanggal).toLocaleDateString('id-ID')}" → "${new Date(tanggal).toLocaleDateString('id-ID')}"`)
      }
      if ((oldHandover.ttd || '') !== (ttd || '')) changes.push(`TTD: "${oldHandover.ttd || '-'}" → "${ttd || '-'}"`)
    }

    const description = changes.length > 0
      ? changes.join(' · ')
      : `Data serah terima PIC "${pic}" diperbarui`

    const user = await getSessionUser(request)
    logActivity({
      entityType: 'handover',
      entityId: handoverId,
      action: 'UPDATE',
      description,
      userId: user?.id,
      userName: user?.name,
    })

    return NextResponse.json(handover)
  } catch (error) {
    logger.error('Error updating handover:', error)
    return handleDbError(error, 'mengupdate serah terima')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const handoverId = parseInt(id)

    await prisma.handover.delete({ where: { id: handoverId } })

    await cache.delete(`/api/serah-terima/${id}`)
    await cache.deleteByPrefix('/api/serah-terima')

    const user = await getSessionUser(request)
    logActivity({
      entityType: 'handover',
      entityId: handoverId,
      action: 'DELETE',
      description: 'Data serah terima dihapus',
      userId: user?.id,
      userName: user?.name,
    })

    return NextResponse.json({ message: 'Handover deleted successfully' })
  } catch (error) {
    logger.error('Error deleting handover:', error)
    return handleDbError(error, 'menghapus serah terima')
  }
}
