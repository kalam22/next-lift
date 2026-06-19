import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'
import { handleDbError } from '@/lib/security/security'
import { validatePcHistoryInput, formatPcHistoryResponse } from '@/lib/entities/pc-history'
import { cache, invalidateDashboardCache } from '@/lib/cache'
import { logActivity } from '@/lib/activity-log'
import { getSessionUser } from '@/lib/get-session-user'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; historyId: string }> }
) {
  try {
    const { id, historyId } = await params
    const pcId = parseInt(id)
    const hId = parseInt(historyId)
    const body = await request.json()

    const validation = validatePcHistoryInput(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation error', fields: validation.errors },
        { status: 400 }
      )
    }

    const { pic, tanggalTerima, site, departemen, keterangan } = validation.data

    const existing = await prisma.pcHistory.findUnique({ where: { id: hId } })
    if (!existing || existing.pc_id !== pcId) {
      return NextResponse.json({ error: 'History not found' }, { status: 404 })
    }

    const updated = await prisma.pcHistory.update({
      where: { id: hId },
      data: {
        pic,
        tanggal_terima: new Date(tanggalTerima),
        site,
        departemen: departemen || null,
        keterangan: keterangan || null,
      },
    })

    // If this is the latest history, also update the PC
    const latestHistory = await prisma.pcHistory.findFirst({
      where: { pc_id: pcId },
      orderBy: { tanggal_terima: 'desc' },
    })
    if (latestHistory && latestHistory.id === hId) {
      await prisma.pcs.update({
        where: { id: pcId },
        data: {
          untuk: pic,
          site,
          departemen: departemen || null,
        },
      })
    }

    await cache.delete(`/api/pcs/${id}`)
    await cache.delete('/api/pcs')
    await invalidateDashboardCache()

    const user = await getSessionUser(request)
    logActivity({
      entityType: 'pc_history',
      entityId: hId,
      action: 'UPDATE',
      description: `Histori PC #${pcId} diperbarui (PIC: ${pic})`,
      userId: user?.id,
      userName: user?.name,
    })

    return NextResponse.json(formatPcHistoryResponse(updated))
  } catch (error: unknown) {
    logger.error('Error updating pc history:', error)
    return handleDbError(error, 'memperbarui histori PC')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; historyId: string }> }
) {
  try {
    const { id, historyId } = await params
    const pcId = parseInt(id)
    const hId = parseInt(historyId)

    const existing = await prisma.pcHistory.findUnique({ where: { id: hId } })
    if (!existing || existing.pc_id !== pcId) {
      return NextResponse.json({ error: 'History not found' }, { status: 404 })
    }

    // Check if this is the latest history
    const latestHistory = await prisma.pcHistory.findFirst({
      where: { pc_id: pcId },
      orderBy: { tanggal_terima: 'desc' },
    })

    await prisma.pcHistory.delete({ where: { id: hId } })

    // If deleted was latest, rollback PC to previous history
    if (latestHistory && latestHistory.id === hId) {
      const prevHistory = await prisma.pcHistory.findFirst({
        where: { pc_id: pcId },
        orderBy: { tanggal_terima: 'desc' },
      })
      if (prevHistory) {
        await prisma.pcs.update({
          where: { id: pcId },
          data: {
            untuk: prevHistory.pic,
            site: prevHistory.site,
            departemen: prevHistory.departemen,
          },
        })
      }
    }

    await cache.delete(`/api/pcs/${id}`)
    await cache.delete('/api/pcs')
    await invalidateDashboardCache()

    const user = await getSessionUser(request)
    logActivity({
      entityType: 'pc_history',
      entityId: hId,
      action: 'DELETE',
      description: `Histori PC #${pcId} dihapus (PIC: ${existing.pic})`,
      userId: user?.id,
      userName: user?.name,
    })

    return NextResponse.json({ message: 'History deleted successfully' })
  } catch (error: unknown) {
    logger.error('Error deleting pc history:', error)
    return handleDbError(error, 'menghapus histori PC')
  }
}
