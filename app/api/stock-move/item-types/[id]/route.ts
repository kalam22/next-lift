import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { handleDbError } from '@/lib/security'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.stockItemType.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (error: unknown) {
    logger.error('Error deleting stock item type:', error)
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return handleDbError(error, 'menghapus tipe barang')
  }
}
