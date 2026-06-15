import { Metadata } from 'next'
import { DashboardLayoutClient } from '@/components/DashboardLayoutClient'

export const metadata: Metadata = {
  title: {
    template: '%s | Admin | GPE Management IT',
    default: 'User Management | Admin | GPE Management IT',
  },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
