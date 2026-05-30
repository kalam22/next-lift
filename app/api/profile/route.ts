import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { handleDbError } from '@/lib/security'

// GET — ambil data profil user yang sedang login
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await (prisma as any).user.findUnique({
      where: { id: Number(session.user.id) },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    return handleDbError(error, 'mengambil profil')
  }
}

// PUT — update username dan/atau password user yang sedang login
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { username, currentPassword, newPassword } = body

    const userId = Number(session.user.id)

    // Ambil user dari DB untuk verifikasi
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    const updateData: Record<string, any> = {}

    // Update username jika diisi
    if (username && username.trim()) {
      const normalized = username.toLowerCase().trim()

      // Cek apakah username sudah dipakai user lain
      const existing = await (prisma as any).user.findUnique({
        where: { username: normalized },
      })
      if (existing && existing.id !== userId) {
        return NextResponse.json(
          { error: 'Username sudah digunakan' },
          { status: 400 }
        )
      }

      updateData.username = normalized
    }

    // Update password jika diisi
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Password lama wajib diisi untuk mengubah password' },
          { status: 400 }
        )
      }

      const isValid = await bcrypt.compare(currentPassword, user.password)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Password lama tidak sesuai' },
          { status: 400 }
        )
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Password baru minimal 6 karakter' },
          { status: 400 }
        )
      }

      updateData.password = await bcrypt.hash(newPassword, 12)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data yang diubah' },
        { status: 400 }
      )
    }

    const updated = await (prisma as any).user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, username: true, role: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return handleDbError(error, 'mengupdate profil')
  }
}
