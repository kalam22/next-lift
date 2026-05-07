import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { handleDbError } from '@/lib/security'

export async function GET() {
  try {
    const types = await prisma.stockItemType.findMany({ orderBy: { nama: 'asc' } })
    return NextResponse.json(types)
  } catch (error: unknown) {
    logger.error('Error fetching stock item types:', error)
    return handleDbError(error, 'mengambil tipe barang')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const nama = body.nama ? String(body.nama).trim() : ''
    if (!nama) {
      return NextResponse.json({ error: 'Validation error', message: 'nama wajib diisi' }, { status: 400 })
    }
    const type = await prisma.stockItemType.upsert({
      where: { nama },
      update: {},
      create: { nama },
    })
    return NextResponse.json(type, { status: 201 })
  } catch (error: unknown) {
    logger.error('Error creating stock item type:', error)
    return handleDbError(error, 'membuat tipe barang')
  }
}
