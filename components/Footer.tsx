'use client'

import React from 'react'

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="mt-auto py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-100 dark:border-white/5">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col items-center md:items-start gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#0f172a] dark:text-white tracking-widest uppercase">
                            IT Infrastruktur
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                            v1.0
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                        Inventory System
                    </p>
                </div>

                <div className="flex items-center gap-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span className="hover:text-primary cursor-pointer transition-colors">
                        &copy; {currentYear} KALAM
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                    <span className="hover:text-primary cursor-pointer transition-colors">
                        System Status: <span className="text-primary">Online</span>
                    </span>
                </div>
            </div>
        </footer>
    )
}
