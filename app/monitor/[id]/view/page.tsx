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
import ActivityLogPanel from '@/components/ActivityLogPanel'
import type { Monitor } from '@/types/entities'
import { usePermissions } from '@/hooks/usePermissions'

interface NavInfo { prevId: number | null; nextId: number | null; currentIndex: number; total: number }

const SpecItem = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-gray-50 dark:bg-[#0f172a]/40 border border-[#f1f5f9] dark:border-[#334155]">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-bold text-[#0f172a] dark:text-white truncate">{value || '-'}</span>
    </div>
)

const InfoRow = ({ label, value, highlight }: { label: string; value: string | null | undefined; highlight?: boolean }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-[#f1f5f9] dark:border-[#334155] last:border-0">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        <span className={`text-xs font-bold ${highlight ? 'text-blue-600 dark:text-blue-400 uppercase tracking-widest' : 'text-gray-700 dark:text-gray-300'}`}>{value || '-'}</span>
    </div>
)

export default function ViewMonitor() {
    const router = useRouter()
    const params = useParams()
    const { canEdit } = usePermissions('monitor')
    const [monitor, setMonitor] = useState<Monitor | null>(null)
    const [loading, setLoading] = useState(true)
    const [nav, setNav] = useState<NavInfo>({ prevId: null, nextId: null, currentIndex: 0, total: 0 })

    const fetchMonitor = useCallback(async () => {
        try {
            const [monitorRes, navRes] = await Promise.all([
                axios.get<Monitor>(`/api/monitor/${params.id}`),
                axios.get<NavInfo>(`/api/monitor/navigation?id=${params.id}`),
            ])
            setMonitor(monitorRes.data); setNav(navRes.data)
        } catch (error: unknown) {
            logger.error('Error fetching monitor:', error)
            await Swal.fire({ title: 'Gagal!', text: 'Gagal memuat data monitor', icon: 'error', confirmButtonText: 'OK', buttonsStyling: false, customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' } })
        } finally { setLoading(false) }
    }, [params.id, router])

    useEffect(() => {
        fetchMonitor()
        const interval = setInterval(() => fetchMonitor(), 5000)
        return () => clearInterval(interval)
    }, [fetchMonitor])

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Menyiapkan informasi perangkat...</p>
        </div>
    )
    if (!monitor) return null

    const formatDateWITA = (d: string | Date) => {
        if (!d) return '-'
        const date = d instanceof Date ? d : new Date(d)
        if (isNaN(date.getTime())) return '-'
        return format(new Date(date.getTime() + 8 * 3600000), 'dd MMM yyyy', { locale: id })
    }

    const statusColor = () => {
        const s = monitor.statusBarang?.toUpperCase()
        if (s === 'BARU') return 'bg-green-50 dark:bg-green-500/10 text-green-600 border-green-100 dark:border-green-900/40'
        if (s === 'SECOND') return 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 border-yellow-100 dark:border-yellow-900/40'
        if (s === 'SERVICE' || monitor.statusBarang?.toLowerCase().includes('rusak')) return 'bg-red-50 dark:bg-red-500/10 text-red-600 border-red-100 dark:border-red-900/40'
        return 'bg-gray-50 dark:bg-gray-500/10 text-gray-600 border-gray-100 dark:border-gray-900/40'
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/monitor" className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-white dark:hover:bg-[#1e293b] rounded-2xl border border-transparent hover:border-[#f1f5f9] dark:hover:border-[#334155] transition-all shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-[#0f172a] dark:text-white tracking-tight uppercase">{monitor.brand}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{monitor.diperuntukan}</span>
                            {nav.total > 0 && <><span className="w-1 h-1 rounded-full bg-gray-300" /><span className="text-xs text-gray-400">{nav.currentIndex}/{nav.total}</span></>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => nav.prevId && router.push(`/monitor/${nav.prevId}/view`)} disabled={!nav.prevId} className="p-2 bg-white dark:bg-[#1e293b] border border-[#f1f5f9] dark:border-[#334155] rounded-xl text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={() => nav.nextId && router.push(`/monitor/${nav.nextId}/view`)} disabled={!nav.nextId} className="p-2 bg-white dark:bg-[#1e293b] border border-[#f1f5f9] dark:border-[#334155] rounded-xl text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColor()}`}>{monitor.statusBarang}</span>
                    {canEdit && <Link href={`/monitor/${monitor.id}/edit`} className="px-4 py-2 bg-white dark:bg-[#1e293b] border border-[#f1f5f9] dark:border-[#334155] rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all shadow-sm">Edit</Link>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden p-3">
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-[#0f172a]">
                            {monitor.foto ? <Image src={monitor.foto} alt={monitor.brand} fill className="object-cover" priority unoptimized={monitor.foto?.startsWith('/')} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} /> : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <span className="text-[10px] font-black uppercase tracking-widest mt-3">No Image</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Lokasi & Pengadaan</h3>
                        </div>
                        <InfoRow label="Site" value={monitor.site} highlight />
                        <InfoRow label="Departemen" value={monitor.departemen} />
                        <InfoRow label="Nomor PO" value={monitor.nomorPO ? `#${monitor.nomorPO}` : '-'} />
                        <InfoRow label="Tgl Masuk" value={monitor.tanggalMasuk ? formatDateWITA(monitor.tanggalMasuk) : '-'} />
                        <InfoRow label="Tgl Kirim" value={monitor.tanggalKirim ? formatDateWITA(monitor.tanggalKirim) : '-'} />
                        <InfoRow label="Surat Jalan" value={monitor.nomorSuratJalan} />
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#f1f5f9] dark:border-[#334155] bg-gray-50/50 dark:bg-[#0f172a]/20">
                            <h3 className="text-[10px] font-black text-[#0f172a] dark:text-white uppercase tracking-[0.2em]">Informasi Monitor</h3>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-3">
                            <SpecItem label="Brand" value={monitor.brand} />
                            <SpecItem label="Status" value={monitor.statusBarang} />
                            <SpecItem label="Jumlah Orderan" value={monitor.jumlahOrderan?.toString()} />
                            <SpecItem label="Diperuntukan" value={monitor.diperuntukan} />
                        </div>
                    </div>

                    {/* Keterangan */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Keterangan</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{monitor.keterangan || 'Belum ada keterangan.'}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-center">
                <div className="w-full max-w-xl">
                    <ActivityLogPanel entityType="monitor" entityId={monitor.id} />
                </div>
            </div>
        </div>
    )
}
