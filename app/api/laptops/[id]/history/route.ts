import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { handleDbError } from '@/lib/security'
import { validateHistoryInput, formatHistoryResponse } from '@/lib/laptop-history'
import { cache } from '@/lib/cache'
import { invalidateDashboardCache } from '@/lib/cache-invalidation'

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
    const laptopId = parseInt(id)

    // Check if laptop exists
    const laptop = await prisma.laptops.findUnique({ where: { id: laptopId } })
    if (!laptop) {
      return NextResponse.json({ error: 'Laptop not found' }, { status: 404 })
    }

    // Fetch history ordered by tanggal_terima descending
    const histories = await prisma.laptopHistory.findMany({
      where: { laptop_id: laptopId },
      orderBy: { tanggal_terima: 'desc' },
    })

    return NextResponse.json(histories.map(formatHistoryResponse))
  } catch (error: unknown) {
    logger.error('Error fetching laptop history:', error)
    return handleDbError(error, 'mengambil histori laptop')
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const laptopId = parseInt(id)
    const body = await request.json()

    // Validate input
    const validation = validateHistoryInput(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation error', fields: validation.errors },
        { status: 400 }
      )
    }

    const { pic, tanggalTerima, site, departemen, keterangan } = validation.data

    // Check if laptop exists
    const laptop = await prisma.laptops.findUnique({ where: { id: laptopId } })
    if (!laptop) {
      return NextResponse.json({ error: 'Laptop not found' }, { status: 404 })
    }

    // Check if this is the first history entry for this laptop
    const existingCount = await prisma.laptopHistory.count({
      where: { laptop_id: laptopId },
    })

    // Run everything in a single transaction
    const history = await prisma.$transaction(async (tx) => {
      // If this is the first entry, save the original laptop data (pemegang pertama) first
      if (existingCount === 0) {
        await tx.laptopHistory.create({
          data: {
            laptop_id: laptopId,
            pic: laptop.untuk,
            tanggal_terima: laptop.masuk, // Use masuk as the original assignment date
            site: laptop.site,
            departemen: laptop.departemen || null,
            keterangan: 'Data awal perangkat',
          },
        })
      }

      // Create the new history entry
      const newHistory = await tx.laptopHistory.create({
        data: {
          laptop_id: laptopId,
          pic,
          tanggal_terima: new Date(tanggalTerima),
          site,
          departemen: departemen || null,
          keterangan: keterangan || null,
        },
      })

      // Update the laptop's current data
      await tx.laptops.update({
        where: { id: laptopId },
        data: {
          untuk: pic,
          site,
          departemen: departemen || null,
          kirim: convertToUTC8(tanggalTerima),
        },
      })

      return newHistory
    })

    // Invalidate cache
    await cache.delete(`/api/laptops/${id}`)
    await cache.delete('/api/laptops')
    await invalidateDashboardCache()

    return NextResponse.json(formatHistoryResponse(history), { status: 201 })
  } catch (error: unknown) {
    logger.error('Error creating laptop history:', error)
    return handleDbError(error, 'membuat histori laptop')
  }
}
