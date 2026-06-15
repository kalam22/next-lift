import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import React from 'react'
import { ProvidersLayout } from '@/components/ProvidersLayout'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
})

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FDFDFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'GPE - Management IT',
  description: 'Aplikasi manajemen & inventory IT — tracking aset, monitoring stok, dan serah terima perangkat.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'GPE - Management IT',
    description: 'Aplikasi manajemen & inventory IT',
    type: 'website',
    locale: 'id_ID',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'GPE Management IT',
    description: 'Aplikasi manajemen & inventory IT — tracking aset, monitoring stok, dan serah terima perangkat.',
    url: process.env.NEXT_PUBLIC_APP_URL || '',
  })

  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${poppins.className} bg-[#FDFDFC] dark:bg-[#0a0a0a] text-[#1b1b18] dark:text-[#EDEDEC] min-h-screen`}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <ProvidersLayout>
          {children}
        </ProvidersLayout>
      </body>
    </html>
  )
}
