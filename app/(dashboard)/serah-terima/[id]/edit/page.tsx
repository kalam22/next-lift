'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import Swal from 'sweetalert2'
import { logger } from '@/lib/logger'
import HandoverForm from '@/components/HandoverForm'
import type { HandoverFormData, Handover } from '@/types/entities'

export default function EditHandover() {
    const params = useParams()
    const [loading, setLoading] = useState(true)
    const [initialData, setInitialData] = useState<HandoverFormData | null>(null)

    useEffect(() => {
        fetchHandover()
    }, [])

    const fetchHandover = async () => {
        try {
            const response = await axios.get<Handover>(`/api/serah-terima/${params.id}`)
            const handover = response.data
            setInitialData({
                tanggal: handover.tanggal ? (typeof handover.tanggal === 'string' ? handover.tanggal.split('T')[0] : new Date(handover.tanggal).toISOString().split('T')[0]) : '',
                barang: handover.barang,
                pic: handover.pic,
                site: handover.site,
                namaPenerima: handover.namaPenerima,
                ttd: handover.ttd || '',
            })
        } catch (error: unknown) {
            logger.error('Error fetching handover:', error)
            Swal.fire({
                title: 'Gagal!',
                text: 'Gagal memuat data serah terima. Silakan coba lagi.',
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
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        )
    }

    if (!initialData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500">Data tidak ditemukan</p>
                    <Link href="/serah-terima" className="text-primary hover:underline mt-4 inline-block">
                        Kembali ke daftar Serah Terima
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center justify-center sm:justify-start gap-4">
                    <Link
                        href="/serah-terima"
                        className="p-2 text-gray-400 hover:text-primary hover:bg-white dark:hover:bg-[#1e293b] rounded-xl border border-transparent hover:border-[#f1f5f9] dark:hover:border-[#334155] transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight">Edit Serah Terima</h1>
                        <p className="text-sm text-gray-400 font-medium">Perbarui data catatan serah terima.</p>
                    </div>
                </div>
            </div>

            <HandoverForm isEdit={true} handoverId={params.id as string} initialData={initialData} />
        </div>
    )
}
