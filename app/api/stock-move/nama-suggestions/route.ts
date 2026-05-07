import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleDbError } from '@/lib/security'

// GET /api/stock-move/nama-suggestions?q=baterai&typeBarang=UPS
// Returns distinct namaBarang values matching the query (optionally filtered by typeBarang)
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim() || ''
    const typeBarang = request.nextUrl.searchParams.get('typeBarang')?.trim() || ''

    const where: Record<string, unknown> = {}
    if (q) where.namaBarang = { contains: q, mode: 'insensitive' }
    if (typeBarang) where.typeBarang = { equals: typeBarang, mode: 'insensitive' }

    const results = await prisma.stockTransaction.findMany({
      where,
      select: { namaBarang: true },
      distinct: ['namaBarang'],
      orderBy: { namaBarang: 'asc' },
      take: 10,
    })

    return NextResponse.json(results.map(r => r.namaBarang))
  } catch (error: unknown) {
    return handleDbError(error, 'mengambil saran nama barang')
  }
}
