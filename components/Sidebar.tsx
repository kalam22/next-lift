'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
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

export default function AppSidebar() {
    const [mounted, setMounted] = useState(false)
    const { state, isMobile, setOpenMobile } = useSidebar()
    // usePathname must be called at top level (hooks rule)
    const pathname = usePathname()

    useEffect(() => {
        setMounted(true)
    }, [])

    const navItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboard,
            color: 'text-primary',
        },
        {
            name: 'Data Lift',
            href: '/lifts',
            icon: Box,
            color: 'text-primary',
        },
        {
            name: 'Data Laptop',
            href: '/laptops',
            icon: Monitor,
            color: 'text-primary',
        },
        {
            name: 'Data PC',
            href: '/pcs',
            icon: MonitorSpeaker,
            color: 'text-primary',
        },
        {
            name: 'Data Mouse',
            href: '/mouse',
            icon: Mouse,
            color: 'text-primary',
        },
        {
            name: 'Data Monitor',
            href: '/monitor',
            icon: MonitorSpeaker,
            color: 'text-primary',
        },
        {
            name: 'Data UPS',
            href: '/ups',
            icon: Zap,
            color: 'text-primary',
        },
        {
            name: 'Data Printer',
            href: '/printer',
            icon: Printer,
            color: 'text-primary',
        },
        {
            name: 'Data Tools Jaringan',
            href: '/tools-jaringan',
            icon: Network,
            color: 'text-primary',
        },
        {
            name: 'Data CCTV',
            href: '/cctv',
            icon: Video,
            color: 'text-primary',
        },
        {
            name: 'Data Storage',
            href: '/storage',
            icon: Database,
            color: 'text-primary',
        },
        {
            name: 'Stock Move',
            href: '/stock-move',
            icon: ArrowLeftRight,
            color: 'text-primary',
        },
    ]

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
                                <span className="truncate font-black text-[#0f172a] dark:text-white tracking-widest uppercase">Management IT</span>
                                <span className="truncate text-[10px] font-bold text-primary uppercase tracking-widest">IT Support</span>
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
                            {navItems.map((item) => {
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
            </SidebarContent>

            <SidebarFooter className="p-6 pt-2 group-data-[collapsible=icon]:p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className={`premium-card p-3 flex items-center gap-3 rounded-[2rem] transition-all duration-300 group-data-[collapsible=icon]:!p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:border-none`}>
                            <div className="size-10 rounded-2xl bg-gradient-to-tr from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-white/50 dark:border-white/5 flex-shrink-0 flex items-center justify-center text-gray-400 font-black text-xs">
                                AD
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                <div className="flex items-center gap-1.5">
                                    <span className="truncate text-xs font-black text-[#0f172a] dark:text-white">Admin</span>
                                    <div className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                </div>
                                <span className="truncate text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Administrator</span>
                            </div>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
