'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Swal from 'sweetalert2'
import { logger } from '@/lib/logger'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'
import { SITE_OPTIONS } from '@/lib/constants'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

interface HandoverFormData {
    tanggal: string
    barang: string
    pic: string
    site: string
    namaPenerima: string
    ttd: string
}

interface HandoverFormProps {
    initialData?: Partial<HandoverFormData>
    isEdit?: boolean
    handoverId?: string
    onSuccess?: () => void
    onCancel?: () => void
}

export default function HandoverForm({ initialData, isEdit = false, handoverId, onSuccess, onCancel }: HandoverFormProps) {
    const router = useRouter()
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [hasSignature, setHasSignature] = useState(false)
    const [formData, setFormData] = useState<HandoverFormData>({
        tanggal: '',
        barang: '',
        pic: '',
        site: '',
        namaPenerima: '',
        ttd: '',
    })

    useEffect(() => {
        if (initialData) {
            const handover = initialData
            setFormData({
                tanggal: handover.tanggal ? (typeof handover.tanggal === 'string' ? handover.tanggal.split('T')[0] : new Date(handover.tanggal).toISOString().split('T')[0]) : '',
                barang: handover.barang || '',
                pic: handover.pic || '',
                site: handover.site || '',
                namaPenerima: handover.namaPenerima || '',
                ttd: handover.ttd || '',
            })
            if (handover.ttd) {
                setHasSignature(true)
            }
        }
    }, [initialData])

    // Load initial signature to canvas if editing
    useEffect(() => {
        if (formData.ttd && canvasRef.current) {
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            if (ctx) {
                const img = new Image()
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height)
                    ctx.drawImage(img, 0, 0)
                }
                img.src = formData.ttd
            }
        }
    }, [formData.ttd])

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'

        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        let clientX = 0
        let clientY = 0

        if ('touches' in e) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = e.clientX
            clientY = e.clientY
        }

        const x = (clientX - rect.left) * scaleX
        const y = (clientY - rect.top) * scaleY

        ctx.beginPath()
        ctx.moveTo(x, y)
        setIsDrawing(true)
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        let clientX = 0
        let clientY = 0

        if ('touches' in e) {
            if (e.touches.length === 0) return
            e.preventDefault()
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = e.clientX
            clientY = e.clientY
        }

        const x = (clientX - rect.left) * scaleX
        const y = (clientY - rect.top) * scaleY

        ctx.lineTo(x, y)
        ctx.stroke()
        setHasSignature(true)
    }

    const stopDrawing = () => {
        setIsDrawing(false)
        saveSignatureData()
    }

    const saveSignatureData = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const dataUrl = canvas.toDataURL()
        setFormData(prev => ({ ...prev, ttd: dataUrl }))
    }

    const clearSignature = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setFormData(prev => ({ ...prev, ttd: '' }))
        setHasSignature(false)
    }

    const handleCancel = () => {
        if (onCancel) onCancel()
        else router.back()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const submitData = {
                tanggal: formData.tanggal,
                barang: formData.barang,
                pic: formData.pic.trim(),
                site: formData.site.trim(),
                namaPenerima: formData.namaPenerima.trim(),
                ttd: hasSignature ? formData.ttd : null,
            }

            if (isEdit && handoverId) {
                await axios.put(`/api/serah-terima/${handoverId}`, submitData)
                await Swal.fire({
                    title: 'Berhasil!',
                    text: 'Data Serah Terima berhasil diperbarui',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: {
                        popup: '!rounded-2xl',
                        title: '!font-bold',
                    },
                })
            } else {
                await axios.post('/api/serah-terima', submitData)
                await Swal.fire({
                    title: 'Berhasil!',
                    text: 'Data Serah Terima berhasil ditambahkan',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: {
                        popup: '!rounded-2xl',
                        title: '!font-bold',
                    },
                })
            }

            if (onSuccess) {
                onSuccess()
            } else {
                router.push('/serah-terima')
            }
        } catch (error: any) {
            logger.error('Error submitting handover form:', error)
            await Swal.fire({
                title: 'Gagal!',
                text: error.response?.data?.message || 'Gagal menyimpan data Serah Terima',
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
                {/* Tanggal */}
                <div className="space-y-3">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                        Tanggal <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="date" 
                        required 
                        value={formData.tanggal} 
                        onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })} 
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" 
                    />
                </div>

                {/* PIC */}
                <div className="space-y-3">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                        PIC <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        required 
                        value={formData.pic} 
                        onChange={(e) => setFormData({ ...formData, pic: e.target.value })} 
                        placeholder="Nama PIC..."
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" 
                    />
                </div>

                {/* Barang - Rich Text */}
                <div className="space-y-3 md:col-span-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                        Barang <span className="text-red-500">*</span>
                    </label>
                    <div className="quill-premium-wrapper">
                        <ReactQuill
                            theme="snow"
                            value={formData.barang}
                            onChange={(value) => setFormData(prev => ({ ...prev, barang: value }))}
                            placeholder="Ketik daftar barang yang diserahterimakan..."
                            modules={{
                                toolbar: [
                                    [{ 'header': [1, 2, 3, false] }],
                                    ['bold', 'italic', 'underline', 'strike'],
                                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                    ['clean']
                                ]
                            }}
                        />
                    </div>
                    <style>{`
                        .quill-premium-wrapper .ql-toolbar.ql-snow {
                            border-top-left-radius: 16px;
                            border-top-right-radius: 16px;
                            border-color: #f1f5f9;
                            background-color: #f8fafc;
                        }
                        .quill-premium-wrapper .ql-container.ql-snow {
                            border-bottom-left-radius: 16px;
                            border-bottom-right-radius: 16px;
                            border-color: #f1f5f9;
                            min-height: 200px;
                            font-size: 0.875rem;
                            font-family: inherit;
                        }
                        .dark .quill-premium-wrapper .ql-toolbar.ql-snow {
                            border-color: #334155;
                            background-color: #0f172a;
                        }
                        .dark .quill-premium-wrapper .ql-container.ql-snow {
                            border-color: #334155;
                            background-color: #0f172a;
                            color: #f8fafc;
                        }
                        .dark .quill-premium-wrapper .ql-stroke {
                            stroke: #94a3b8;
                        }
                        .dark .quill-premium-wrapper .ql-fill {
                            fill: #94a3b8;
                        }
                        .dark .quill-premium-wrapper .ql-picker {
                            color: #94a3b8;
                        }
                        .dark .quill-premium-wrapper .ql-picker-options {
                            background-color: #0f172a !important;
                            border-color: #334155 !important;
                        }
                    `}</style>
                </div>

                {/* Site */}
                <div className="space-y-3">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                        Site <span className="text-red-500">*</span>
                    </label>
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

                {/* Nama Penerima */}
                <div className="space-y-3">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                        Nama Penerima <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        required 
                        value={formData.namaPenerima} 
                        onChange={(e) => setFormData({ ...formData, namaPenerima: e.target.value })} 
                        placeholder="Nama penerima..." 
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white" 
                    />
                </div>

                {/* Tanda Tangan Canvas */}
                <div className="space-y-3 md:col-span-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                            Tanda Tangan digital (Draw Signature)
                        </label>
                        <button
                            type="button"
                            onClick={clearSignature}
                            className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                    <div className="relative border-2 border-dashed border-[#f1f5f9] dark:border-[#334155] rounded-2xl bg-white dark:bg-slate-900/50 overflow-hidden shadow-inner">
                        <canvas
                            ref={canvasRef}
                            width={600}
                            height={200}
                            className="w-full max-w-full aspect-[3/1] cursor-crosshair touch-none"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                        {!hasSignature && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gambarkan Tanda Tangan Anda di Sini</span>
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
                    {loading ? 'Menyimpan...' : isEdit ? 'Update Serah Terima' : 'Simpan Serah Terima'}
                </button>
            </div>
        </form>
    )
}
