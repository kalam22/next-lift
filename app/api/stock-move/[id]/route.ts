import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'
import { handleDbError } from '@/lib/security/security'
import { logActivity } from '@/lib/activity-log'
import { getSessionUser } from '@/lib/get-session-user'
import { buildDiffDescription, formatDateForDiff } from '@/lib/utils/diff-fields'
import { cache, invalidateDashboardCache } from '@/lib/cache'

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

    const user = await getSessionUser(request)
    const oldTx = await (prisma as any).stockTransaction.findUnique({ where: { id: parseInt(id) }, select: { partType: true, tanggal: true, namaBarang: true, typeBarang: true, quality: true, vendorTujuan: true, keterangan: true } }).catch(() => null)
    const diffDesc = oldTx ? buildDiffDescription([
      { label: 'Tipe', oldValue: oldTx.partType, newValue: partType },
      { label: 'Tanggal', oldValue: formatDateForDiff(oldTx.tanggal), newValue: formatDateForDiff(new Date(tanggal)) },
      { label: 'Nama', oldValue: oldTx.namaBarang, newValue: namaBarang },
      { label: 'Type', oldValue: oldTx.typeBarang, newValue: typeBarang },
      { label: 'Qty', oldValue: oldTx.quality, newValue: quality },
      { label: 'Vendor', oldValue: oldTx.vendorTujuan, newValue: vendorTujuan },
      { label: 'Keterangan', oldValue: oldTx.keterangan, newValue: keterangan },
    ]) : null
    logActivity({
      entityType: 'stock_move',
      entityId: parseInt(id),
      action: 'UPDATE',
      description: diffDesc ?? `${partType} ${namaBarang} diperbarui`,
      userId: user?.id,
      userName: user?.name,
    })

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

    // Ambil data sebelum dihapus untuk log yang informatif
    const existing = await prisma.stockTransaction.findUnique({
      where: { id: parseInt(id) },
      select: { partType: true, namaBarang: true, typeBarang: true, quality: true, vendorTujuan: true },
    })

    await prisma.stockTransaction.delete({ where: { id: parseInt(id) } })
    await cache.delete('/api/stock-move')
    await invalidateDashboardCache()

    const user = await getSessionUser(request)
    const desc = existing
      ? `${existing.partType} ${existing.namaBarang} (${existing.typeBarang}) — ${existing.partType === 'MASUK' ? '+' : '-'}${existing.quality} unit${existing.vendorTujuan ? ` · ${existing.vendorTujuan}` : ''} dihapus`
      : 'Transaksi stok dihapus'
    logActivity({
      entityType: 'stock_move',
      entityId: parseInt(id),
      action: 'DELETE',
      description: desc,
      userId: user?.id,
      userName: user?.name,
    })

    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error: unknown) {
    logger.error('Error deleting stock transaction:', error)
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Not found', message: 'Transaksi tidak ditemukan' }, { status: 404 })
    }
    return handleDbError(error, 'menghapus transaksi stok')
  }
}
