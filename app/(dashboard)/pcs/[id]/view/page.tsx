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
import type { PC, PcHistory } from '@/types/entities'
import { usePermissions } from '@/hooks/usePermissions'

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

export default function ViewPC() {
    const router = useRouter()
    const params = useParams()
    const { canEdit } = usePermissions('pcs')
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
            Swal.fire({ title: 'Gagal!', text: 'Gagal memuat data.', icon: 'error', confirmButtonText: 'OK', buttonsStyling: false, customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' } }).then(() => router.push('/pcs'))
        } finally { setLoading(false) }
    }, [params.id, router])

    const fetchHistory = useCallback(async () => {
        try {
            const res = await axios.get<PcHistory[]>(`/api/pcs/${params.id}/history`)
            setHistories(res.data)
        } catch (error: unknown) { logger.error('Error fetching pc history:', error) }
        finally { setHistoryLoading(false) }
    }, [params.id])

    useEffect(() => {
        fetchPC(); fetchHistory()
        const interval = setInterval(() => fetchPC(), 5000)
        return () => clearInterval(interval)
    }, [fetchPC, fetchHistory])

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Menyiapkan informasi perangkat...</p>
        </div>
    )
    if (!pc) return null

    const formatDateWITA = (d: string | Date) => {
        if (!d) return '-'
        const date = d instanceof Date ? d : new Date(d)
        if (isNaN(date.getTime())) return '-'
        return format(new Date(date.getTime() + 8 * 3600000), 'dd MMM yyyy', { locale: id })
    }

    const toOrdinal = (n: number) => ['Pertama','Kedua','Ketiga','Keempat','Kelima','Keenam','Ketujuh','Kedelapan','Kesembilan','Kesepuluh'][n-1] ?? `Ke-${n}`

    const statusColor = () => {
        const s = pc.status?.toUpperCase()
        if (s === 'BARU') return 'bg-green-50 dark:bg-green-500/10 text-green-600 border-green-100 dark:border-green-900/40'
        if (s === 'SECOND') return 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 border-yellow-100 dark:border-yellow-900/40'
        if (s === 'SERVICE' || pc.status?.toLowerCase().includes('rusak')) return 'bg-red-50 dark:bg-red-500/10 text-red-600 border-red-100 dark:border-red-900/40'
        return 'bg-gray-50 dark:bg-gray-500/10 text-gray-600 border-gray-100 dark:border-gray-900/40'
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/pcs" className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-white dark:hover:bg-[#1e293b] rounded-2xl border border-transparent hover:border-[#f1f5f9] dark:hover:border-[#334155] transition-all shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-[#0f172a] dark:text-white tracking-tight uppercase">{pc.merk}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{pc.untuk}</span>
                            {pc.unit && <><span className="w-1 h-1 rounded-full bg-gray-300" /><span className="text-xs text-gray-400">{pc.unit}</span></>}
                            {nav.total > 0 && <><span className="w-1 h-1 rounded-full bg-gray-300" /><span className="text-xs text-gray-400">{nav.currentIndex}/{nav.total}</span></>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => nav.prevId && router.push(`/pcs/${nav.prevId}/view`)} disabled={!nav.prevId} className="p-2 bg-white dark:bg-[#1e293b] border border-[#f1f5f9] dark:border-[#334155] rounded-xl text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={() => nav.nextId && router.push(`/pcs/${nav.nextId}/view`)} disabled={!nav.nextId} className="p-2 bg-white dark:bg-[#1e293b] border border-[#f1f5f9] dark:border-[#334155] rounded-xl text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColor()}`}>{pc.status}</span>
                    {canEdit && <Link href={`/pcs/${pc.id}/edit`} className="px-4 py-2 bg-white dark:bg-[#1e293b] border border-[#f1f5f9] dark:border-[#334155] rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all shadow-sm">Edit</Link>}
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kolom Kiri */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden p-3">
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-[#0f172a]">
                            {pc.gambar ? <Image src={pc.gambar} alt={pc.merk} fill className="object-cover" priority unoptimized={pc.gambar?.startsWith('/')} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} /> : (
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
                        <InfoRow label="Site" value={pc.site} highlight />
                        <InfoRow label="Departemen" value={pc.departemen} />
                        <InfoRow label="Nomor PO" value={pc.po ? `#${pc.po}` : '-'} />
                        <InfoRow label="Tgl Masuk" value={pc.masuk ? formatDateWITA(pc.masuk) : '-'} />
                        <InfoRow label="Tgl Kirim" value={pc.kirim ? formatDateWITA(pc.kirim) : '-'} />
                        <InfoRow label="Surat Jalan" value={pc.suratJalan} />
                    </div>
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm p-6 space-y-5">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status Kerusakan</h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">{pc.kerusakan || 'Tidak ada riwayat kerusakan.'}</p>
                        </div>
                        <div className="border-t border-[#f1f5f9] dark:border-[#334155] pt-5">
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Catatan Tambahan</h3>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{pc.catatan || 'Belum ada catatan tambahan.'}</p>
                        </div>
                    </div>
                </div>

                {/* Kolom Kanan */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#f1f5f9] dark:border-[#334155] bg-gray-50/50 dark:bg-[#0f172a]/20">
                            <h3 className="text-[10px] font-black text-[#0f172a] dark:text-white uppercase tracking-[0.2em]">Spesifikasi Teknis</h3>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-3">
                            <SpecItem label="Prosesor" value={pc.prosesor} />
                            <SpecItem label="RAM" value={pc.ram} />
                            <SpecItem label="Storage" value={pc.ssdHdd} />
                            <SpecItem label="Monitor" value={pc.monitor} />
                            <SpecItem label="Printer" value={pc.printer} />
                            <SpecItem label="Keyboard" value={pc.keyboard} />
                            <SpecItem label="UPS" value={pc.ups} />
                        </div>
                    </div>

                    {/* Riwayat Perpindahan */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#f1f5f9] dark:border-[#334155] bg-gray-50/50 dark:bg-[#0f172a]/20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <h3 className="text-[10px] font-black text-[#0f172a] dark:text-white uppercase tracking-[0.2em]">Riwayat Perpindahan</h3>
                            </div>
                            {histories.length > 0 && <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">{histories.length} entri</span>}
                        </div>
                        {historyLoading ? (
                            <div className="p-6 flex items-center justify-center gap-3"><div className="w-5 h-5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" /><span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Memuat histori...</span></div>
                        ) : histories.length === 0 ? (
                            <div className="py-8 flex flex-col items-center justify-center text-center gap-2">
                                <svg className="w-8 h-8 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                <p className="text-xs font-bold text-gray-400">Belum ada histori perpindahan.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead><tr className="border-b border-[#f1f5f9] dark:border-[#334155]">
                                        <th className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest w-10">No</th>
                                        <th className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">PIC</th>
                                        <th className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Tgl Terima</th>
                                        <th className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Site</th>
                                        <th className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Dept</th>
                                        <th className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Keterangan</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-[#f1f5f9] dark:divide-[#334155]">
                                        {histories.map((h, i) => {
                                            const isOriginal = i === histories.length - 1
                                            return (
                                                <tr key={h.id} className={`hover:bg-gray-50/50 dark:hover:bg-[#0f172a]/20 transition-colors ${isOriginal ? 'bg-amber-50/40 dark:bg-amber-500/5' : ''}`}>
                                                    <td className="px-5 py-3 text-xs font-bold text-gray-400">{i + 1}</td>
                                                    <td className="px-5 py-3"><div className="flex items-center gap-2"><span className="text-xs font-bold text-[#0f172a] dark:text-white uppercase">{h.pic}</span><span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${isOriginal ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40' : 'bg-gray-100 dark:bg-gray-700/40 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}>{toOrdinal(histories.length - i)}</span></div></td>
                                                    <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDateWITA(h.tanggalTerima)}</td>
                                                    <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">{h.site}</span></td>
                                                    <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-300">{h.departemen || '-'}</td>
                                                    <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-[140px] truncate">{h.keterangan || '-'}</td>
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
                    <ActivityLogPanel entityType="pc" entityId={pc.id} />
                </div>
            </div>
        </div>
    )
}
