import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleDbError } from '@/lib/security'

// GET /api/pcs/navigation?id=123
// Returns { prevId, nextId, currentIndex, total }
export async function GET(request: NextRequest) {
  try {
    const id = parseInt(request.nextUrl.searchParams.get('id') || '0')
    if (!id) return NextResponse.json({ prevId: null, nextId: null }, { status: 400 })

    const all = await prisma.pcs.findMany({
      select: { id: true },
      orderBy: { created_at: 'desc' },
    })

    const ids = all.map(r => r.id)
    const index = ids.indexOf(id)

    if (index === -1) return NextResponse.json({ prevId: null, nextId: null, currentIndex: 0, total: ids.length })

    return NextResponse.json({
      prevId: index > 0 ? ids[index - 1] : null,
      nextId: index < ids.length - 1 ? ids[index + 1] : null,
      currentIndex: index + 1,
      total: ids.length,
    })
  } catch (error: unknown) {
    return handleDbError(error, 'mengambil navigasi pc')
  }
}
