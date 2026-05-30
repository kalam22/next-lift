import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { normalizeUsername, isSuperAdminRole } from '@/lib/permissions'
import { handleDbError } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isSuperAdminRole(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await (prisma as any).user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { permissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: users })
  } catch (error) {
    return handleDbError(error, 'mengambil daftar user')
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isSuperAdminRole(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, username, password, permissions } = body

    if (!name || !username || !password) {
      return NextResponse.json({ error: 'Nama, username, dan password wajib diisi' }, { status: 400 })
    }

    const normalizedUsername = normalizeUsername(username)

    // Check username uniqueness
    const existing = await (prisma as any).user.findUnique({
      where: { username: normalizedUsername },
    })
    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user + permissions in one transaction
    const user = await (prisma as any).$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          name,
          username: normalizedUsername,
          password: hashedPassword,
          role: 'user',
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      })

      // Save permissions if provided
      if (permissions && typeof permissions === 'object') {
        const rows: { userId: number; menu: string; permission: string }[] = []
        for (const [menu, perms] of Object.entries(permissions as Record<string, string[]>)) {
          for (const perm of perms) {
            rows.push({ userId: newUser.id, menu, permission: perm })
          }
        }
        if (rows.length > 0) {
          await tx.userPermission.createMany({ data: rows })
        }
      }

      return newUser
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    return handleDbError(error, 'membuat user')
  }
}
