'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Swal from 'sweetalert2'
import { logger } from '@/lib/logger'
import type { LiftFormData } from '@/types/lift'

const PT_OPTIONS = ['GPE', 'THS']
const DEPARTEMEN_OPTIONS = [
  'IT', 'Purchasing', 'Lantai 3', 'Geologis', 'Manager', 'Procurement',
  'Logistic', 'Sekretaris', 'Asset', 'Finance', 'Accounting', 'OB',
  'HRGA', 'Pajak', 'Plant', 'Security', 'Driver', 'Kasir', 'Legal', 'Leasing',
]
const LANTAI_OPTIONS = [3, 5, 7]

interface LiftFormProps {
  initialData?: Partial<LiftFormData>
  isEdit?: boolean
  liftId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function LiftForm({ initialData, isEdit = false, liftId, onSuccess, onCancel }: LiftFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<LiftFormData>({
    nama: initialData?.nama ?? '',
    pt: initialData?.pt ?? '',
    departemen: initialData?.departemen ?? '',
    berlaku: initialData?.berlaku ?? '',
    akses: initialData?.akses ?? [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEdit && liftId) {
        await axios.patch(`/api/lifts/${liftId}`, formData)
      } else {
        await axios.post('/api/lifts', formData)
      }
      Swal.fire({
        title: 'Berhasil!',
        text: `Data berhasil ${isEdit ? 'diperbarui' : 'dibuat'}.`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        buttonsStyling: false,
        customClass: {
          popup: '!rounded-2xl',
          title: '!font-bold',
        },
      })
      onSuccess?.()
    } catch (error: unknown) {
      logger.error('Error saving lift:', error)
      Swal.fire({
        title: 'Gagal!',
        text: 'Gagal menyimpan data. Silakan coba lagi.',
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

  const handleAksesChange = (lantai: number) => {
    setFormData((prev) => ({
      ...prev,
      akses: prev.akses.includes(lantai)
        ? prev.akses.filter((l) => l !== lantai)
        : [...prev.akses, lantai],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        {/* Nama Section */}
        <div className="md:col-span-2 space-y-3">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Nama lengkap..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white"
            />
          </div>
        </div>

        {/* PT Select */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
            Perusahaan (PT) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              required
              value={formData.pt}
              onChange={(e) => setFormData({ ...formData, pt: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white appearance-none"
            >
              <option value="">Pilih PT</option>
              {PT_OPTIONS.map((pt) => <option key={pt} value={pt}>{pt}</option>)}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {/* Departemen Select */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
            Departemen
          </label>
          <div className="relative">
            <select
              value={formData.departemen}
              onChange={(e) => setFormData({ ...formData, departemen: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white appearance-none"
            >
              <option value="">Pilih Departemen</option>
              {DEPARTEMEN_OPTIONS.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {/* Masa Berlaku Date */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
            Masa Berlaku
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <input
              type="date"
              value={formData.berlaku}
              onChange={(e) => setFormData({ ...formData, berlaku: e.target.value })}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white"
            />
          </div>
        </div>

        {/* Selection Tiles for Floor Access */}
        <div className="md:col-span-2 space-y-3">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
            Hak Akses Lantai
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {LANTAI_OPTIONS.map((lantai) => {
              const isSelected = formData.akses.includes(lantai);
              return (
                <div
                  key={lantai}
                  onClick={() => handleAksesChange(lantai)}
                  className={`
                    cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between group
                    ${isSelected
                      ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
                      : 'bg-gray-50 dark:bg-[#0f172a] border-[#f1f5f9] dark:border-[#334155] text-gray-400 hover:border-blue-200 dark:hover:border-blue-900/40'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                      <span className="text-xs">LT</span>
                    </div>
                    <span className="text-lg">Lantai {lantai}</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-[#e2e8f0] dark:border-[#334155]'}`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-[#f1f5f9] dark:border-[#334155]">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-8 py-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 font-bold flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              {isEdit ? 'Perbarui' : 'Daftarkan User'}
            </>
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3.5 bg-gray-50 dark:bg-[#0f172a] text-gray-600 dark:text-gray-400 rounded-2xl border border-[#f1f5f9] dark:border-[#334155] hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-bold"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  )
}
