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
import { usePermissions } from '@/hooks/usePermissions'
import type { Laptop, LaptopHistory } from '@/types/entities'

interface NavInfo {
  prevId: number | null
  nextId: number | null
  currentIndex: number
  total: number
}

const SpecItem = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-gray-50 dark:bg-[#0f172a]/40 border border-[#f1f5f9] dark:border-[#334155]">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-bold text-[#0f172a] dark:text-white truncate">{value || '-'}</span>
    </div>
)

const InfoRow = ({ label, value, highlight }: { label: string; value: string | null | undefined; highlight?: boolean }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-[#f1f5f9] dark:border-[#334155] last:border-0">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        <span className={`text-xs font-bold ${highlight ? 'text-blue-600 dark:text-blue-400 uppercase tracking-widest' : 'text-gray-700 dark:text-gray-300'}`}>
            {value || '-'}
        </span>
    </div>
)

export default function ViewLaptop() {
    const router = useRouter()
    const params = useParams()
    const { canEdit } = usePermissions('laptops')
    const [laptop, setLaptop] = useState<Laptop | null>(null)
    const [loading, setLoading] = useState(true)
    const [nav, setNav] = useState<NavInfo>({ prevId: null, nextId: null, currentIndex: 0, total: 0 })
    const [histories, setHistories] = useState<LaptopHistory[]>([])
    const [historyLoading, setHistoryLoading] = useState(true)

    const fetchLaptop = useCallback(async () => {
        try {
            const [laptopRes, navRes] = await Promise.all([
                axios.get<Laptop>(`/api/laptops/${params.id}`),
                axios.get<NavInfo>(`/api/laptops/navigation?id=${params.id}`),
            ])
            setLaptop(laptopRes.data)
            setNav(navRes.data)
        } catch (error: unknown) {
            logger.error('Error fetching laptop:', error)
            Swal.fire({
                title: 'Gagal!',
                text: 'Gagal memuat data. Silakan coba lagi.',
                icon: 'error',
                confirmButtonText: 'OK',
                buttonsStyling: false,
                customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' },
            }).then(() => { router.push('/laptops') })
        } finally {
            setLoading(false)
        }
    }, [params.id, router])

    const fetchHistory = useCallback(async () => {
        try {
            const res = await axios.get<LaptopHistory[]>(`/api/laptops/${params.id}/history`)
            setHistories(res.data)
        } catch (error: unknown) {
            logger.error('Error fetching laptop history:', error)
        } finally {
            setHistoryLoading(false)
        }
    }, [params.id])

    useEffect(() => {
        fetchLaptop()
        fetchHistory()
        const interval = setInterval(() => { fetchLaptop() }, 5000)
        return () => clearInterval(interval)
    }, [fetchLaptop, fetchHistory])

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Menyiapkan informasi perangkat...</p>
            </div>
        )
    }

    if (!laptop) return null

    const formatDateWITA = (dateInput: string | Date) => {
        if (!dateInput) return '-'
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
        if (isNaN(date.getTime())) return '-'
        const witaDate = new Date(date.getTime() + (8 * 60 * 60 * 1000))
        return format(witaDate, 'dd MMM yyyy', { locale: id })
    }

    const toOrdinal = (n: number): string => {
        const ordinals = ['Pertama', 'Kedua', 'Ketiga', 'Keempat', 'Kelima', 'Keenam', 'Ketujuh', 'Kedelapan', 'Kesembilan', 'Kesepuluh']
        return ordinals[n - 1] ?? `Ke-${n}`
    }

    const statusColor = () => {
        const s = laptop.status?.toUpperCase()
        if (s === 'BARU') return 'bg-green-50 dark:bg-green-500/10 text-green-600 border-green-100 dark:border-green-900/40'
        if (s === 'SECOND') return 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 border-yellow-100 dark:border-yellow-900/40'
        if (s === 'SERVICE' || laptop.status?.toLowerCase().includes('rusak')) return 'bg-red-50 dark:bg-red-500/10 text-red-600 border-red-100 dark:border-red-900/40'
        return 'bg-gray-50 dark:bg-gray-500/10 text-gray-600 border-gray-100 dark:border-gray-900/40'
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/laptops" className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-white dark:hover:bg-[#1e293b] rounded-2xl border border-transparent hover:border-[#f1f5f9] dark:hover:border-[#334155] transition-all shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-[#0f172a] dark:text-white tracking-tight uppercase">{laptop.merk}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{laptop.untuk}</span>
                            {laptop.unit && <><span className="w-1 h-1 rounded-full bg-gray-300" /><span className="text-xs text-gray-400">{laptop.unit}</span></>}
                            {nav.total > 0 && <><span className="w-1 h-1 rounded-full bg-gray-300" /><span className="text-xs text-gray-400">{nav.currentIndex}/{nav.total}</span></>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => nav.prevId && router.push(`/laptops/${nav.prevId}/view`)} disabled={!nav.prevId} className="p-2 bg-white dark:bg-[#1e293b] border border-[#f1f5f9] dark:border-[#334155] rounded-xl text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={() => nav.nextId && router.push(`/laptops/${nav.nextId}/view`)} disabled={!nav.nextId} className="p-2 bg-white dark:bg-[#1e293b] border border-[#f1f5f9] dark:border-[#334155] rounded-xl text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColor()}`}>{laptop.status}</span>
                    {canEdit && (
                        <Link href={`/laptops/${laptop.id}/edit`} className="px-4 py-2 bg-white dark:bg-[#1e293b] border border-[#f1f5f9] dark:border-[#334155] rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all shadow-sm">
                            Edit
                        </Link>
                    )}
                </div>
            </div>

            {/* Main Grid: Kiri = Foto+Lokasi | Kanan = Spesifikasi+Kerusakan+Catatan */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Kolom Kiri: Foto + Lokasi + Kerusakan & Catatan (1 card) */}
                <div className="space-y-6">
                    {/* Foto */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden p-3">
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-[#0f172a]">
                            {laptop.gambar ? (
                                <Image src={laptop.gambar} alt={laptop.merk} fill className="object-cover" priority unoptimized={laptop.gambar?.startsWith('/')}
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <span className="text-[10px] font-black uppercase tracking-widest mt-3">No Image</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lokasi & Pengadaan */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Lokasi & Pengadaan</h3>
                        </div>
                        <InfoRow label="Site" value={laptop.site} highlight />
                        <InfoRow label="Departemen" value={laptop.departemen} />
                        <InfoRow label="Nomor PO" value={laptop.po ? `#${laptop.po}` : '-'} />
                        <InfoRow label="Tgl Masuk" value={laptop.masuk ? formatDateWITA(laptop.masuk) : '-'} />
                        <InfoRow label="Tgl Kirim" value={laptop.kirim ? formatDateWITA(laptop.kirim) : '-'} />
                        <InfoRow label="Surat Jalan" value={laptop.suratJalan} />
                    </div>

                    {/* Status Kerusakan & Catatan Tambahan — 1 card */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm p-6 space-y-5">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status Kerusakan</h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                                {laptop.kerusakan || 'Tidak ada riwayat kerusakan.'}
                            </p>
                        </div>
                        <div className="border-t border-[#f1f5f9] dark:border-[#334155] pt-5">
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Catatan Tambahan</h3>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                {laptop.catatan || 'Belum ada catatan tambahan.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Kolom Kanan: Spesifikasi + Riwayat Perpindahan */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Spesifikasi Teknis */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#f1f5f9] dark:border-[#334155] bg-gray-50/50 dark:bg-[#0f172a]/20">
                            <h3 className="text-[10px] font-black text-[#0f172a] dark:text-white uppercase tracking-[0.2em]">Spesifikasi Teknis</h3>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-3">
                            <SpecItem label="Prosesor" value={laptop.prosesor} />
                            <SpecItem label="Serial Number" value={laptop.sn} />
                            <SpecItem label="RAM" value={laptop.ram} />
                            <SpecItem label="Storage" value={laptop.ssdHdd} />
                            <SpecItem label="Monitor" value={laptop.monitor} />
                            <SpecItem label="Printer" value={laptop.printer} />
                            <SpecItem label="Keyboard" value={laptop.keyboard} />
                        </div>
                    </div>

                    {/* Riwayat Perpindahan — dalam grid, sejajar kolom kiri */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#f1f5f9] dark:border-[#334155] bg-gray-50/50 dark:bg-[#0f172a]/20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <h3 className="text-[10px] font-black text-[#0f172a] dark:text-white uppercase tracking-[0.2em]">Riwayat Perpindahan</h3>
                            </div>
                            {histories.length > 0 && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                                    {histories.length} entri
                                </span>
                            )}
                        </div>
                        {historyLoading ? (
                            <div className="p-6 flex items-center justify-center gap-3">
                                <div className="w-5 h-5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Memuat histori...</span>
                            </div>
                        ) : histories.length === 0 ? (
                            <div className="py-8 flex flex-col items-center justify-center text-center gap-2">
                                <svg className="w-8 h-8 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                <p className="text-xs font-bold text-gray-400">Belum ada histori perpindahan.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-[#f1f5f9] dark:border-[#334155]">
                                            <th className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest w-10">No</th>
                                            <th className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">PIC</th>
                                            <th className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Tgl Terima</th>
                                            <th className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Site</th>
                                            <th className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Dept</th>
                                            <th className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#f1f5f9] dark:divide-[#334155]">
                                        {histories.map((history, index) => {
                                            const ordinalIndex = histories.length - index
                                            const isOriginal = index === histories.length - 1
                                            return (
                                                <tr key={history.id} className={`hover:bg-gray-50/50 dark:hover:bg-[#0f172a]/20 transition-colors ${isOriginal ? 'bg-amber-50/40 dark:bg-amber-500/5' : ''}`}>
                                                    <td className="px-5 py-3 text-xs font-bold text-gray-400">{index + 1}</td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-[#0f172a] dark:text-white uppercase">{history.pic}</span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${isOriginal ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40' : 'bg-gray-100 dark:bg-gray-700/40 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}>
                                                                {toOrdinal(ordinalIndex)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDateWITA(history.tanggalTerima)}</td>
                                                    <td className="px-5 py-3">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">{history.site}</span>
                                                    </td>
                                                    <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-300">{history.departemen || '-'}</td>
                                                    <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{history.keterangan || '-'}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Log Aktivitas — center */}
            <div className="flex justify-center">
                <div className="w-full max-w-xl">
                    <ActivityLogPanel entityType="laptop" entityId={laptop.id} />
                </div>
            </div>

        </div>
    )
}
