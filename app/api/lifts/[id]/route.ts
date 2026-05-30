import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { cache } from '@/lib/cache'
import { validateRequest } from '@/lib/validation-helpers'
import { liftSchema } from '@/lib/validations/lifts'
import { handleDbError } from '@/lib/security'
import { logActivity } from '@/lib/activity-log'
import { getSessionUser } from '@/lib/get-session-user'
import type { Lift } from '@/types/lift'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const liftId = parseInt(id)

    // Generate cache key
    const cacheKey = `/api/lifts/${liftId}`

    // Check cache
    const cachedResponse = await cache.get<Lift>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Cache': 'HIT',
        },
      })
    }

    const lift = await prisma.lifts.findUnique({
      where: { id: liftId },
    })

    if (!lift) {
      return NextResponse.json({ error: 'Lift not found' }, { status: 404 })
    }

    let aksesArray: number[] = []
    try {
      aksesArray = lift.akses ? JSON.parse(lift.akses).map(Number) : []
    } catch (e) {
      aksesArray = []
    }

    // Transform snake_case to camelCase for frontend consistency
    const transformed: Lift = {
      id: lift.id,
      nama: lift.nama,
      pt: lift.pt,
      departemen: lift.departemen,
      berlaku: lift.berlaku,
      akses: lift.akses,
      created_at: lift.created_at,
      updated_at: lift.updated_at,
      aksesArray,
    }

    // Cache the response (30 seconds TTL)
    await cache.set(cacheKey, transformed, 30000)
    
    return NextResponse.json(transformed, {
      headers: { 'Cache-Control': 'private, no-store', 'X-Cache': 'MISS' },
    })
  } catch (error) {
    logger.error('Error fetching lift:', error)
    return handleDbError(error, 'mengambil lift')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const validation = await validateRequest(liftSchema, body)
    if (!validation.success) return validation.response

    const { nama, pt, departemen, berlaku, akses } = validation.data

    // Ambil data lama sebelum update untuk diff
    const oldLift = await prisma.lifts.findUnique({ where: { id: parseInt(id) } })

    const lift = await prisma.lifts.update({
      where: { id: parseInt(id) },
      data: {
        nama, pt,
        departemen: departemen || null,
        berlaku: berlaku ? new Date(berlaku) : null,
        akses: akses ? JSON.stringify(akses) : null,
      },
    })

    await cache.delete(`/api/lifts/${id}`)
    await cache.deleteByPrefix('/api/lifts')

    // Buat deskripsi perubahan yang detail
    const changes: string[] = []
    if (oldLift) {
      if (oldLift.nama !== nama) changes.push(`Nama: "${oldLift.nama}" → "${nama}"`)
      if (oldLift.pt !== pt) changes.push(`PT: "${oldLift.pt}" → "${pt}"`)
      if ((oldLift.departemen || '') !== (departemen || '')) changes.push(`Departemen: "${oldLift.departemen || '-'}" → "${departemen || '-'}"`)

      // Bandingkan akses lantai
      const oldAkses = oldLift.akses ? JSON.parse(oldLift.akses).map(Number).sort() : []
      const newAkses = akses ? [...akses].map(Number).sort() : []
      const oldStr = oldAkses.length ? `Lantai ${oldAkses.join(', ')}` : 'Tidak ada'
      const newStr = newAkses.length ? `Lantai ${newAkses.join(', ')}` : 'Tidak ada'
      if (JSON.stringify(oldAkses) !== JSON.stringify(newAkses)) changes.push(`Akses: ${oldStr} → ${newStr}`)

      // Bandingkan masa berlaku
      const oldBerlaku = oldLift.berlaku ? new Date(oldLift.berlaku).toLocaleDateString('id-ID') : 'Permanen'
      const newBerlaku = berlaku ? new Date(berlaku).toLocaleDateString('id-ID') : 'Permanen'
      if (oldBerlaku !== newBerlaku) changes.push(`Masa Berlaku: ${oldBerlaku} → ${newBerlaku}`)
    }

    const description = changes.length > 0
      ? changes.join(' · ')
      : `Data lift "${nama}" diperbarui`

    const user = await getSessionUser(request)
    logActivity({
      entityType: 'lift',
      entityId: parseInt(id),
      action: 'UPDATE',
      description,
      userId: user?.id,
      userName: user?.name,
    })

    return NextResponse.json(lift)
  } catch (error) {
    logger.error('Error updating lift:', error)
    return handleDbError(error, 'mengupdate lift')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.lifts.delete({ where: { id: parseInt(id) } })

    await cache.delete(`/api/lifts/${id}`)
    await cache.deleteByPrefix('/api/lifts')

    const user = await getSessionUser(request)
    logActivity({
      entityType: 'lift',
      entityId: parseInt(id),
      action: 'DELETE',
      description: 'Data lift dihapus',
      userId: user?.id,
      userName: user?.name,
    })

    return NextResponse.json({ message: 'Lift deleted successfully' })
  } catch (error) {
    logger.error('Error deleting lift:', error)
    return handleDbError(error, 'menghapus lift')
  }
}

