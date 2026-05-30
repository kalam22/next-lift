/**
 * Lightweight helper untuk mendapatkan user info dari JWT token
 * di API routes tanpa overhead penuh getServerSession.
 */

import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'

export interface SessionUser {
  id: number
  name: string
  username: string
}

export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })
    if (!token?.id) return null
    return {
      id: Number(token.id),
      name: (token.name as string) || '',
      username: (token.username as string) || '',
    }
  } catch {
    return null
  }
}