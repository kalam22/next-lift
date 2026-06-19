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
import type { Laptop, LaptopHistory } from '@/types/entities'

export default function LaptopHistoryPage() {
    const params = useParams()
    const laptopId = params.id as string

    const [histories, setHistories] = useState<LaptopHistory[]>([])
    const [laptop, setLaptop] = useState<Laptop | null>(null)
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

    // Edit modal state
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editData, setEditData] = useState({
        pic: '',
        tanggalTerima: '',
        site: '',
        departemen: '',
        keterangan: '',
    })
    const [editErrors, setEditErrors] = useState<Record<string, string>>({})
    const [editSubmitting, setEditSubmitting] = useState(false)

    const fetchData = useCallback(async () => {
        try {
            const [laptopRes, historiesRes] = await Promise.all([
                axios.get<Laptop>(`/api/laptops/${laptopId}`),
                axios.get<LaptopHistory[]>(`/api/laptops/${laptopId}/history`),
            ])
            setLaptop(laptopRes.data)
            setHistories(historiesRes.data)
        } catch (error: unknown) {
            logger.error('Error fetching laptop history:', error)
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
    }, [laptopId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Format date with UTC+8 offset (same as view/page.tsx)
    const formatDateWITA = (dateInput: string | Date) => {
        if (!dateInput) return '-'
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
        if (isNaN(date.getTime())) return '-'
        const witaDate = new Date(date.getTime() + (8 * 60 * 60 * 1000))
        return format(witaDate, 'dd MMM yyyy', { locale: id })
    }

    const toDateInput = (dateInput: string | Date): string => {
        if (!dateInput) return ''
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
        if (isNaN(date.getTime())) return ''
        const witaDate = new Date(date.getTime() + (8 * 60 * 60 * 1000))
        return format(witaDate, 'yyyy-MM-dd')
    }

    // Convert index (from oldest) to ordinal label in Indonesian
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

    const validateEdit = () => {
        const newErrors: Record<string, string> = {}
        if (!editData.pic.trim()) newErrors.pic = 'PIC wajib diisi'
        if (!editData.tanggalTerima) newErrors.tanggalTerima = 'Tanggal terima wajib diisi'
        if (!editData.site) newErrors.site = 'Site wajib diisi'
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
            await axios.post(`/api/laptops/${laptopId}/history`, formData)
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
            logger.error('Error submitting history:', error)
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

    const openEdit = (history: LaptopHistory) => {
        setEditingId(history.id)
        setEditData({
            pic: history.pic,
            tanggalTerima: toDateInput(history.tanggalTerima),
            site: history.site,
            departemen: history.departemen || '',
            keterangan: history.keterangan || '',
        })
        setEditErrors({})
    }

    const closeEdit = () => {
        setEditingId(null)
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const validationErrors = validateEdit()
        if (Object.keys(validationErrors).length > 0) {
            setEditErrors(validationErrors)
            return
        }
        setEditErrors({})
        setEditSubmitting(true)
        try {
            await axios.put(`/api/laptops/${laptopId}/history/${editingId}`, editData)
            await Swal.fire({
                title: 'Berhasil!',
                text: 'Histori berhasil diperbarui.',
                icon: 'success',
                confirmButtonText: 'OK',
                buttonsStyling: false,
                customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' },
            })
            closeEdit()
            await fetchData()
        } catch (error: unknown) {
            logger.error('Error updating laptop history:', error)
            let message = 'Gagal memperbarui histori. Silakan coba lagi.'
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
            setEditSubmitting(false)
        }
    }

    const handleDelete = async (history: LaptopHistory) => {
        const result = await Swal.fire({
            title: 'Hapus Histori?',
            html: `PIC <strong>${history.pic}</strong> (${formatDateWITA(history.tanggalTerima)}) akan dihapus permanen.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
            buttonsStyling: false,
            customClass: {
                popup: '!rounded-2xl',
                title: '!font-bold',
                confirmButton: 'swal2-confirm !bg-red-600 hover:!bg-red-700',
                cancelButton: 'swal2-cancel',
            },
        })
        if (!result.isConfirmed) return

        try {
            await axios.delete(`/api/laptops/${laptopId}/history/${history.id}`)
            await Swal.fire({
                title: 'Terhapus!',
                text: 'Histori berhasil dihapus.',
                icon: 'success',
                confirmButtonText: 'OK',
                buttonsStyling: false,
                customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' },
            })
            await fetchData()
        } catch (error: unknown) {
            logger.error('Error deleting laptop history:', error)
            Swal.fire({
                title: 'Gagal!',
                text: 'Gagal menghapus histori. Silakan coba lagi.',
                icon: 'error',
                confirmButtonText: 'OK',
                buttonsStyling: false,
                customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' },
            })
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
                        href={`/laptops/${laptopId}/view`}
                        className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-white dark:hover:bg-[#1e293b] rounded-2xl border border-transparent hover:border-[#f1f5f9] dark:hover:border-[#334155] transition-all shadow-sm"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-[#0f172a] dark:text-white tracking-tight uppercase">
                            {laptop?.merk ?? '—'}
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
                        {/* PIC */}
                        <FormField label="PIC" required>
                            <FormInput
                                type="text"
                                placeholder="Nama PIC..."
                                value={formData.pic}
                                onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                            />
                            {errors.pic && (
                                <p className="text-xs text-red-500 font-medium mt-1">{errors.pic}</p>
                            )}
                        </FormField>

                        {/* Tanggal Terima */}
                        <FormField label="Tanggal Terima" required>
                            <FormInput
                                type="date"
                                value={formData.tanggalTerima}
                                onChange={(e) => setFormData({ ...formData, tanggalTerima: e.target.value })}
                            />
                            {errors.tanggalTerima && (
                                <p className="text-xs text-red-500 font-medium mt-1">{errors.tanggalTerima}</p>
                            )}
                        </FormField>

                        {/* Site */}
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
                            {errors.site && (
                                <p className="text-xs text-red-500 font-medium mt-1">{errors.site}</p>
                            )}
                        </FormField>

                        {/* Departemen */}
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

                    {/* Keterangan */}
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
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f1f5f9] dark:divide-[#334155]">
                                {histories.map((history, index) => {
                                    // histories is sorted newest-first, so oldest = histories.length - 1
                                    // ordinal counts from oldest: index 0 from oldest = "Pertama"
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
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openEdit(history)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                                                    title="Edit histori"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(history)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                                    title="Hapus histori"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-[#f1f5f9] dark:border-[#334155] bg-gray-50/50 dark:bg-[#0f172a]/20 flex items-center justify-between">
                            <h2 className="text-[10px] font-black text-[#0f172a] dark:text-white uppercase tracking-[0.2em]">
                                Edit Histori
                            </h2>
                            <button
                                onClick={closeEdit}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-[#334155] transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <FormField label="PIC" required>
                                    <FormInput
                                        type="text"
                                        placeholder="Nama PIC..."
                                        value={editData.pic}
                                        onChange={(e) => setEditData({ ...editData, pic: e.target.value })}
                                    />
                                    {editErrors.pic && <p className="text-xs text-red-500 font-medium mt-1">{editErrors.pic}</p>}
                                </FormField>

                                <FormField label="Tanggal Terima" required>
                                    <FormInput
                                        type="date"
                                        value={editData.tanggalTerima}
                                        onChange={(e) => setEditData({ ...editData, tanggalTerima: e.target.value })}
                                    />
                                    {editErrors.tanggalTerima && <p className="text-xs text-red-500 font-medium mt-1">{editErrors.tanggalTerima}</p>}
                                </FormField>

                                <FormField label="Site" required>
                                    <FormSelect
                                        value={editData.site}
                                        onChange={(e) => setEditData({ ...editData, site: e.target.value })}
                                    >
                                        <option value="">Pilih site...</option>
                                        {SITE_OPTIONS.map((site) => (
                                            <option key={site} value={site}>{site}</option>
                                        ))}
                                    </FormSelect>
                                    {editErrors.site && <p className="text-xs text-red-500 font-medium mt-1">{editErrors.site}</p>}
                                </FormField>

                                <FormField label="Departemen">
                                    <FormSelect
                                        value={editData.departemen}
                                        onChange={(e) => setEditData({ ...editData, departemen: e.target.value })}
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
                                    value={editData.keterangan}
                                    onChange={(e) => setEditData({ ...editData, keterangan: e.target.value })}
                                />
                            </FormField>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeEdit}
                                    className="px-6 py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border border-[#f1f5f9] dark:border-[#334155] hover:bg-gray-50 dark:hover:bg-[#0f172a]/20"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={editSubmitting}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm disabled:cursor-not-allowed"
                                >
                                    {editSubmitting ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
