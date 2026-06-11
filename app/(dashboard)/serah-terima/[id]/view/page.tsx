'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Swal from 'sweetalert2'
import { logger } from '@/lib/logger'
import ActivityLogPanel from '@/components/ActivityLogPanel'
import type { Handover } from '@/types/entities'
import { usePermissions } from '@/hooks/usePermissions'

export default function ViewHandover() {
    const router = useRouter()
    const params = useParams()
    const { canEdit } = usePermissions('handover')
    const [handover, setHandover] = useState<Handover | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchHandover = useCallback(async () => {
        try {
            const { data } = await axios.get<Handover>(`/api/serah-terima/${params.id}`)
            setHandover(data)
        } catch (error: unknown) {
            logger.error('Error fetching handover:', error)
            await Swal.fire({ title: 'Gagal!', text: 'Gagal memuat data', icon: 'error', confirmButtonText: 'OK', buttonsStyling: false, customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' } })
        } finally { setLoading(false) }
    }, [params.id, router])

    useEffect(() => {
        fetchHandover()
    }, [fetchHandover])

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    )
    if (!handover) return null

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/serah-terima" className="p-2.5 text-gray-400 hover:text-primary hover:bg-white dark:hover:bg-[#1e293b] rounded-2xl border border-transparent hover:border-[#f1f5f9] dark:hover:border-[#334155] transition-all shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-[#0f172a] dark:text-white tracking-tight uppercase">Detail Serah Terima</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{format(new Date(handover.tanggal), 'dd MMMM yyyy', { locale: id })}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {canEdit && <Link href={`/serah-terima/${handover.id}/edit`} className="px-4 py-2 bg-white dark:bg-[#1e293b] border border-[#f1f5f9] dark:border-[#334155] rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all shadow-sm">Edit</Link>}
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#f1f5f9] dark:border-[#334155] bg-gray-50/50 dark:bg-[#0f172a]/20">
                    <h3 className="text-[10px] font-black text-[#0f172a] dark:text-white uppercase tracking-[0.2em]">Informasi Serah Terima</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-gray-50 dark:bg-[#0f172a]/40 border border-[#f1f5f9] dark:border-[#334155]">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal</span>
                        <span className="text-sm font-bold text-[#0f172a] dark:text-white">{format(new Date(handover.tanggal), 'dd MMMM yyyy', { locale: id })}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-gray-50 dark:bg-[#0f172a]/40 border border-[#f1f5f9] dark:border-[#334155]">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PIC</span>
                        <span className="text-sm font-bold text-[#0f172a] dark:text-white">{handover.pic}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-gray-50 dark:bg-[#0f172a]/40 border border-[#f1f5f9] dark:border-[#334155]">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Site</span>
                        <span className="text-sm font-bold text-[#0f172a] dark:text-white">{handover.site}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-gray-50 dark:bg-[#0f172a]/40 border border-[#f1f5f9] dark:border-[#334155]">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Penerima</span>
                        <span className="text-sm font-bold text-[#0f172a] dark:text-white">{handover.namaPenerima}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-gray-50 dark:bg-[#0f172a]/40 border border-[#f1f5f9] dark:border-[#334155] md:col-span-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Barang</span>
                        <div className="text-sm font-bold text-[#0f172a] dark:text-white ql-editor-preview" dangerouslySetInnerHTML={{ __html: handover.barang }} />
                    </div>
                    <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-gray-50 dark:bg-[#0f172a]/40 border border-[#f1f5f9] dark:border-[#334155] md:col-span-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanda Tangan</span>
                        {handover.ttd ? (
                            <img src={handover.ttd} alt="TTD" className="max-h-32 w-auto object-contain bg-white p-1 rounded border border-gray-200" />
                        ) : (
                            <span className="text-sm text-gray-400">Belum ada tanda tangan</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-center">
                <div className="w-full max-w-xl">
                    <ActivityLogPanel entityType="handover" entityId={handover.id} />
                </div>
            </div>
        </div>
    )
}
