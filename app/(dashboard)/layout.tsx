import { Metadata } from 'next'

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
  return children
}
