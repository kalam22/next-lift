import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | GPE Management IT',
    default: 'Login | GPE Management IT',
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
