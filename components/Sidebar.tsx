'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import {
    Home,
    Monitor,
    ChevronLeft,
    Box,
    Mouse,
    MonitorSpeaker,
    Zap,
    Printer,
    Network,
    LayoutDashboard,
    Video,
    Database,
    ArrowLeftRight,
    Users,
    UserCircle,
    LogOut,
    ClipboardList,
} from 'lucide-react'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { getVisibleMenus, isSuperAdminRole } from '@/lib/permissions'

/** Derives display initials from a name string.
 *  - If the name has multiple words, takes the first letter of each word (up to 2).
 *  - Otherwise takes the first 2 characters.
 */
function getInitials(name?: string | null): string {
    if (!name) return '?'
    const words = name.trim().split(/\s+/)
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
}

export default function AppSidebar() {
    const [mounted, setMounted] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const { state, isMobile, setOpenMobile } = useSidebar()
    const pathname = usePathname()
    const router = useRouter()
    const { data: session } = useSession()

    useEffect(() => {
        setMounted(true)
    }, [])

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const navItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboard,
            color: 'text-primary',
            menuKey: 'dashboard',
        },
        {
            name: 'Data Lift',
            href: '/lifts',
            icon: Box,
            color: 'text-primary',
            menuKey: 'lifts',
        },
        {
            name: 'Data Laptop',
            href: '/laptops',
            icon: Monitor,
            color: 'text-primary',
            menuKey: 'laptops',
        },
        {
            name: 'Data PC',
            href: '/pcs',
            icon: MonitorSpeaker,
            color: 'text-primary',
            menuKey: 'pcs',
        },
        {
            name: 'Data Mouse',
            href: '/mouse',
            icon: Mouse,
            color: 'text-primary',
            menuKey: 'mouse',
        },
        {
            name: 'Data Monitor',
            href: '/monitor',
            icon: MonitorSpeaker,
            color: 'text-primary',
            menuKey: 'monitor',
        },
        {
            name: 'Data UPS',
            href: '/ups',
            icon: Zap,
            color: 'text-primary',
            menuKey: 'ups',
        },
        {
            name: 'Data Printer',
            href: '/printer',
            icon: Printer,
            color: 'text-primary',
            menuKey: 'printer',
        },
        {
            name: 'Data Tools Jaringan',
            href: '/tools-jaringan',
            icon: Network,
            color: 'text-primary',
            menuKey: 'tools_jaringan',
        },
        {
            name: 'Data CCTV',
            href: '/cctv',
            icon: Video,
            color: 'text-primary',
            menuKey: 'cctv',
        },
        {
            name: 'Data Storage',
            href: '/storage',
            icon: Database,
            color: 'text-primary',
            menuKey: 'storage',
        },
        {
            name: 'Stock Move',
            href: '/stock-move',
            icon: ArrowLeftRight,
            color: 'text-primary',
            menuKey: 'stock_move',
        },
        {
            name: 'Serah Terima',
            href: '/serah-terima',
            icon: ClipboardList,
            color: 'text-primary',
            menuKey: 'handover',
        },
    ]

    const visibleMenuKeys = getVisibleMenus(session)
    const visibleNavItems = navItems.filter((item) => visibleMenuKeys.includes(item.menuKey))

    // User Management — super_admin only, shown separately
    const showUserManagement = isSuperAdminRole(session?.user?.role)

    const userName = session?.user?.name
    const userRole = session?.user?.role
    const initials = getInitials(userName)

    return (
        <Sidebar collapsible="icon" className="border-none bg-transparent">
            {/* Custom Glass Background Container */}
            <div className="absolute inset-0 lg:shadow-xl overflow-hidden -z-10 bg-[#eef2f7] dark:bg-[#0f172a] border-r border-[#d1dae8] dark:border-[#1e293b]" />

            <SidebarHeader className="p-6 pb-2 group-data-[collapsible=icon]:p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sidebar-primary-foreground shadow-lg shadow-primary/30">
                                <span className="font-black text-xs tracking-tighter text-white">GPE</span>
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                <span className="truncate font-black text-[#0f172a] dark:text-white tracking-widest uppercase">Inventory</span>
                                <span className="truncate text-[10px] font-bold text-primary uppercase tracking-widest">Graha Prima Energy</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-4 py-2 custom-scrollbar group-data-[collapsible=icon]:px-2">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-2 group-data-[collapsible=icon]:hidden">
                        Main Menu
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {visibleNavItems.map((item) => {
                                const isActive = mounted && pathname === item.href
                                return (
                                    <SidebarMenuItem key={item.name}>
                                        <SidebarMenuButton
                                            asChild
                                            size="lg"
                                            onClick={() => isMobile && setOpenMobile(false)}
                                            className={`rounded-2xl transition-all duration-300 group hover:scale-[1.02] active:scale-95 mb-1 ${isActive
                                                ? "bg-white dark:bg-white/[0.05] shadow-[0_10px_25px_-5px_hsl(var(--primary)/0.15)] ring-1 ring-primary/10"
                                                : "hover:bg-white dark:hover:bg-white/5"
                                                }`}
                                            tooltip={item.name}
                                        >
                                            <Link href={item.href} className="flex items-center gap-3 py-1">
                                                <div className={`p-2 rounded-xl transition-colors flex-shrink-0 ${isActive ? item.color : "text-gray-400 dark:text-gray-500 group-hover:bg-primary/10 group-hover:text-primary"}`}>
                                                    <item.icon className="size-5" />
                                                </div>
                                                <span className={`font-bold transition-all duration-300 ${isActive ? "text-primary" : "text-gray-500 dark:text-gray-400 group-hover:text-primary"}`}>
                                                    {item.name}
                                                </span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* User Management — super_admin only */}
                {showUserManagement && (
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-2 group-data-[collapsible=icon]:hidden">
                            Admin
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        size="lg"
                                        onClick={() => isMobile && setOpenMobile(false)}
                                        className={`rounded-2xl transition-all duration-300 group hover:scale-[1.02] active:scale-95 mb-1 ${mounted && pathname.startsWith('/user-management')
                                            ? "bg-white dark:bg-white/[0.05] shadow-[0_10px_25px_-5px_hsl(var(--primary)/0.15)] ring-1 ring-primary/10"
                                            : "hover:bg-white dark:hover:bg-white/5"
                                            }`}
                                        tooltip="User Management"
                                    >
                                        <Link href="/user-management" className="flex items-center gap-3 py-1">
                                            <div className={`p-2 rounded-xl transition-colors flex-shrink-0 ${mounted && pathname.startsWith('/user-management') ? "text-primary" : "text-gray-400 dark:text-gray-500 group-hover:bg-primary/10 group-hover:text-primary"}`}>
                                                <Users className="size-5" />
                                            </div>
                                            <span className={`font-bold transition-all duration-300 ${mounted && pathname.startsWith('/user-management') ? "text-primary" : "text-gray-500 dark:text-gray-400 group-hover:text-primary"}`}>
                                                User Management
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter className="p-6 pt-2 group-data-[collapsible=icon]:p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div ref={dropdownRef} className="relative">
                            {/* Dropdown menu */}
                            {dropdownOpen && (
                                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 overflow-hidden z-50">
                                    <Link
                                        href="/profile"
                                        onClick={() => {
                                            setDropdownOpen(false)
                                            if (isMobile) setOpenMobile(false)
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                                            <UserCircle className="w-3.5 h-3.5 text-blue-500" />
                                        </div>
                                        <span className="text-xs font-bold text-[#0f172a] dark:text-white">Profil Saya</span>
                                    </Link>
                                    <div className="h-px bg-[#f1f5f9] dark:bg-[#334155] mx-3" />
                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false)
                                            signOut({ callbackUrl: '/login' })
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                    >
                                        <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10">
                                            <LogOut className="w-3.5 h-3.5 text-red-500" />
                                        </div>
                                        <span className="text-xs font-bold text-red-600 dark:text-red-400">Logout</span>
                                    </button>
                                </div>
                            )}

                            {/* Footer button */}
                            <button
                                onClick={() => setDropdownOpen((prev) => !prev)}
                                className={`premium-card p-3 flex items-center gap-3 rounded-[2rem] transition-all duration-300 w-full text-left group-data-[collapsible=icon]:!p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:border-none hover:opacity-80 active:scale-[0.98] cursor-pointer`}
                            >
                                <div className="size-10 rounded-2xl bg-gradient-to-tr from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-white/50 dark:border-white/5 flex-shrink-0 flex items-center justify-center text-gray-400 font-black text-xs">
                                    {initials}
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                    <div className="flex items-center gap-1.5">
                                        <span className="truncate text-xs font-black text-[#0f172a] dark:text-white">{userName ?? 'User'}</span>
                                        <div className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                    </div>
                                    <span className="truncate text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{userRole ?? '—'}</span>
                                </div>
                            </button>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
