'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Swal from 'sweetalert2'
import { logger } from '@/lib/logger'
import { useImageUpload } from '@/hooks/useImageUpload'
import type { EntityFormConfig } from '@/lib/forms/standard-entity-config'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FieldDef {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea'
  required?: boolean
  placeholder?: string
  min?: number
  max?: number
  isPassword?: boolean
  span?: number // col-span for grid (1 or 2)
  options?: readonly (string | { label: string; value: string })[]
  /** For PC/Laptop-style: append "GB" suffix on blur */
  appendGB?: boolean
}

interface StandardEntityFormProps {
  config: EntityFormConfig
  initialData?: Record<string, unknown>
  isEdit?: boolean
  entityId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const swalError = (title: string, text: string) => Swal.fire({
  title, text, icon: 'error', confirmButtonText: 'OK', buttonsStyling: false,
  customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' },
})

const swalSuccess = (isEdit: boolean, label: string) => Swal.fire({
  title: 'Berhasil!',
  text: `Data ${label} berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}`,
  icon: 'success', timer: 1500, showConfirmButton: false, buttonsStyling: false,
  customClass: { popup: '!rounded-2xl', title: '!font-bold' },
})

const inputClass =
  'w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white'

function appendGB(val: string): string {
  const t = val.trim()
  if (!t || /gb/i.test(t)) return t
  return `${t} GB`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StandardEntityForm({
  config, initialData, isEdit = false, entityId, onSuccess, onCancel,
}: StandardEntityFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentImageUrlRef = useRef<string>('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const { uploadImage, uploading } = useImageUpload({ maxSizeMB: 0.2, showCompressionInfo: true })

  const imageKey = config.imageKey || 'foto'

  // Build default form state from field definitions
  const buildDefaults = () => {
    const defaults: Record<string, string | number> = {}
    for (const f of config.fields) {
      defaults[f.key] = f.type === 'number' ? '' : ''
    }
    defaults[imageKey] = ''
    return defaults
  }

  const [formData, setFormData] = useState<Record<string, string | number>>(buildDefaults())

  useEffect(() => {
    if (initialData) {
      const mapped: Record<string, string | number> = {}
      for (const f of config.fields) {
        const v = initialData[f.key]
        if (f.type === 'date' && typeof v === 'string') {
          mapped[f.key] = v.split('T')[0]
        } else {
          mapped[f.key] = (v as string | number) ?? ''
        }
      }
      const img = initialData[imageKey] as string
      mapped[imageKey] = img || ''
      setFormData(mapped)
      if (img) setPreview(img)
      currentImageUrlRef.current = img || ''
    }
  }, [initialData]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: string, val: string | number) => setFormData(prev => ({ ...prev, [key]: val }))

  // ─── Image handlers ─────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      swalError('File Tidak Valid', 'Hanya file gambar yang diizinkan')
      return
    }
    try {
      const newUrl = await uploadImage(file, currentImageUrlRef.current)
      currentImageUrlRef.current = newUrl
      setPreview(newUrl)
      set(imageKey, newUrl)
    } catch (err) { logger.error('Upload failed:', err) }
  }

  const handleRemoveImage = async () => {
    if (currentImageUrlRef.current) {
      try { await axios.delete('/api/upload', { data: { url: currentImageUrlRef.current } }) } catch {}
    }
    setPreview(null)
    currentImageUrlRef.current = ''
    set(imageKey, '')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCancel = async () => {
    if (currentImageUrlRef.current) {
      const origImg = initialData?.[imageKey]
      if (!origImg || currentImageUrlRef.current !== origImg) {
        try { await axios.delete('/api/upload', { data: { url: currentImageUrlRef.current } }) } catch {}
      }
    }
    if (onCancel) onCancel()
    else router.back()
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = config.transformSubmit ? config.transformSubmit(formData) : formData
      if (isEdit && entityId) {
        await axios.put(`${config.apiPath}/${entityId}`, data)
      } else {
        await axios.post(config.apiPath, data)
      }
      swalSuccess(isEdit, config.label)
      if (onSuccess) onSuccess()
      else router.push(config.listPath)
    } catch (err: unknown) {
      logger.error('Submit failed:', err)
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      swalError('Gagal!', msg || `Gagal menyimpan data ${config.label}`)
    } finally { setLoading(false) }
  }

  // ─── Render field ───────────────────────────────────────────────────────────

  const renderField = (f: FieldDef) => {
    const val = formData[f.key] ?? ''
    const onChange = (v: string | number) => set(f.key, v)
    const cl = `${inputClass} ${f.type === 'select' ? 'appearance-none cursor-pointer' : ''}`

    switch (f.type) {
      case 'text':
      case 'number':
        return (
          <input
            type={f.type}
            required={f.required}
            min={f.min}
            value={val}
            onChange={e => onChange(e.target.value)}
            onBlur={f.appendGB ? e => onChange(appendGB(e.target.value)) : undefined}
            placeholder={f.placeholder}
            className={cl}
          />
        )
      case 'date':
        return <input type="date" required={f.required} value={val as string} onChange={e => onChange(e.target.value)} className={cl} />
      case 'select': {
        const opts = f.options || []
        return (
          <select required={f.required} value={val as string} onChange={e => onChange(e.target.value)} className={cl}>
            <option value="">{f.placeholder || 'Pilih...'}</option>
            {opts.map((o, i) => {
              if (typeof o === 'string') return <option key={o} value={o}>{o}</option>
              return <option key={o.value} value={o.value}>{o.label}</option>
            })}
          </select>
        )
      }
      case 'textarea':
        return <textarea required={f.required} value={val as string} onChange={e => onChange(e.target.value)} placeholder={f.placeholder} rows={3} className={`${cl} resize-none`} />
      default:
        return null
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="premium-card p-6 sm:p-8 lg:p-10 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {config.fields.map(f => (
          <div key={f.key} className={`space-y-3 ${f.span === 2 ? 'md:col-span-2' : ''}`}>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            {renderField(f)}
          </div>
        ))}

        {/* Foto */}
        <div className="space-y-3 md:col-span-2">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Foto</label>
          <div className="space-y-4">
            {preview ? (
              <div className="relative group">
                <img src={preview} alt="Preview" className="w-full max-w-md h-64 object-cover rounded-2xl border border-[#f1f5f9] dark:border-[#334155]" />
                <button type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all opacity-0 group-hover:opacity-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-[#f1f5f9] dark:border-[#334155] rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 transition-all">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-sm font-bold text-gray-400">{uploading ? 'Mengupload...' : 'Klik untuk upload foto'}</p>
                <p className="text-xs text-gray-500 mt-1">Max 5MB</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-4">
        <button type="button" onClick={handleCancel} aria-label="Batal" className="px-6 py-3 bg-gray-100 dark:bg-[#1e293b] text-gray-700 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-[#334155] transition-all">
          Batal
        </button>
        <button type="submit" disabled={loading || uploading} aria-label={isEdit ? `Update ${config.label}` : `Simpan ${config.label}`} className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Menyimpan...' : isEdit ? `Update ${config.label}` : `Simpan ${config.label}`}
        </button>
      </div>
    </form>
  )
}
