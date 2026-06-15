'use client'

import React from 'react'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import AppSidebar from '@/components/Sidebar'
import { ModeToggle } from '@/components/mode-toggle'
import Footer from '@/components/Footer'

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-[#FDFDFC] dark:bg-[#0a0a0a]">
        <AppSidebar />

        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          {/* Mobile top bar */}
          <div className="flex items-center gap-4 px-4 py-3 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-[#f1f5f9] dark:border-[#1e293b] lg:hidden shrink-0">
            <SidebarTrigger aria-label="Buka menu" className="w-9 h-9 text-gray-500 hover:text-primary transition-colors" />
            <span className="font-bold text-sm text-[#0f172a] dark:text-white">Menu</span>
            <div className="ml-auto">
              <ModeToggle />
            </div>
          </div>

          {/* Desktop top bar */}
          <div className="hidden lg:flex items-center gap-3 px-6 py-3 shrink-0">
            <SidebarTrigger aria-label="Toggle sidebar" className="w-8 h-8 text-gray-400 hover:text-primary transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-[#1e293b]" />
            <div className="ml-auto">
              <ModeToggle />
            </div>
          </div>

          {/* Scrollable content */}
          <main id="main-content" className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8 flex flex-col min-h-full">
              <div className="max-w-7xl mx-auto w-full flex-1">
                {children}
              </div>
              <Footer />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
