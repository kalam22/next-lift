import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { getActivityLogs } from '@/lib/activity-log'
import { handleDbError } from '@/lib/security/security'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityIdParam = searchParams.get('entityId')

    if (!entityType) {
      return NextResponse.json(
        { error: 'entityType wajib diisi' },
        { status: 400 }
      )
    }

    // Jika entityId tidak diberikan, ambil semua log untuk entityType tersebut
    const where = entityIdParam
      ? { entityType, entityId: parseInt(entityIdParam) }
      : { entityType }

    const logs = await (prisma as any).activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        action: true,
        description: true,
        userName: true,
        userId: true,
        createdAt: true,
      },
    })
    return NextResponse.json(logs)
  } catch (error) {
    return handleDbError(error, 'mengambil activity log')
  }
}
