import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { handleDbError } from '@/lib/security/security'

// GET /api/cctv/navigation?id=123
// Returns { prevId, nextId, currentIndex, total }
export async function GET(request: NextRequest) {
  try {
    const id = parseInt(request.nextUrl.searchParams.get('id') || '0')
    if (!id) return NextResponse.json({ prevId: null, nextId: null }, { status: 400 })

    const all = await prisma.cctv.findMany({
      select: { id: true },
      orderBy: { createdAt: 'desc' },
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
    return handleDbError(error, 'mengambil navigasi cctv')
  }
}
