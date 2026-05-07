'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Swal from 'sweetalert2'
import { logger } from '@/lib/logger'
import { SITE_OPTIONS, STATUS_BARANG_OPTIONS, DEPARTEMEN_OPTIONS } from '@/lib/constants'
import { useImageUpload } from '@/hooks/useImageUpload'

interface MouseFormData {
    brand: string
    jumlahOrderan: number | string
    diperuntukan: string
    site: string
    departemen: string
    nomorPO: string
    nomorSuratJalan: string
    statusBarang: string
    tanggalMasuk: string
    tanggalKirim: string
    keterangan: string
    foto: string
}

interface MouseFormProps {
    initialData?: Partial<MouseFormData>
    isEdit?: boolean
    mouseId?: string
    onSuccess?: () => void
}

export default function MouseForm({ initialData, isEdit = false, mouseId, onSuccess }: MouseFormProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const currentImageUrlRef = useRef<string>('')  // track current image URL to avoid stale closure
    const [loading, setLoading] = useState(false)
    const { uploadImage, uploading } = useImageUpload({
        maxSizeMB: 0.2,
        showCompressionInfo: true,
    })
    const [preview, setPreview] = useState<string | null>(null)
    const [formData, setFormData] = useState<MouseFormData>({
        brand: '',
        jumlahOrderan: '',
        diperuntukan: '',
        site: '',
        departemen: '',
        nomorPO: '',
        nomorSuratJalan: '',
        statusBarang: '',
        tanggalMasuk: '',
        tanggalKirim: '',
        keterangan: '',
        foto: '',
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                brand: initialData.brand || '',
                jumlahOrderan: initialData.jumlahOrderan || '',
                diperuntukan: initialData.diperuntukan || '',
                site: initialData.site || '',
                departemen: initialData.departemen || '',
                nomorPO: initialData.nomorPO || '',
                nomorSuratJalan: initialData.nomorSuratJalan || '',
                statusBarang: initialData.statusBarang || '',
                tanggalMasuk: initialData.tanggalMasuk ? initialData.tanggalMasuk.split('T')[0] : '',
                tanggalKirim: initialData.tanggalKirim ? initialData.tanggalKirim.split('T')[0] : '',
                keterangan: initialData.keterangan || '',
                foto: initialData.foto || '',
            })
            if (initialData.foto) {
                setPreview(initialData.foto)
            }
            currentImageUrlRef.current = initialData.foto || ''
        }
    }, [initialData])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            Swal.fire({
                title: 'File Tidak Valid',
                text: 'Hanya file gambar yang diizinkan',
                icon: 'error',
                confirmButtonText: 'OK',
                buttonsStyling: false,
                customClass: {
                    popup: '!rounded-2xl',
                    title: '!font-bold',
                    confirmButton: 'swal2-confirm',
                },
            })
            return
        }

        try {
            const oldImageUrl = currentImageUrlRef.current
            const newImageUrl = await uploadImage(file, oldImageUrl)
            currentImageUrlRef.current = newImageUrl
            setPreview(newImageUrl)
            setFormData(prev => ({ ...prev, foto: newImageUrl }))
        } catch (error) {
            logger.error('Error uploading file:', error)
        }
    }

    const handleRemoveImage = async () => {
        if (currentImageUrlRef.current) {
            try {
                await axios.delete('/api/upload', {
                    data: { url: currentImageUrlRef.current }
                })
                logger.info('Image deleted from server')
            } catch (error) {
                logger.error('Error deleting image from server:', error)
            }
        }
        setPreview(null)
        currentImageUrlRef.current = ''
        setFormData(prev => ({ ...prev, foto: '' }))
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleCancel = async () => {
        if (currentImageUrlRef.current && !initialData?.foto) {
            try {
                await axios.delete('/api/upload', {
                    data: { url: currentImageUrlRef.current }
                })
                logger.info('Cancelled - image deleted from server')
            } catch (error) {
                logger.error('Error deleting image on cancel:', error)
            }
        } else if (currentImageUrlRef.current && initialData?.foto && currentImageUrlRef.current !== initialData.foto) {
            try {
                await axios.delete('/api/upload', {
                    data: { url: currentImageUrlRef.current }
                })
                logger.info('Cancelled - new image deleted from server')
            } catch (error) {
                logger.error('Error deleting image on cancel:', error)
            }
        }
        router.back()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const submitData = {
                brand: formData.brand.trim(),
                jumlahOrderan: parseInt(String(formData.jumlahOrderan)),
                diperuntukan: formData.diperuntukan.trim(),
                site: formData.site,
                departemen: formData.departemen || null,
                nomorPO: formData.nomorPO.trim(),
                nomorSuratJalan: formData.nomorSuratJalan.trim() || null,
                statusBarang: formData.statusBarang,
                tanggalMasuk: formData.tanggalMasuk,
                tanggalKirim: formData.tanggalKirim || null,
                keterangan: formData.keterangan.trim() || null,
                foto: formData.foto || null,
            }

            if (isEdit && mouseId) {
                await axios.put(`/api/mouse/${mouseId}`, submitData)
                await Swal.fire({
                    title: 'Berhasil!',
                    text: 'Data mouse berhasil diperbarui',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    buttonsStyling: false,
                    customClass: {
                        popup: '!rounded-2xl',
                        title: '!font-bold',
                    },
                })
            } else {
                await axios.post('/api/mouse', submitData)
                await Swal.fire({
                    title: 'Berhasil!',
                    text: 'Data mouse berhasil ditambahkan',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    buttonsStyling: false,
                    customClass: {
                        popup: '!rounded-2xl',
                        title: '!font-bold',
                    },
                })
            }

            if (onSuccess) {
                onSuccess()
            } else {
                router.push('/mouse')
            }
        } catch (error: any) {
            logger.error('Error submitting form:', error)
            await Swal.fire({
                title: 'Gagal!',
                text: error.response?.data?.message || 'Gagal menyimpan data mouse',
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

    return (
        <form onSubmit={handleSubmit} className="premium-card p-6 sm:p-8 lg:p-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Brand */}
                <div className="space-y-3">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Brand <span className="text-red-500">*</span></label>
                    <input 
                        type="text" 
                        required 
                        value={formData.brand} 
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })} 
                        placeholder="Brand..." 
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" 
                    />
                </div>

                {/* Jumlah Orderan */}
                <div className="space-y-3">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Jumlah Orderan <span className="text-red-500">*</span></label>
                    <input 
                        type="number" 
                        required 
                        min="1"
                        value={formData.jumlahOrderan} 
                        onChange={(e) => setFormData({ ...formData, jumlahOrderan: e.target.value })} 
                        placeholder="Jumlah Orderan..." 
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" 
                    />
                </div>

                {/* PIC */}
                <div className="space-y-3">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">PIC <span className="text-red-500">*</span></label>
                    <input 
                        type="text" 
                        required 
                        value={formData.diperuntukan} 
                        onChange={(e) => setFormData({ ...formData, diperuntukan: e.target.value })} 
                        placeholder="PIC..." 
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" 
                    />
                </div>

                {/* Site */}
                <div className="space-y-3">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Site <span className="text-red-500">*</span></label>
                    <select
                        required
                        value={formData.site}
                        onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white appearance-none cursor-pointer"
                    >
                        <option value="">Pilih Site...</option>
                        {SITE_OPTIONS.map((site) => (
                            <option key={site} value={site}>{site}</option>
                        ))}
                    </select>
                </div>

                {/* Departemen */}
                <div className="space-y-3">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Departemen</label>
                    <select
                        value={formData.departemen}
                        onChange={(e) => setFormData({ ...formData, departemen: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white appearance-none cursor-pointer"
                    >
                        <option value="">Pilih Departemen...</option>
                        {DEPARTEMEN_OPTIONS.map((dep) => (
                            <option key={dep} value={dep}>{dep}</option>
                        ))}
                    </select>
                </div>

                {/* Nomor PO */}
                <div className="space-y-3">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Nomor PO <span className="text-red-500">*</span></label>
                    <input 
                        type="text" 
                        required 
                        value={formData.nomorPO} 
                        onChange={(e) => setFormData({ ...formData, nomorPO: e.target.value })} 
                        placeholder="Nomor PO..." 
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" 
                    />
                </div>

                {/* Nomor Surat Jalan */}
                <div className="space-y-3">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Nomor Surat Jalan</label>
                    <input 
                        type="text" 
                        value={formData.nomorSuratJalan} 
                        onChange={(e) => setFormData({ ...formData, nomorSuratJalan: e.target.value })} 
                        placeholder="Nomor Surat Jalan..." 
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" 
                    />
                </div>

                {/* Status Barang */}
                <div className="space-y-3">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Status Barang <span className="text-red-500">*</span></label>
                    <select
                        required
                        value={formData.statusBarang}
                        onChange={(e) => setFormData({ ...formData, statusBarang: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white appearance-none cursor-pointer"
                    >
                        <option value="">Pilih Status...</option>
                        {STATUS_BARANG_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                {/* Tanggal Masuk */}
                <div className="space-y-3">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Tanggal Masuk <span className="text-red-500">*</span></label>
                    <input 
                        type="date" 
                        required 
                        value={formData.tanggalMasuk} 
                        onChange={(e) => setFormData({ ...formData, tanggalMasuk: e.target.value })} 
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" 
                    />
                </div>

                {/* Tanggal Kirim */}
                <div className="space-y-3">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Tanggal Kirim</label>
                    <input 
                        type="date" 
                        value={formData.tanggalKirim} 
                        onChange={(e) => setFormData({ ...formData, tanggalKirim: e.target.value })} 
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" 
                    />
                </div>

                {/* Keterangan */}
                <div className="space-y-3 md:col-span-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Keterangan</label>
                    <textarea 
                        value={formData.keterangan} 
                        onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })} 
                        placeholder="Keterangan..." 
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white resize-none" 
                    />
                </div>

                {/* Foto */}
                <div className="space-y-3 md:col-span-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Foto</label>
                    <div className="space-y-4">
                        {preview ? (
                            <div className="relative group">
                                <img 
                                    src={preview} 
                                    alt="Preview" 
                                    className="w-full max-w-md h-auto rounded-2xl border border-[#f1f5f9] dark:border-[#334155]"
                                />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer bg-gray-50 dark:bg-[#0f172a] hover:bg-gray-100 dark:hover:bg-[#1e293b] transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Klik untuk upload</span> atau drag & drop</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF (MAX. 5MB)</p>
                                    </div>
                                    <input 
                                        ref={fileInputRef}
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                        )}
                        {uploading && (
                            <div className="flex items-center justify-center">
                                <div className="relative w-8 h-8">
                                    <div className="absolute inset-0 border-2 border-primary/10 rounded-full"></div>
                                    <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                <span className="ml-2 text-sm text-gray-500">Uploading...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4">
                <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 bg-gray-100 dark:bg-[#1e293b] text-gray-700 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-[#334155] transition-all"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Menyimpan...' : isEdit ? 'Update Mouse' : 'Simpan Mouse'}
                </button>
            </div>
        </form>
    )
}

