'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import Swal from 'sweetalert2'
import { logger } from '@/lib/logger'
import PCForm from '@/components/PCForm'
import type { PC } from '@/types/entities'

interface PCFormDataForEdit {
    merk: string
    prosesor: string
    ssdHdd: string
    ram: string
    monitor: string
    printer: string
    keyboard: string
    ups: string
    masuk: string
    kirim: string
    unit: string
    untuk: string
    site: string
    departemen: string
    po: string
    status: string
    kerusakan: string
    suratJalan: string
    catatan: string
    gambar: string
}

export default function EditPC() {
    const params = useParams()
    const [loading, setLoading] = useState(true)
    const [initialData, setInitialData] = useState<PCFormDataForEdit | null>(null)

    useEffect(() => {
        fetchPC()
    }, [])

    const fetchPC = async () => {
        try {
            const response = await axios.get<PC>(`/api/pcs/${params.id}`)
            const pc = response.data
            setInitialData({
                merk: pc.merk,
                prosesor: pc.prosesor,
                ssdHdd: pc.ssdHdd,
                ram: pc.ram,
                monitor: pc.monitor || '',
                printer: pc.printer || '',
                keyboard: pc.keyboard || '',
                ups: pc.ups || '',
                masuk: pc.masuk ? (typeof pc.masuk === 'string' ? pc.masuk.split('T')[0] : new Date(pc.masuk).toISOString().split('T')[0]) : '',
                kirim: pc.kirim ? (typeof pc.kirim === 'string' ? pc.kirim.split('T')[0] : new Date(pc.kirim).toISOString().split('T')[0]) : '',
                unit: pc.unit || '',
                untuk: pc.untuk,
                site: pc.site,
                departemen: pc.departemen || '',
                po: String(pc.po),
                status: pc.status,
                kerusakan: pc.kerusakan || '',
                suratJalan: pc.suratJalan || '',
                catatan: pc.catatan || '',
                gambar: pc.gambar || '',
            })
        } catch (error: unknown) {
            logger.error('Error fetching pc:', error)
            Swal.fire({
                title: 'Gagal!',
                text: 'Gagal memuat data. Silakan coba lagi.',
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
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-gray-400 text-sm font-medium">Menyiapkan formulir...</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center justify-center sm:justify-start gap-4">
                    <Link href="/pcs" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white dark:hover:bg-[#1e293b] rounded-xl border border-transparent hover:border-[#f1f5f9] dark:hover:border-[#334155] transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight">Edit Perangkat</h1>
                        <p className="text-sm text-gray-400 font-medium">Perbarui spesifikasi dan informasi unit {initialData?.merk || ''}.</p>
                    </div>
                </div>
                <Link
                    href={`/pcs/${params.id}/history`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-sm"
                >
                    Histori Perangkat
                </Link>
            </div>

            {initialData && (
                <PCForm 
                    initialData={initialData}
                    isEdit={true}
                    pcId={params.id as string}
                />
            )}
        </div>
    )
}

