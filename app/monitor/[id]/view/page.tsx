'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import axios from 'axios'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Swal from 'sweetalert2'
import { logger } from '@/lib/logger'
import MetadataCard from '@/components/MetadataCard'
import type { Monitor } from '@/types/entities'

interface NavInfo {
  prevId: number | null
  nextId: number | null
  currentIndex: number
  total: number
}

export default function ViewMonitor() {
    const router = useRouter()
    const params = useParams()
    const [monitor, setMonitor] = useState<Monitor | null>(null)
    const [loading, setLoading] = useState(true)
    const [nav, setNav] = useState<NavInfo>({ prevId: null, nextId: null, currentIndex: 0, total: 0 })

    const fetchMonitor = useCallback(async () => {
        try {
            const [monitorRes, navRes] = await Promise.all([
                axios.get<Monitor>(`/api/monitor/${params.id}`),
                axios.get<NavInfo>(`/api/monitor/navigation?id=${params.id}`),
            ])
            setMonitor(monitorRes.data)
            setNav(navRes.data)
        } catch (error: unknown) {
            logger.error('Error fetching monitor:', error)
            await Swal.fire({
                title: 'Gagal!',
                text: 'Gagal memuat data monitor',
                icon: 'error',
                confirmButtonText: 'OK',
                buttonsStyling: false,
                customClass: {
                    popup: '!rounded-2xl',
                    title: '!font-bold',
                    confirmButton: 'swal2-confirm',
                },
            })
        } finally {
            setLoading(false)
        }
    }, [params.id, router])

    useEffect(() => {
        fetchMonitor()
        const interval = setInterval(() => { fetchMonitor() }, 5000)
        return () => clearInterval(interval)
    }, [fetchMonitor])

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Menyiapkan informasi perangkat...</p>
            </div>
        )
    }

    if (!monitor) return null

    // Function to format date only (without time) - read raw from database, add 8 hours
    const formatDateWITA = (dateInput: string | Date) => {
        if (!dateInput) return '-'
        
        // Convert to Date if it's a string
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return '-'
        }
        
        // Database stores in UTC (we subtracted 8 hours during save)
        // Add 8 hours back to get UTC+8 time
        const witaDate = new Date(date.getTime() + (8 * 60 * 60 * 1000))
        
        // Format the UTC+8 date
        return format(witaDate, 'dd MMM yyyy', { locale: id })
    }

    const SpecItem = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
        <div className="p-4 rounded-2xl bg-gray-50/50 dark:bg-[#0f172a]/40 border border-[#f1f5f9] dark:border-[#334155] flex flex-col gap-1 group hover:border-primary/30 transition-all">
            <div className="flex items-center gap-2 text-gray-400 group-hover:text-primary transition-colors">
                {icon && <div className="text-gray-400 group-hover:text-primary transition-colors">{icon}</div>}
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-sm font-bold text-[#0f172a] dark:text-white uppercase truncate">{value || '-'}</span>
        </div>
    )

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center justify-center sm:justify-start gap-5">
                    <Link href="/monitor" className="p-2.5 text-gray-400 hover:text-primary hover:bg-white dark:hover:bg-[#1e293b] rounded-2xl border border-transparent hover:border-[#f1f5f9] dark:hover:border-[#334155] transition-all shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tighter uppercase">{monitor.brand}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-bold text-primary uppercase tracking-widest">{monitor.diperuntukan}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                            <span className="text-xs font-medium text-gray-400">Order: {monitor.jumlahOrderan} Unit</span>
                            {nav.total > 0 && (
                                <span className="text-xs font-medium text-gray-400">{nav.currentIndex} / {nav.total}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Prev / Next navigation */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => nav.prevId && router.push(`/monitor/${nav.prevId}/view`)}
                            disabled={!nav.prevId}
                            title="Data sebelumnya"
                            className="p-2.5 bg-white dark:bg-[#1e293b] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl text-gray-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button
                            onClick={() => nav.nextId && router.push(`/monitor/${nav.nextId}/view`)}
                            disabled={!nav.nextId}
                            title="Data selanjutnya"
                            className="p-2.5 bg-white dark:bg-[#1e293b] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl text-gray-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        monitor.statusBarang?.toUpperCase() === 'BARU'
                            ? 'bg-green-50 dark:bg-green-500/10 text-green-600 border-green-100 dark:border-green-900/40'
                            : monitor.statusBarang?.toUpperCase() === 'SECOND'
                            ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 border-yellow-100 dark:border-yellow-900/40'
                            : monitor.statusBarang?.toUpperCase() === 'SERVICE'
                            ? 'bg-red-50 dark:bg-red-500/10 text-red-600 border-red-100 dark:border-red-900/40'
                            : 'bg-gray-50 dark:bg-gray-500/10 text-gray-600 border-gray-100 dark:border-gray-900/40'
                    }`}>
                        {monitor.statusBarang || '-'}
                    </span>
                    <Link href={`/monitor/${monitor.id}/edit`} className="px-6 py-2.5 bg-white dark:bg-[#1e293b] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all shadow-sm">
                        Edit Perangkat
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden p-3">
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-[#0f172a] group">
                            {monitor.foto ? (
                                <Image 
                                    src={monitor.foto} 
                                    alt={monitor.brand} 
                                    fill 
                                    className="object-cover"
                                    priority
                                    placeholder="blur"
                                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+"
                                    unoptimized={monitor.foto?.startsWith('/')}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                    <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-4">No Image Available</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm p-8 space-y-6">
                        <div className="flex items-center gap-3 border-b border-[#f1f5f9] dark:border-[#334155] pb-4">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Lokasi & Pengadaan</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-gray-400 uppercase">Site Lokasi</span><span className="text-xs font-black text-primary dark:text-primary uppercase tracking-widest">{monitor.site}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-gray-400 uppercase">Departemen</span><span className="text-xs font-bold text-gray-600 dark:text-gray-300">{monitor.departemen || '-'}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-gray-400 uppercase">Nomor PO</span><span className="text-xs font-bold text-gray-600 dark:text-gray-300">#{monitor.nomorPO}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-gray-400 uppercase">Tgl Masuk</span><span className="text-xs font-bold text-gray-600 dark:text-gray-300">{monitor.tanggalMasuk ? formatDateWITA(monitor.tanggalMasuk) : '-'}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-gray-400 uppercase">Tgl Kirim</span><span className="text-xs font-bold text-gray-600 dark:text-gray-300">{monitor.tanggalKirim ? formatDateWITA(monitor.tanggalKirim) : '-'}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-gray-400 uppercase">Surat Jalan</span><span className="text-xs font-bold text-gray-600 dark:text-gray-300">{monitor.nomorSuratJalan || '-'}</span></div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-[#f1f5f9] dark:border-[#334155] bg-gray-50/50 dark:bg-[#0f172a]/20">
                            <h3 className="text-[10px] font-black text-[#0f172a] dark:text-white uppercase tracking-[0.2em]">Informasi Monitor</h3>
                        </div>
                        <div className="p-8 grid grid-cols-2 sm:grid-cols-3 gap-6">
                            <SpecItem label="Brand" value={monitor.brand} />
                            <SpecItem label="Jumlah Orderan" value={monitor.jumlahOrderan?.toString() || '-'} />
                            <SpecItem label="Status Barang" value={monitor.statusBarang || '-'} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm p-8 h-full">
                            <div className="flex items-center gap-3 border-b border-[#f1f5f9] dark:border-[#334155] pb-4 mb-6">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Keterangan</h3>
                            </div>
                            <p className="text-sm font-medium text-gray-400 dark:text-gray-400 leading-relaxed">
                                {monitor.keterangan || 'Belum ada keterangan untuk unit ini.'}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm p-8 h-full border-l-4 border-l-primary">
                            <div className="flex items-center gap-3 border-b border-[#f1f5f9] dark:border-[#334155] pb-4 mb-6">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Detail Pengadaan</h3>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <span className="text-[11px] font-bold text-gray-400 uppercase block mb-3">PIC</span>
                                    <div className="space-y-2">
                                        {monitor.diperuntukan ? (
                                            monitor.diperuntukan.split(',').map((item: string, index: number) => (
                                                <p key={index} className="text-xs font-bold text-gray-600 dark:text-gray-300 leading-relaxed">
                                                    {item.trim()}
                                                </p>
                                            ))
                                        ) : (
                                            <p className="text-xs font-bold text-gray-600 dark:text-gray-300">-</p>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-[#f1f5f9] dark:border-[#334155]">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-bold text-gray-400 uppercase">Jumlah Orderan</span>
                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{monitor.jumlahOrderan} Unit</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metadata */}
                    <MetadataCard createdAt={monitor.createdAt} updatedAt={monitor.updatedAt} />
                </div>
            </div>
        </div>
    )
}

