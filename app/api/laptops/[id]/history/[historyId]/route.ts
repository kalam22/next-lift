import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'
import { handleDbError } from '@/lib/security/security'
import { validateHistoryInput, formatHistoryResponse } from '@/lib/entities/laptop-history'
import { cache, invalidateDashboardCache } from '@/lib/cache'
import { logActivity } from '@/lib/activity-log'
import { getSessionUser } from '@/lib/get-session-user'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; historyId: string }> }
) {
  try {
    const { id, historyId } = await params
    const laptopId = parseInt(id)
    const hId = parseInt(historyId)
    const body = await request.json()

    const validation = validateHistoryInput(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation error', fields: validation.errors },
        { status: 400 }
      )
    }

    const { pic, tanggalTerima, site, departemen, keterangan } = validation.data

    const existing = await prisma.laptopHistory.findUnique({ where: { id: hId } })
    if (!existing || existing.laptop_id !== laptopId) {
      return NextResponse.json({ error: 'History not found' }, { status: 404 })
    }

    const updated = await prisma.laptopHistory.update({
      where: { id: hId },
      data: {
        pic,
        tanggal_terima: new Date(tanggalTerima),
        site,
        departemen: departemen || null,
        keterangan: keterangan || null,
      },
    })

    // If this is the latest, sync to laptop
    const latestHistory = await prisma.laptopHistory.findFirst({
      where: { laptop_id: laptopId },
      orderBy: { tanggal_terima: 'desc' },
    })
    if (latestHistory && latestHistory.id === hId) {
      await prisma.laptops.update({
        where: { id: laptopId },
        data: {
          untuk: pic,
          site,
          departemen: departemen || null,
        },
      })
    }

    await cache.delete(`/api/laptops/${id}`)
    await cache.delete('/api/laptops')
    await invalidateDashboardCache()

    const user = await getSessionUser(request)
    logActivity({
      entityType: 'laptop_history',
      entityId: hId,
      action: 'UPDATE',
      description: `Histori Laptop #${laptopId} diperbarui (PIC: ${pic})`,
      userId: user?.id,
      userName: user?.name,
    })

    return NextResponse.json(formatHistoryResponse(updated))
  } catch (error: unknown) {
    logger.error('Error updating laptop history:', error)
    return handleDbError(error, 'memperbarui histori laptop')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; historyId: string }> }
) {
  try {
    const { id, historyId } = await params
    const laptopId = parseInt(id)
    const hId = parseInt(historyId)

    const existing = await prisma.laptopHistory.findUnique({ where: { id: hId } })
    if (!existing || existing.laptop_id !== laptopId) {
      return NextResponse.json({ error: 'History not found' }, { status: 404 })
    }

    const latestHistory = await prisma.laptopHistory.findFirst({
      where: { laptop_id: laptopId },
      orderBy: { tanggal_terima: 'desc' },
    })

    await prisma.laptopHistory.delete({ where: { id: hId } })

    // If deleted was latest, rollback laptop to previous history
    if (latestHistory && latestHistory.id === hId) {
      const prevHistory = await prisma.laptopHistory.findFirst({
        where: { laptop_id: laptopId },
        orderBy: { tanggal_terima: 'desc' },
      })
      if (prevHistory) {
        await prisma.laptops.update({
          where: { id: laptopId },
          data: {
            untuk: prevHistory.pic,
            site: prevHistory.site,
            departemen: prevHistory.departemen,
          },
        })
      }
    }

    await cache.delete(`/api/laptops/${id}`)
    await cache.delete('/api/laptops')
    await invalidateDashboardCache()

    const user = await getSessionUser(request)
    logActivity({
      entityType: 'laptop_history',
      entityId: hId,
      action: 'DELETE',
      description: `Histori Laptop #${laptopId} dihapus (PIC: ${existing.pic})`,
      userId: user?.id,
      userName: user?.name,
    })

    return NextResponse.json({ message: 'History deleted successfully' })
  } catch (error: unknown) {
    logger.error('Error deleting laptop history:', error)
    return handleDbError(error, 'menghapus histori laptop')
  }
}
