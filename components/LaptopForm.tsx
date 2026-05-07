'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import axios from 'axios'
import Swal from 'sweetalert2'
import { logger } from '@/lib/logger'
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormField'
import { DEPARTEMEN_OPTIONS } from '@/lib/constants'
import { useImageUpload } from '@/hooks/useImageUpload'
import { validatePDF, formatFileSize } from '@/lib/pdfCompression'

interface LaptopFormData {
    merk: string
    prosesor: string
    sn: string
    ssdHdd: string
    ram: string
    monitor: string
    printer: string
    keyboard: string
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
    serahTerimaPdf: string
}

interface LaptopFormProps {
    initialData?: Partial<LaptopFormData>
    isEdit?: boolean
    laptopId?: string
    onSuccess?: () => void
}

export default function LaptopForm({ initialData, isEdit = false, laptopId, onSuccess }: LaptopFormProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const pdfInputRef = useRef<HTMLInputElement>(null)
    const currentPdfUrlRef = useRef<string>('')  // track current PDF URL to avoid stale closure
    const currentImageUrlRef = useRef<string>('')  // track current image URL to avoid stale closure
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const [uploadingPdf, setUploadingPdf] = useState(false)
    const { uploadImage, uploading } = useImageUpload({
        maxSizeMB: 0.2, // 200KB
        showCompressionInfo: true,
    })
    const [formData, setFormData] = useState<LaptopFormData>({
        merk: '',
        prosesor: '',
        sn: '',
        ssdHdd: '',
        ram: '',
        monitor: '',
        printer: '',
        keyboard: '',
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
        serahTerimaPdf: '',
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                merk: initialData.merk || '',
                prosesor: initialData.prosesor || '',
                sn: initialData.sn || '',
                ssdHdd: initialData.ssdHdd || '',
                ram: initialData.ram || '',
                monitor: initialData.monitor || '',
                printer: initialData.printer || '',
                keyboard: initialData.keyboard || '',
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
                serahTerimaPdf: initialData.serahTerimaPdf || '',
            })
            if (initialData.gambar) {
                setPreview(initialData.gambar)
            }
            // Sync refs with initial data
            currentPdfUrlRef.current = initialData.serahTerimaPdf || ''
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
            // Newly uploaded image, not yet saved
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
        router.back()
    }

    const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate PDF
        if (!validatePDF(file)) {
            Swal.fire({
                title: 'File Tidak Valid',
                text: 'Hanya file PDF yang diizinkan',
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

        // Check file size (max 1MB)
        if (file.size > 1 * 1024 * 1024) {
            Swal.fire({
                title: 'File Terlalu Besar',
                text: 'Ukuran file maksimal 1MB. Silakan kompres PDF terlebih dahulu.',
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

        setUploadingPdf(true)

        try {
            // Show upload progress
            Swal.fire({
                title: 'Mengupload PDF...',
                html: `Ukuran file: ${formatFileSize(file.size)}`,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading()
                },
            })

            // Delete old PDF if exists (before uploading new one)
            if (currentPdfUrlRef.current) {
                try {
                    await axios.delete('/api/upload', {
                        data: { url: currentPdfUrlRef.current }
                    })
                    logger.info('Old PDF deleted:', currentPdfUrlRef.current)
                } catch (deleteError) {
                    logger.error('Error deleting old PDF:', deleteError)
                    // Continue with upload even if delete fails
                }
            }

            // Upload PDF directly (no compression)
            const uploadFormData = new FormData()
            uploadFormData.append('file', file)

            const uploadResponse = await axios.post('/api/upload', uploadFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })

            setFormData(prev => ({ ...prev, serahTerimaPdf: uploadResponse.data.url }))
            // Update ref so next replacement can delete this file
            currentPdfUrlRef.current = uploadResponse.data.url

            // Show success message
            Swal.fire({
                title: 'Berhasil!',
                html: `PDF berhasil diupload<br/><br/>
                📄 Ukuran file: <strong>${formatFileSize(file.size)}</strong>`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                buttonsStyling: false,
                customClass: {
                    popup: '!rounded-2xl',
                    title: '!font-bold',
                },
            })
        } catch (error: any) {
            logger.error('Error uploading PDF:', error)
            
            const errorMessage = error?.message || 'Gagal mengupload PDF'
            
            Swal.fire({
                title: 'Gagal!',
                text: errorMessage,
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
            setUploadingPdf(false)
            // Reset file input
            if (pdfInputRef.current) {
                pdfInputRef.current.value = ''
            }
        }
    }

    const handleRemovePdf = async () => {
        // Delete file from server if exists
        if (currentPdfUrlRef.current) {
            try {
                await axios.delete('/api/upload', {
                    data: { url: currentPdfUrlRef.current }
                })
                logger.info('PDF deleted from server')
            } catch (deleteError) {
                logger.error('Error deleting PDF from server:', deleteError)
                // Continue with state update even if delete fails
            }
        }
        
        currentPdfUrlRef.current = ''
        setFormData(prev => ({ ...prev, serahTerimaPdf: '' }))
        if (pdfInputRef.current) {
            pdfInputRef.current.value = ''
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Execute request
            if (isEdit && laptopId) {
                await axios.put(`/api/laptops/${laptopId}`, formData)
            } else {
                await axios.post('/api/laptops', formData)
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
                router.push('/laptops')
            }
        } catch (error) {
            logger.error('Error saving laptop:', error)
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
                        <FormField label="BRAND" required>
                            <FormInput type="text" required value={formData.merk} onChange={(e) => setFormData({ ...formData, merk: e.target.value })} placeholder="BRAND..." maxLength={200} />
                        </FormField>

                        <FormField label="Prosesor" required>
                            <FormInput type="text" required value={formData.prosesor} onChange={(e) => setFormData({ ...formData, prosesor: e.target.value })} placeholder="Prosesor..." maxLength={200} />
                        </FormField>

                        <FormField label="SN">
                            <FormInput type="text" value={formData.sn} onChange={(e) => setFormData({ ...formData, sn: e.target.value })} placeholder="Serial Number..." maxLength={200} />
                        </FormField>

                        <FormField label="Storage" required>
                            <FormInput type="text" required value={formData.ssdHdd} onChange={(e) => setFormData({ ...formData, ssdHdd: e.target.value })} onBlur={(e) => setFormData({ ...formData, ssdHdd: appendGB(e.target.value) })} placeholder="256 GB..." maxLength={200} />
                        </FormField>

                        <FormField label="RAM" required>
                            <FormInput type="text" required value={formData.ram} onChange={(e) => setFormData({ ...formData, ram: e.target.value })} onBlur={(e) => setFormData({ ...formData, ram: appendGB(e.target.value) })} placeholder="16 GB..." maxLength={100} />
                        </FormField>

                        <FormField label="Monitor">
                            <FormInput type="text" value={formData.monitor} onChange={(e) => setFormData({ ...formData, monitor: e.target.value })} placeholder="Monitor..." maxLength={200} />
                        </FormField>

                        <FormField label="Printer">
                            <FormInput type="text" value={formData.printer} onChange={(e) => setFormData({ ...formData, printer: e.target.value })} placeholder="Printer..." maxLength={200} />
                        </FormField>

                        <FormField label="Mouse">
                            <FormInput type="text" value={formData.keyboard} onChange={(e) => setFormData({ ...formData, keyboard: e.target.value })} placeholder="Mouse..." maxLength={200} />
                        </FormField>

                        <FormField label="Tanggal Masuk" required>
                            <FormInput type="date" required value={formData.masuk} onChange={(e) => setFormData({ ...formData, masuk: e.target.value })} />
                        </FormField>

                        <FormField label="Tanggal Keluar">
                            <FormInput type="date" value={formData.kirim} onChange={(e) => setFormData({ ...formData, kirim: e.target.value })} />
                        </FormField>

                        <FormField label="Jumlah Unit">
                            <FormInput type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="Jumlah unit..." maxLength={50} />
                        </FormField>

                        <FormField label="PIC" required>
                            <FormInput type="text" required value={formData.untuk} onChange={(e) => setFormData({ ...formData, untuk: e.target.value })} placeholder="PIC..." maxLength={200} />
                        </FormField>

                        <FormField label="Site" required>
                            <FormSelect required value={formData.site} onChange={(e) => setFormData({ ...formData, site: e.target.value })}>
                                <option value="">Pilih Site...</option>
                                <option value="HO">HO</option>
                                <option value="WS89">WS89</option>
                                <option value="THS">THS</option>
                                <option value="GAM">GAM</option>
                                <option value="AKP">AKP</option>
                                <option value="ARSY">ARSY</option>
                            </FormSelect>
                        </FormField>

                        <FormField label="Departemen">
                          <FormSelect value={formData.departemen} onChange={(e) => setFormData({ ...formData, departemen: e.target.value })}>
                            <option value="">Pilih Departemen...</option>
                            {DEPARTEMEN_OPTIONS.map(dep => (
                              <option key={dep} value={dep}>{dep}</option>
                            ))}
                          </FormSelect>
                        </FormField>

                        <FormField label="Nomor PO" required>
                            <FormInput type="number" required value={formData.po} onChange={(e) => setFormData({ ...formData, po: e.target.value })} placeholder="Nomor PO..." />
                        </FormField>

                        <FormField label="Status Unit" required>
                            <FormSelect required value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                <option value="">Pilih Status...</option>
                                <option value="BARU">BARU</option>
                                <option value="SECOND">SECOND</option>
                                <option value="SERVICE">SERVICE</option>
                            </FormSelect>
                        </FormField>

                        <FormField label="Kerusakan">
                            <FormInput type="text" value={formData.kerusakan} onChange={(e) => setFormData({ ...formData, kerusakan: e.target.value })} placeholder="Kerusakan..." maxLength={500} />
                        </FormField>

                        <FormField label="Nomor Surat Jalan">
                            <FormInput type="text" value={formData.suratJalan} onChange={(e) => setFormData({ ...formData, suratJalan: e.target.value })} placeholder="Nomor surat jalan..." maxLength={200} />
                        </FormField>
                    </div>

                    {/* Catatan */}
                    <div className="md:col-span-2 space-y-3">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Catatan</label>
                        <FormTextarea value={formData.catatan} onChange={(e) => setFormData({ ...formData, catatan: e.target.value })} rows={4} placeholder="Catatan..." maxLength={1000} />
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

                    {/* PDF Serah Terima */}
                    {isEdit && (
                        <div className="md:col-span-2 space-y-4 pt-4 border-t border-[#f1f5f9] dark:border-[#334155]">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">PDF Serah Terima</label>
                            <div className="flex flex-col sm:flex-row items-start gap-6">
                                <div className="relative group">
                                    <div className="w-48 h-48 rounded-2xl bg-gray-50 dark:bg-[#0f172a] border-2 border-dashed border-[#f1f5f9] dark:border-[#334155] flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-red-300">
                                        {formData.serahTerimaPdf ? (
                                            <div className="flex flex-col items-center text-red-600">
                                                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>
                                                <span className="text-[10px] font-bold uppercase tracking-tighter mt-2">PDF Tersedia</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-gray-300">
                                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                                                <span className="text-[10px] font-bold uppercase tracking-tighter mt-2">Belum ada PDF</span>
                                            </div>
                                        )}
                                    </div>
                                    {formData.serahTerimaPdf && (
                                        <button
                                            type="button"
                                            onClick={handleRemovePdf}
                                            className="absolute -top-3 -right-3 p-1.5 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors z-10"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    )}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                        Unggah dokumen serah terima dalam format PDF (Max. 1MB).
                                    </p>
                                    <input ref={pdfInputRef} type="file" accept="application/pdf" onChange={handlePdfChange} className="hidden" />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => pdfInputRef.current?.click()}
                                            disabled={uploadingPdf}
                                            className="px-4 py-2 bg-white dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
                                        >
                                            {uploadingPdf ? 'Mengupload...' : 'Pilih File PDF'}
                                        </button>
                                        {formData.serahTerimaPdf && (
                                            <a
                                                href={formData.serahTerimaPdf}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-2 shadow-sm"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                                Lihat PDF
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-[#f1f5f9] dark:border-[#334155]">
                    <button type="submit" disabled={loading || uploading || uploadingPdf} className="flex-1 px-8 py-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 font-bold flex items-center justify-center gap-3">
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


