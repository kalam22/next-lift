import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import React from 'react'
import { ThemeProvider } from "@/components/theme-provider"

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
})

export const metadata: Metadata = {
  title: 'GPE - Management IT',
  description: 'Aplikasi manajemen & inventory IT',
}

import ClientLayout from '@/components/ClientLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { WebVitals } from '@/components/WebVitals'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${poppins.className} bg-[#FDFDFC] dark:bg-[#0a0a0a] text-[#1b1b18] dark:text-[#EDEDEC] min-h-screen`}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <WebVitals />
            <ClientLayout>
              <main id="main-content">
                {children}
              </main>
            </ClientLayout>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
