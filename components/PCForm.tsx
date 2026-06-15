'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import axios from 'axios'
import Swal from 'sweetalert2'
import { logger } from '@/lib/logger'
import { DEPARTEMEN_OPTIONS } from '@/lib/constants'
import { useImageUpload } from '@/hooks/useImageUpload'

interface PCFormData {
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

interface PCFormProps {
    initialData?: Partial<PCFormData>
    isEdit?: boolean
    pcId?: string
    onSuccess?: () => void
    onCancel?: () => void
}

export default function PCForm({ initialData, isEdit = false, pcId, onSuccess, onCancel }: PCFormProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const currentImageUrlRef = useRef<string>('')  // track current image URL to avoid stale closure
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const { uploadImage, uploading } = useImageUpload({
        maxSizeMB: 0.2,
        showCompressionInfo: true,
    })
    const [formData, setFormData] = useState<PCFormData>({
        merk: '',
        prosesor: '',
        ssdHdd: '',
        ram: '',
        monitor: '',
        printer: '',
        keyboard: '',
        ups: '',
        masuk: '',
        kirim: '',
        unit: '',
        untuk: '',
        site: '',
        departemen: '',
        po: '',
        status: '',
        kerusakan: '',
        suratJalan: '',
        catatan: '',
        gambar: '',
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                merk: initialData.merk || '',
                prosesor: initialData.prosesor || '',
                ssdHdd: initialData.ssdHdd || '',
                ram: initialData.ram || '',
                monitor: initialData.monitor || '',
                printer: initialData.printer || '',
                keyboard: initialData.keyboard || '',
                ups: initialData.ups || '',
                masuk: initialData.masuk || '',
                kirim: initialData.kirim || '',
                unit: initialData.unit || '',
                untuk: initialData.untuk || '',
                site: initialData.site || '',
                departemen: initialData.departemen || '',
                po: initialData.po || '',
                status: initialData.status || '',
                kerusakan: initialData.kerusakan || '',
                suratJalan: initialData.suratJalan || '',
                catatan: initialData.catatan || '',
                gambar: initialData.gambar || '',
            })
            if (initialData.gambar) {
                setPreview(initialData.gambar)
            }
            // Sync ref with initial image URL
            currentImageUrlRef.current = initialData.gambar || ''
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
            // Upload with compression and delete old image using ref (not stale formData)
            const oldImageUrl = currentImageUrlRef.current
            const newImageUrl = await uploadImage(file, oldImageUrl)

            // Update ref first, then state
            currentImageUrlRef.current = newImageUrl
            setPreview(newImageUrl)
            setFormData(prev => ({ ...prev, gambar: newImageUrl }))
        } catch (error) {
            logger.error('Error uploading file:', error)
        }
    }

    const appendGB = (value: string): string => {
        const trimmed = value.trim()
        if (!trimmed) return trimmed
        if (/gb/i.test(trimmed)) return trimmed
        return `${trimmed} GB`
    }

    const handleRemoveImage = async () => {
        // Delete uploaded file from server if exists
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
        setFormData(prev => ({ ...prev, gambar: '' }))
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleCancel = async () => {
        // Delete uploaded image if user cancels without saving
        if (currentImageUrlRef.current && !initialData?.gambar) {
            // Only delete if it's a newly uploaded image (not the original)
            try {
                await axios.delete('/api/upload', {
                    data: { url: currentImageUrlRef.current }
                })
                logger.info('Cancelled - image deleted from server')
            } catch (error) {
                logger.error('Error deleting image on cancel:', error)
            }
        } else if (currentImageUrlRef.current && initialData?.gambar && currentImageUrlRef.current !== initialData.gambar) {
            // User changed the image but cancelled — delete the new one
            try {
                await axios.delete('/api/upload', {
                    data: { url: currentImageUrlRef.current }
                })
                logger.info('Cancelled - new image deleted from server')
            } catch (error) {
                logger.error('Error deleting image on cancel:', error)
            }
        }
        if (onCancel) onCancel()
        else router.back()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Execute request
            if (isEdit && pcId) {
                await axios.put(`/api/pcs/${pcId}`, formData)
            } else {
                await axios.post('/api/pcs', formData)
            }
            
            // Show success notification (non-blocking)
            Swal.fire({
                title: isEdit ? 'Berhasil Diupdate!' : 'Berhasil Dibuat!',
                text: isEdit ? 'Data berhasil diupdate.' : 'Data berhasil dibuat.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                buttonsStyling: false,
                customClass: {
                    popup: '!rounded-2xl',
                    title: '!font-bold',
                },
            })
            
            // Redirect/navigate after success (realtime sync)
            if (onSuccess) {
                onSuccess()
            } else {
                router.push('/pcs')
            }
        } catch (error) {
            logger.error('Error saving pc:', error)
            Swal.fire({
                title: 'Gagal!',
                text: isEdit ? 'Gagal mengupdate data' : 'Gagal membuat data',
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
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden">
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 lg:space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-6 md:gap-x-12 gap-y-4 sm:gap-y-6 md:gap-y-8">
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-6 md:gap-x-12 gap-y-4 sm:gap-y-6 md:gap-y-8">
                        {/* Merk */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">BRAND <span className="text-red-500">*</span></label>
                            <input type="text" required value={formData.merk} onChange={(e) => setFormData({ ...formData, merk: e.target.value })} placeholder="BRAND..." className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" />
                        </div>

                        {/* Prosesor */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Prosesor <span className="text-red-500">*</span></label>
                            <input type="text" required value={formData.prosesor} onChange={(e) => setFormData({ ...formData, prosesor: e.target.value })} placeholder="Prosesor..." className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" />
                        </div>

                        {/* Storage */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Storage <span className="text-red-500">*</span></label>
                            <input type="text" required value={formData.ssdHdd} onChange={(e) => setFormData({ ...formData, ssdHdd: e.target.value })} onBlur={(e) => setFormData({ ...formData, ssdHdd: appendGB(e.target.value) })} placeholder="256 GB..." className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" />
                        </div>

                        {/* RAM */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">RAM <span className="text-red-500">*</span></label>
                            <input type="text" required value={formData.ram} onChange={(e) => setFormData({ ...formData, ram: e.target.value })} onBlur={(e) => setFormData({ ...formData, ram: appendGB(e.target.value) })} placeholder="16 GB..." className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" />
                        </div>

                        {/* Monitor */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Monitor</label>
                            <input type="text" value={formData.monitor} onChange={(e) => setFormData({ ...formData, monitor: e.target.value })} placeholder="Monitor..." className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" />
                        </div>

                        {/* Printer */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Printer</label>
                            <input type="text" value={formData.printer} onChange={(e) => setFormData({ ...formData, printer: e.target.value })} placeholder="Printer..." className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" />
                        </div>

                        {/* Keyboard+Mouse */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Keyboard+Mouse</label>
                            <input type="text" value={formData.keyboard} onChange={(e) => setFormData({ ...formData, keyboard: e.target.value })} placeholder="Keyboard+Mouse..." className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" />
                        </div>

                        {/* UPS */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">UPS</label>
                            <input type="text" value={formData.ups} onChange={(e) => setFormData({ ...formData, ups: e.target.value })} placeholder="UPS..." className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" />
                        </div>

                        {/* Tanggal Masuk */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Tanggal Masuk <span className="text-red-500">*</span></label>
                            <input type="date" required value={formData.masuk} onChange={(e) => setFormData({ ...formData, masuk: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" />
                        </div>

                        {/* Tanggal Keluar */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Tanggal Keluar</label>
                            <input type="date" value={formData.kirim} onChange={(e) => setFormData({ ...formData, kirim: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" />
                        </div>

                        {/* Jumlah Unit */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Jumlah Unit</label>
                            <input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="Jumlah unit..." className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" />
                        </div>

                        {/* PIC */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">PIC <span className="text-red-500">*</span></label>
                            <input type="text" required value={formData.untuk} onChange={(e) => setFormData({ ...formData, untuk: e.target.value })} placeholder="PIC..." className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" />
                        </div>

                        {/* Site */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Site <span className="text-red-500">*</span></label>
                            <select required value={formData.site} onChange={(e) => setFormData({ ...formData, site: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white">
                                <option value="">Pilih Site...</option>
                                <option value="HO">HO</option>
                                <option value="WS89">WS89</option>
                                <option value="THS">THS</option>
                                <option value="GAM">GAM</option>
                                <option value="AKP">AKP</option>
                                <option value="ARSY">ARSY</option>
                            </select>
                        </div>

                        {/* Departemen */}
                        <div className="space-y-3">
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Departemen</label>
                          <select value={formData.departemen} onChange={(e) => setFormData({ ...formData, departemen: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white">
                            <option value="">Pilih Departemen...</option>
                            {DEPARTEMEN_OPTIONS.map(dep => (
                              <option key={dep} value={dep}>{dep}</option>
                            ))}
                          </select>
                        </div>

                        {/* Nomor PO */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Nomor PO <span className="text-red-500">*</span></label>
                            <input type="number" required value={formData.po} onChange={(e) => setFormData({ ...formData, po: e.target.value })} placeholder="Nomor PO..." className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" />
                        </div>

                        {/* Status Unit */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Status Unit <span className="text-red-500">*</span></label>
                            <select required value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white">
                                <option value="">Pilih Status...</option>
                                <option value="BARU">BARU</option>
                                <option value="SECOND">SECOND</option>
                                <option value="SERVICE">SERVICE</option>
                            </select>
                        </div>

                        {/* Kerusakan */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Kerusakan</label>
                            <input type="text" value={formData.kerusakan} onChange={(e) => setFormData({ ...formData, kerusakan: e.target.value })} placeholder="Kerusakan..." className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" />
                        </div>

                        {/* Nomor Surat Jalan */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Nomor Surat Jalan</label>
                            <input type="text" value={formData.suratJalan} onChange={(e) => setFormData({ ...formData, suratJalan: e.target.value })} placeholder="Nomor surat jalan..." className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" />
                        </div>
                    </div>

                    {/* Catatan */}
                    <div className="md:col-span-2 space-y-3">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Catatan</label>
                        <textarea value={formData.catatan} onChange={(e) => setFormData({ ...formData, catatan: e.target.value })} rows={4} placeholder="Catatan..." className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white resize-none" />
                    </div>

                    {/* Foto Gambar */}
                    <div className="md:col-span-2 space-y-4">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Foto Gambar</label>
                        <div className="flex flex-col sm:flex-row items-start gap-6">
                            <div className="relative group">
                                <div className="w-48 h-48 rounded-2xl bg-gray-50 dark:bg-[#0f172a] border-2 border-dashed border-[#f1f5f9] dark:border-[#334155] flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-blue-300">
                                    {preview || formData.gambar ? (
                                        <Image
                                            src={preview || formData.gambar}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-300">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            <span className="text-[10px] font-bold uppercase tracking-tighter mt-2">Belum ada foto</span>
                                        </div>
                                    )}
                                </div>
                                {(preview || formData.gambar) && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute -top-3 -right-3 p-1.5 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors z-10"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <p className="text-xs text-gray-500 font-medium leading-relaxed">Unggah foto unit untuk mempermudah identifikasi inventaris. Format: JPG, PNG, WEBP (Max. 5MB).</p>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="px-4 py-2 bg-white dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
                                >
                                    {uploading ? 'Mengupload...' : 'Pilih File Gambar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-[#f1f5f9] dark:border-[#334155]">
                    <button type="submit" disabled={loading || uploading} className="flex-1 px-8 py-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 font-bold flex items-center justify-center gap-3">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isEdit ? "M5 13l4 4L19 7" : "M12 4v16m8-8H4"} /></svg>
                                {isEdit ? 'Simpan Perubahan' : 'Daftarkan Perangkat'}
                            </>
                        )}
                    </button>
                    <button type="button" onClick={handleCancel} className="px-8 py-3.5 bg-gray-50 dark:bg-[#0f172a] text-gray-600 dark:text-gray-400 rounded-2xl border border-[#f1f5f9] dark:border-[#334155] hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-bold">Batal</button>
                </div>
            </form>
        </div>
    )
}



