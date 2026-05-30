import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email?: string | null
      image?: string | null
      username: string
      role: string
      permissions: Record<string, string[]>
      isActive: boolean
    }
  }

  interface User {
    id: string
    name: string
    username: string
    role: string
    permissions: Record<string, string[]>
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    role: string
    permissions: Record<string, string[]>
    isActive: boolean
  }
}
