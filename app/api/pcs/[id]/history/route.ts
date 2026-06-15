import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'
import { handleDbError } from '@/lib/security/security'
import { validatePcHistoryInput, formatPcHistoryResponse } from '@/lib/entities/pc-history'
import { cache, invalidateDashboardCache } from '@/lib/cache'

const convertToUTC8 = (dateString: string): Date => {
  const date = new Date(dateString)
  const year = date.getFullYear(); const month = date.getMonth()
  const day = date.getDate()
  const utcDate = new Date(Date.UTC(year, month, day, 0, 0, 0))
  return new Date(utcDate.getTime() - (8 * 60 * 60 * 1000))
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pcId = parseInt(id)

    const pc = await prisma.pcs.findUnique({ where: { id: pcId } })
    if (!pc) {
      return NextResponse.json({ error: 'PC not found' }, { status: 404 })
    }

    const histories = await prisma.pcHistory.findMany({
      where: { pc_id: pcId },
      orderBy: { tanggal_terima: 'desc' },
    })

    return NextResponse.json(histories.map(formatPcHistoryResponse))
  } catch (error: unknown) {
    logger.error('Error fetching pc history:', error)
    return handleDbError(error, 'mengambil histori PC')
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pcId = parseInt(id)
    const body = await request.json()

    const validation = validatePcHistoryInput(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation error', fields: validation.errors },
        { status: 400 }
      )
    }

    const { pic, tanggalTerima, site, departemen, keterangan } = validation.data

    const pc = await prisma.pcs.findUnique({ where: { id: pcId } })
    if (!pc) {
      return NextResponse.json({ error: 'PC not found' }, { status: 404 })
    }

    const existingCount = await prisma.pcHistory.count({ where: { pc_id: pcId } })

    const history = await prisma.$transaction(async (tx) => {
      // First entry: save original PC data before overwriting
      if (existingCount === 0) {
        await tx.pcHistory.create({
          data: {
            pc_id: pcId,
            pic: pc.untuk,
            tanggal_terima: pc.masuk,
            site: pc.site,
            departemen: pc.departemen || null,
            keterangan: 'Data awal perangkat',
          },
        })
      }

      const newHistory = await tx.pcHistory.create({
        data: {
          pc_id: pcId,
          pic,
          tanggal_terima: new Date(tanggalTerima),
          site,
          departemen: departemen || null,
          keterangan: keterangan || null,
        },
      })

      await tx.pcs.update({
        where: { id: pcId },
        data: {
          untuk: pic,
          site,
          departemen: departemen || null,
          kirim: convertToUTC8(tanggalTerima),
        },
      })

      return newHistory
    })

    await cache.delete(`/api/pcs/${id}`)
    await cache.delete('/api/pcs')
    await invalidateDashboardCache()

    return NextResponse.json(formatPcHistoryResponse(history), { status: 201 })
  } catch (error: unknown) {
    logger.error('Error creating pc history:', error)
    return handleDbError(error, 'membuat histori PC')
  }
}
