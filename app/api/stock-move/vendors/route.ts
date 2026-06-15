import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'
import { handleDbError } from '@/lib/security/security'

export async function GET() {
  try {
    const vendors = await prisma.stockVendor.findMany({ orderBy: { nama: 'asc' } })
    return NextResponse.json(vendors)
  } catch (error: unknown) {
    logger.error('Error fetching stock vendors:', error)
    return handleDbError(error, 'mengambil vendor')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const nama = body.nama ? String(body.nama).trim() : ''
    if (!nama) {
      return NextResponse.json({ error: 'Validation error', message: 'nama wajib diisi' }, { status: 400 })
    }
    const vendor = await prisma.stockVendor.upsert({
      where: { nama },
      update: {},
      create: { nama },
    })
    return NextResponse.json(vendor, { status: 201 })
  } catch (error: unknown) {
    logger.error('Error creating stock vendor:', error)
    return handleDbError(error, 'membuat vendor')
  }
}
