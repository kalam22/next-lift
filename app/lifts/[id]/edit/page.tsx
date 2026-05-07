'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import Swal from 'sweetalert2'
import { logger } from '@/lib/logger'
import type { Lift, LiftFormData } from '@/types/lift'

const PT_OPTIONS = ['GPE', 'THS']
const DEPARTEMEN_OPTIONS = [
  'IT', 'Purchasing', 'Lantai 3', 'Geologis', 'Manager', 'Procurement',
  'Logistic', 'Sekretaris', 'Asset', 'Finance', 'Accounting', 'OB',
  'HRGA', 'Pajak', 'Plant', 'Security', 'Driver', 'Kasir', 'Legal',
]
const LANTAI_OPTIONS = [3, 5, 7]

export default function EditLift() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<LiftFormData>({
    nama: '',
    pt: '',
    departemen: '',
    berlaku: '',
    akses: [],
  })

  useEffect(() => {
    fetchLift()
  }, [])

  const fetchLift = async () => {
    try {
      const response = await axios.get<Lift>(`/api/lifts/${params.id}`)
      const lift = response.data
      setFormData({
        nama: lift.nama,
        pt: lift.pt,
        departemen: lift.departemen || '',
        berlaku: lift.berlaku ? (typeof lift.berlaku === 'string' ? lift.berlaku.split('T')[0] : new Date(lift.berlaku).toISOString().split('T')[0]) : '',
        akses: Array.isArray(lift.aksesArray) ? lift.aksesArray.map(Number) : [],
      })
    } catch (error: unknown) {
      logger.error('Error fetching lift:', error)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await axios.put(`/api/lifts/${params.id}`, formData)
      Swal.fire({
        title: 'Berhasil!',
        text: 'Data berhasil diupdate.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        buttonsStyling: false,
        customClass: {
          popup: '!rounded-2xl',
          title: '!font-bold',
        },
      }).then(() => {
        router.push('/lifts')
      })
    } catch (error: unknown) {
      logger.error('Error updating lift:', error)
      Swal.fire({
        title: 'Gagal!',
        text: 'Gagal mengupdate data. Silakan coba lagi.',
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
      setSaving(false)
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
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center justify-center sm:justify-start gap-4">
          <Link
            href="/lifts"
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white dark:hover:bg-[#1e293b] rounded-xl border border-transparent hover:border-[#f1f5f9] dark:hover:border-[#334155] transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight">Edit Data User</h1>
            <p className="text-sm text-gray-400 font-medium">Perbarui hak akses lift pengguna ini.</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-10">
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
              disabled={saving}
              className="flex-1 px-8 py-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 font-bold flex items-center justify-center gap-3"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Simpan Perubahan
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-3.5 bg-gray-50 dark:bg-[#0f172a] text-gray-600 dark:text-gray-400 rounded-2xl border border-[#f1f5f9] dark:border-[#334155] hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-bold"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
