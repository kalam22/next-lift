'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Swal from 'sweetalert2'
import { logger } from '@/lib/logger'
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormField'
import { SITE_OPTIONS, DEPARTEMEN_OPTIONS } from '@/lib/constants'
import type { PC, PcHistory } from '@/types/entities'

export default function PcHistoryPage() {
    const params = useParams()
    const pcId = params.id as string

    const [histories, setHistories] = useState<PcHistory[]>([])
    const [pc, setPC] = useState<PC | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        pic: '',
        tanggalTerima: new Date().toISOString().split('T')[0],
        site: '',
        departemen: '',
        keterangan: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    const fetchData = useCallback(async () => {
        try {
            const [pcRes, historiesRes] = await Promise.all([
                axios.get<PC>(`/api/pcs/${pcId}`),
                axios.get<PcHistory[]>(`/api/pcs/${pcId}/history`),
            ])
            setPC(pcRes.data)
            setHistories(historiesRes.data)
        } catch (error: unknown) {
            logger.error('Error fetching pc history:', error)
            Swal.fire({
                title: 'Gagal!',
                text: 'Gagal memuat data. Silakan coba lagi.',
                icon: 'error',
                confirmButtonText: 'OK',
                buttonsStyling: false,
                customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' },
            })
        } finally {
            setLoading(false)
        }
    }, [pcId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

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

    const validate = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.pic.trim()) newErrors.pic = 'PIC wajib diisi'
        if (!formData.tanggalTerima) newErrors.tanggalTerima = 'Tanggal terima wajib diisi'
        if (!formData.site) newErrors.site = 'Site wajib diisi'
        return newErrors
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const validationErrors = validate()
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            return
        }
        setErrors({})
        setSubmitting(true)
        try {
            await axios.post(`/api/pcs/${pcId}/history`, formData)
            await Swal.fire({
                title: 'Berhasil!',
                text: 'Histori berhasil ditambahkan.',
                icon: 'success',
                confirmButtonText: 'OK',
                buttonsStyling: false,
                customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' },
            })
            setFormData({
                pic: '',
                tanggalTerima: new Date().toISOString().split('T')[0],
                site: '',
                departemen: '',
                keterangan: '',
            })
            await fetchData()
        } catch (error: unknown) {
            logger.error('Error submitting pc history:', error)
            let message = 'Gagal menyimpan histori. Silakan coba lagi.'
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                message = error.response.data.error
            }
            Swal.fire({
                title: 'Gagal!',
                text: message,
                icon: 'error',
                confirmButtonText: 'OK',
                buttonsStyling: false,
                customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' },
            })
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Menyiapkan histori perangkat...</p>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center justify-center sm:justify-start gap-4">
                    <Link
                        href={`/pcs/${pcId}/view`}
                        className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-white dark:hover:bg-[#1e293b] rounded-2xl border border-transparent hover:border-[#f1f5f9] dark:hover:border-[#334155] transition-all shadow-sm"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-[#0f172a] dark:text-white tracking-tight uppercase">
                            {pc?.merk ?? '—'}
                        </h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5">
                            {histories.length} Histori
                        </p>
                    </div>
                </div>
            </div>

            {/* Form tambah histori */}
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#f1f5f9] dark:border-[#334155] bg-gray-50/50 dark:bg-[#0f172a]/20">
                    <h2 className="text-[10px] font-black text-[#0f172a] dark:text-white uppercase tracking-[0.2em]">
                        Tambah Histori Baru
                    </h2>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField label="PIC" required>
                            <FormInput
                                type="text"
                                placeholder="Nama PIC..."
                                value={formData.pic}
                                onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                            />
                            {errors.pic && <p className="text-xs text-red-500 font-medium mt-1">{errors.pic}</p>}
                        </FormField>

                        <FormField label="Tanggal Terima" required>
                            <FormInput
                                type="date"
                                value={formData.tanggalTerima}
                                onChange={(e) => setFormData({ ...formData, tanggalTerima: e.target.value })}
                            />
                            {errors.tanggalTerima && <p className="text-xs text-red-500 font-medium mt-1">{errors.tanggalTerima}</p>}
                        </FormField>

                        <FormField label="Site" required>
                            <FormSelect
                                value={formData.site}
                                onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                            >
                                <option value="">Pilih site...</option>
                                {SITE_OPTIONS.map((site) => (
                                    <option key={site} value={site}>{site}</option>
                                ))}
                            </FormSelect>
                            {errors.site && <p className="text-xs text-red-500 font-medium mt-1">{errors.site}</p>}
                        </FormField>

                        <FormField label="Departemen">
                            <FormSelect
                                value={formData.departemen}
                                onChange={(e) => setFormData({ ...formData, departemen: e.target.value })}
                            >
                                <option value="">Pilih departemen...</option>
                                {DEPARTEMEN_OPTIONS.map((dep) => (
                                    <option key={dep} value={dep}>{dep}</option>
                                ))}
                            </FormSelect>
                        </FormField>
                    </div>

                    <FormField label="Keterangan">
                        <FormTextarea
                            rows={3}
                            placeholder="Keterangan tambahan (opsional)..."
                            value={formData.keterangan}
                            onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                        />
                    </FormField>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Menyimpan...' : 'Simpan Histori'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Tabel histori */}
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#f1f5f9] dark:border-[#334155] bg-gray-50/50 dark:bg-[#0f172a]/20">
                    <h2 className="text-[10px] font-black text-[#0f172a] dark:text-white uppercase tracking-[0.2em]">
                        Riwayat Perpindahan
                    </h2>
                </div>

                {histories.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center space-y-3">
                        <svg className="w-12 h-12 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-sm font-medium text-gray-400">Belum ada histori untuk perangkat ini.</p>
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
                                        <tr key={`${history.id}-${index}`} className={`hover:bg-gray-50/50 dark:hover:bg-[#0f172a]/20 transition-colors ${isOriginal ? 'bg-amber-50/40 dark:bg-amber-500/5' : ''}`}>
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
