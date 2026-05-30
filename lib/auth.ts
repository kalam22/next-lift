import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { normalizeUsername, buildPermissionsMap } from '@/lib/permissions'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Username dan password wajib diisi')
        }

        const user = await (prisma as any).user.findUnique({
          where: { username: normalizeUsername(credentials.username) },
        })

        if (!user) {
          throw new Error('Username atau password salah')
        }

        if (!user.isActive) {
          throw new Error('Akun Anda tidak aktif. Hubungi administrator.')
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) {
          throw new Error('Username atau password salah')
        }

        return {
          id: String(user.id),
          name: user.name,
          email: '',
          username: user.username,
          role: user.role,
          permissions: {},
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Initial sign-in: populate token from user object
        token.id = user.id
        token.username = (user as any).username
        token.role = (user as any).role
        token.isActive = true

        // Query permissions from DB and build the permissions map
        // Wrapped in try/catch in case Prisma client hasn't been regenerated yet
        try {
          const rows = await (prisma as any).userPermission.findMany({
            where: { userId: Number(user.id) },
          })
          token.permissions = buildPermissionsMap(rows)
        } catch {
          token.permissions = {}
        }
      } else {
        // Subsequent requests: re-check isActive and permissions from DB
        // This ensures deactivated users are blocked and permission changes take effect immediately
        try {
          const dbUser = await (prisma as any).user.findUnique({
            where: { id: Number(token.id) },
            select: { isActive: true },
          })
          token.isActive = dbUser?.isActive ?? false

          // Re-fetch permissions so changes by admin take effect without re-login
          const rows = await (prisma as any).userPermission.findMany({
            where: { userId: Number(token.id) },
          })
          token.permissions = buildPermissionsMap(rows)
        } catch {
          // If DB check fails, keep existing values
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = token.role as string
        session.user.permissions = token.permissions as Record<string, string[]>
        session.user.isActive = token.isActive as boolean
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
}
