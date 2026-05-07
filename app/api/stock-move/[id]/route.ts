import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { cache } from '@/lib/cache'
import { invalidateDashboardCache } from '@/lib/cache-invalidation'
import { handleDbError } from '@/lib/security'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { partType, tanggal, namaBarang, typeBarang, quality, vendorTujuan, keterangan } = body

    if (!partType || !['MASUK', 'KELUAR'].includes(partType)) {
      return NextResponse.json({ error: 'Validation error', message: "partType harus 'MASUK' atau 'KELUAR'" }, { status: 400 })
    }
    if (!tanggal || !namaBarang?.trim() || !typeBarang?.trim()) {
      return NextResponse.json({ error: 'Validation error', message: 'Field wajib tidak boleh kosong' }, { status: 400 })
    }
    if (!Number.isInteger(quality) || quality <= 0) {
      return NextResponse.json({ error: 'Validation error', message: 'quality harus integer positif' }, { status: 400 })
    }

    const transaction = await prisma.stockTransaction.update({
      where: { id: parseInt(id) },
      data: {
        partType,
        tanggal: new Date(tanggal),
        namaBarang: namaBarang.trim(),
        typeBarang: typeBarang.trim(),
        quality,
        vendorTujuan: vendorTujuan ? String(vendorTujuan).trim() : null,
        keterangan: keterangan ? String(keterangan).trim() : null,
      },
    })

    await cache.delete('/api/stock-move')
    await invalidateDashboardCache()

    return NextResponse.json(transaction)
  } catch (error: unknown) {
    logger.error('Error updating stock transaction:', error)
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Not found', message: 'Transaksi tidak ditemukan' }, { status: 404 })
    }
    return handleDbError(error, 'mengubah transaksi stok')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.stockTransaction.delete({ where: { id: parseInt(id) } })
    await cache.delete('/api/stock-move')
    await invalidateDashboardCache()
    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error: unknown) {
    logger.error('Error deleting stock transaction:', error)
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Not found', message: 'Transaksi tidak ditemukan' }, { status: 404 })
    }
    return handleDbError(error, 'menghapus transaksi stok')
  }
}
