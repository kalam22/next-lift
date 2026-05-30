import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSuperAdminRole } from '@/lib/permissions'
import { handleDbError } from '@/lib/security'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isSuperAdminRole(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const id = parseInt(params.id)
    const user = await (prisma as any).user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        permissions: {
          select: { menu: true, permission: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    return handleDbError(error, 'mengambil detail user')
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

    const id = parseInt(params.id)
    const body = await request.json()
    const { name } = body

    const user = await (prisma as any).user.update({
      where: { id },
      data: { name },
      select: { id: true, name: true, username: true, role: true, isActive: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    return handleDbError(error, 'mengupdate user')
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isSuperAdminRole(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const id = parseInt(params.id)

    // Prevent super admin from deactivating themselves
    if (String(id) === session.user.id) {
      return NextResponse.json(
        { error: 'Tidak dapat menonaktifkan akun sendiri' },
        { status: 400 }
      )
    }

    const user = await (prisma as any).user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    const updated = await (prisma as any).user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, username: true, role: true, isActive: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return handleDbError(error, 'mengubah status user')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isSuperAdminRole(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const id = parseInt(params.id)

    // Prevent super admin from deleting themselves
    if (String(id) === session.user.id) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus akun sendiri' },
        { status: 400 }
      )
    }

    const user = await (prisma as any).user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Cascade delete will remove user_permissions automatically
    await (prisma as any).user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleDbError(error, 'menghapus user')
  }
}
