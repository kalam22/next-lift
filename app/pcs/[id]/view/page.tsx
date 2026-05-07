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
import type { PC, PcHistory } from '@/types/entities'

interface NavInfo {
  prevId: number | null
  nextId: number | null
  currentIndex: number
  total: number
}

export default function ViewPC() {
    const router = useRouter()
    const params = useParams()
    const [pc, setPC] = useState<PC | null>(null)
    const [loading, setLoading] = useState(true)
    const [nav, setNav] = useState<NavInfo>({ prevId: null, nextId: null, currentIndex: 0, total: 0 })
    const [histories, setHistories] = useState<PcHistory[]>([])
    const [historyLoading, setHistoryLoading] = useState(true)

    const fetchPC = useCallback(async () => {
        try {
            const [pcRes, navRes] = await Promise.all([
                axios.get<PC>(`/api/pcs/${params.id}`),
                axios.get<NavInfo>(`/api/pcs/navigation?id=${params.id}`),
            ])
            setPC(pcRes.data)
            setNav(navRes.data)
        } catch (error: unknown) {
            logger.error('Error fetching pc:', error)
            Swal.fire({
                title: 'Gagal!',
                text: 'Gagal memuat data. Silakan coba lagi.',
                icon: 'error',
                confirmButtonText: 'OK',
                buttonsStyling: false,
                customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' },
            }).then(() => { router.push('/pcs') })
        } finally {
            setLoading(false)
        }
    }, [params.id, router])

    useEffect(() => {
        fetchPC()
        fetchHistory()
        const interval = setInterval(() => { fetchPC() }, 5000)
        return () => clearInterval(interval)
    }, [fetchPC])

    const fetchHistory = useCallback(async () => {
        try {
            const res = await axios.get<PcHistory[]>(`/api/pcs/${params.id}/history`)
            setHistories(res.data)
        } catch (error: unknown) {
            logger.error('Error fetching pc history:', error)
        } finally {
            setHistoryLoading(false)
        }
    }, [params.id])

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Menyiapkan informasi perangkat...</p>
            </div>
        )
    }

    if (!pc) return null

    // Function to format date only (without time) - read raw from database, add 8 hours
    const formatDateWITA = (dateInput: string | Date) => {
        if (!dateInput) return '-'
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
        if (isNaN(date.getTime())) return '-'
        const witaDate = new Date(date.getTime() + (8 * 60 * 60 * 1000))
        return format(witaDate, 'dd MMM yyyy', { locale: id })
    }

    const toOrdinal = (n: number): string => {
        const ordinals = [
            'Pertama', 'Kedua', 'Ketiga', 'Keempat', 'Kelima',
            'Keenam', 'Ketujuh', 'Kedelapan', 'Kesembilan', 'Kesepuluh',
        ]
        return ordinals[n - 1] ?? `Ke-${n}`
    }

    const SpecItem = ({ label, value, icon }: { label: string; value: string | null | undefined; icon?: React.ReactNode }) => (
        <div className="p-4 rounded-2xl bg-gray-50/50 dark:bg-[#0f172a]/40 border border-[#f1f5f9] dark:border-[#334155] flex flex-col gap-1 group hover:border-blue-200 transition-all">
            <div className="flex items-center gap-2 text-gray-400 group-hover:text-blue-500 transition-colors">
                {icon && <div className="text-gray-400 group-hover:text-blue-500 transition-colors">{icon}</div>}
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-sm font-bold text-[#0f172a] dark:text-white uppercase truncate">{value || '-'}</span>
        </div>
    )

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center justify-center sm:justify-start gap-5">
                    <Link href="/pcs" className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-white dark:hover:bg-[#1e293b] rounded-2xl border border-transparent hover:border-[#f1f5f9] dark:hover:border-[#334155] transition-all shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tighter uppercase">{pc.merk}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{pc.untuk}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                            <span className="text-xs font-medium text-gray-400">Unit: {pc.unit || '-'}</span>
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
                            onClick={() => nav.prevId && router.push(`/pcs/${nav.prevId}/view`)}
                            disabled={!nav.prevId}
                            title="Data sebelumnya"
                            className="p-2.5 bg-white dark:bg-[#1e293b] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl text-gray-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button
                            onClick={() => nav.nextId && router.push(`/pcs/${nav.nextId}/view`)}
                            disabled={!nav.nextId}
                            title="Data selanjutnya"
                            className="p-2.5 bg-white dark:bg-[#1e293b] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl text-gray-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        pc.status?.toUpperCase() === 'BARU'
                            ? 'bg-green-50 dark:bg-green-500/10 text-green-600 border-green-100 dark:border-green-900/40'
                            : pc.status?.toUpperCase() === 'SECOND'
                            ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 border-yellow-100 dark:border-yellow-900/40'
                            : pc.status?.toUpperCase() === 'SERVICE'
                            ? 'bg-red-50 dark:bg-red-500/10 text-red-600 border-red-100 dark:border-red-900/40'
                            : pc.status?.toLowerCase().includes('rusak') || pc.status?.toLowerCase().includes('error')
                            ? 'bg-red-50 dark:bg-red-500/10 text-red-600 border-red-100 dark:border-red-900/40'
                            : 'bg-gray-50 dark:bg-gray-500/10 text-gray-600 border-gray-100 dark:border-gray-900/40'
                    }`}>
                        {pc.status}
                    </span>
                    <Link href={`/pcs/${pc.id}/edit`} className="px-6 py-2.5 bg-white dark:bg-[#1e293b] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all shadow-sm">
                        Edit Perangkat
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden p-3">
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-[#0f172a] group">
                            {pc.gambar ? (
                                <Image 
                                    src={pc.gambar} 
                                    alt={pc.merk} 
                                    fill 
                                    className="object-cover"
                                    priority
                                    placeholder="blur"
                                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+"
                                    unoptimized={pc.gambar?.startsWith('/')}
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
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Lokasi & Pengadaan</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-gray-400 uppercase">Site Lokasi</span><span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{pc.site}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-gray-400 uppercase">Departemen</span><span className="text-xs font-bold text-gray-600 dark:text-gray-300">{pc.departemen || '-'}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-gray-400 uppercase">Nomor PO</span><span className="text-xs font-bold text-gray-600 dark:text-gray-300">#{pc.po}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-gray-400 uppercase">Tgl Masuk</span><span className="text-xs font-bold text-gray-600 dark:text-gray-300">{pc.masuk ? formatDateWITA(pc.masuk) : '-'}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-gray-400 uppercase">Tgl Kirim</span><span className="text-xs font-bold text-gray-600 dark:text-gray-300">{pc.kirim ? formatDateWITA(pc.kirim) : '-'}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-gray-400 uppercase">Surat Jalan</span><span className="text-xs font-bold text-gray-600 dark:text-gray-300">{pc.suratJalan || '-'}</span></div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-[#f1f5f9] dark:border-[#334155] bg-gray-50/50 dark:bg-[#0f172a]/20">
                            <h3 className="text-[10px] font-black text-[#0f172a] dark:text-white uppercase tracking-[0.2em]">Spesifikasi Teknis</h3>
                        </div>
                        <div className="p-8 grid grid-cols-2 sm:grid-cols-3 gap-6">
                            <SpecItem label="Prosesor" value={pc.prosesor} />
                            <SpecItem label="Memori RAM" value={pc.ram} />
                            <SpecItem label="Storage" value={pc.ssdHdd} />
                            <SpecItem label="Monitor" value={pc.monitor || '-'} />
                            <SpecItem label="Printer" value={pc.printer || '-'} />
                            <SpecItem label="Keyboard+Mouse" value={pc.keyboard || '-'} />
                            <SpecItem label="UPS" value={pc.ups || '-'} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm p-8 h-full">
                            <div className="flex items-center gap-3 border-b border-[#f1f5f9] dark:border-[#334155] pb-4 mb-6">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status Kerusakan</h3>
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed italic">
                                {pc.kerusakan || 'Tidak ada riwayat kerusakan.'}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm p-8 h-full border-l-4 border-l-blue-500">
                            <div className="flex items-center gap-3 border-b border-[#f1f5f9] dark:border-[#334155] pb-4 mb-6">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Catatan Tambahan</h3>
                            </div>
                            <p className="text-sm font-medium text-gray-400 dark:text-gray-400 leading-relaxed">
                                {pc.catatan || 'Belum ada catatan tambahan untuk unit ini.'}
                            </p>
                        </div>
                    </div>

                    {/* Metadata */}
                    <MetadataCard createdAt={pc.createdAt} updatedAt={pc.updatedAt} />
                </div>
            </div>

            {/* Riwayat Perpindahan */}
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#f1f5f9] dark:border-[#334155] bg-gray-50/50 dark:bg-[#0f172a]/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-[10px] font-black text-[#0f172a] dark:text-white uppercase tracking-[0.2em]">Riwayat Perpindahan</h3>
                    </div>
                    {histories.length > 0 && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                            {histories.length} entri
                        </span>
                    )}
                </div>

                {historyLoading ? (
                    <div className="p-8 flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Memuat histori...</span>
                    </div>
                ) : histories.length === 0 ? (
                    <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
                        <svg className="w-10 h-10 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-sm font-medium text-gray-400">Belum ada histori perpindahan.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#f1f5f9] dark:border-[#334155]">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest w-12">No</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">PIC</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal Terima</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Site</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Departemen</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f1f5f9] dark:divide-[#334155]">
                                {histories.map((history, index) => {
                                    const ordinalIndex = histories.length - index
                                    const isOriginal = index === histories.length - 1
                                    return (
                                        <tr key={history.id} className={`hover:bg-gray-50/50 dark:hover:bg-[#0f172a]/20 transition-colors ${isOriginal ? 'bg-amber-50/40 dark:bg-amber-500/5' : ''}`}>
                                            <td className="px-6 py-4 text-xs font-bold text-gray-400">{index + 1}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-[#0f172a] dark:text-white uppercase">
                                                {history.pic}
                                                <span className={`ml-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                    isOriginal
                                                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
                                                        : 'bg-gray-100 dark:bg-gray-700/40 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                                }`}>
                                                    {toOrdinal(ordinalIndex)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                {formatDateWITA(history.tanggalTerima)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                                                    {history.site}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                {history.departemen || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                {history.keterangan || '-'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

