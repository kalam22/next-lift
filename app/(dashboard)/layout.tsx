import { Metadata } from 'next'
import { DashboardLayoutClient } from '@/components/DashboardLayoutClient'

export const metadata: Metadata = {
  title: {
    template: '%s | GPE Management IT',
    default: 'Dashboard | GPE Management IT',
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
