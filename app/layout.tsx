import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import React from 'react'
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { WebVitals } from '@/components/WebVitals'
import AuthProvider from '@/components/AuthProvider'
import ConditionalLayout from '@/components/ConditionalLayout'

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
          <AuthProvider>
            <ErrorBoundary>
              <WebVitals />
              <ConditionalLayout>
                <main id="main-content">
                  {children}
                </main>
              </ConditionalLayout>
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
