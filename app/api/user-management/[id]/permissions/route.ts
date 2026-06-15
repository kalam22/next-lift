import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { buildPermissionsMap, isSuperAdminRole } from '@/lib/security/permissions'
import { handleDbError } from '@/lib/security/security'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isSuperAdminRole(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = parseInt(params.id)
    const rows = await (prisma as any).userPermission.findMany({
      where: { userId },
      select: { menu: true, permission: true },
    })

    return NextResponse.json({ permissions: buildPermissionsMap(rows) })
  } catch (error) {
    return handleDbError(error, 'mengambil permissions user')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isSuperAdminRole(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = parseInt(params.id)
    const body = await request.json()
    const { permissions } = body as { permissions: Record<string, string[]> }

    // Build flat rows from permissions map
    const rows: { userId: number; menu: string; permission: string }[] = []
    for (const [menu, perms] of Object.entries(permissions)) {
      for (const perm of perms) {
        rows.push({ userId, menu, permission: perm })
      }
    }

    // Replace all permissions in a transaction
    await (prisma as any).$transaction([
      (prisma as any).userPermission.deleteMany({ where: { userId } }),
      ...(rows.length > 0
        ? [(prisma as any).userPermission.createMany({ data: rows })]
        : []),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleDbError(error, 'menyimpan permissions user')
  }
}
