'use client'

import { usePathname } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'

// Pages that should NOT have the sidebar layout
const NO_LAYOUT_PATHS = ['/login']

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isNoLayout = NO_LAYOUT_PATHS.some((p) => pathname.startsWith(p))

    if (isNoLayout) {
        return <>{children}</>
    }

    return <ClientLayout>{children}</ClientLayout>
}
