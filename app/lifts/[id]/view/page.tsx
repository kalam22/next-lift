'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Swal from 'sweetalert2'
import { logger } from '@/lib/logger'
import ActivityLogPanel from '@/components/ActivityLogPanel'
import { usePermissions } from '@/hooks/usePermissions'
import type { Lift } from '@/types/lift'

const InfoRow = ({ label, value, highlight }: { label: string; value: string | null | undefined; highlight?: boolean }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-[#f1f5f9] dark:border-[#334155] last:border-0">
    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
    <span className={`text-xs font-bold ${highlight ? 'text-blue-600 dark:text-blue-400 uppercase tracking-widest' : 'text-gray-700 dark:text-gray-300'}`}>
      {value || '-'}
    </span>
  </div>
)

export default function ViewLift() {
  const router = useRouter()
  const params = useParams()
  const { canEdit } = usePermissions('lifts')
  const [lift, setLift] = useState<Lift | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLift()
    const interval = setInterval(() => fetchLift(), 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchLift = async () => {
    try {
      const response = await axios.get<Lift>(`/api/lifts/${params.id}`)
      setLift(response.data)
    } catch (error: unknown) {
      logger.error('Error fetching lift:', error)
      Swal.fire({
        title: 'Gagal!', text: 'Gagal memuat data. Silakan coba lagi.', icon: 'error',
        confirmButtonText: 'OK', buttonsStyling: false,
        customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' },
      }).then(() => router.push('/lifts'))
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Memuat detail user...</p>
    </div>
  )

  if (!lift) return null

  const isExpired = lift.berlaku && new Date(lift.berlaku) < new Date()

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/lifts" className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-white dark:hover:bg-[#1e293b] rounded-2xl border border-transparent hover:border-[#f1f5f9] dark:hover:border-[#334155] transition-all shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#0f172a] dark:text-white tracking-tight uppercase">{lift.nama}</h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Detail informasi dan hak akses user lift.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-full border flex items-center gap-2 ${isExpired ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
            <div className={`w-2 h-2 rounded-full ${isExpired ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{isExpired ? 'Masa Berlaku Habis' : 'User Aktif'}</span>
          </div>
          {canEdit && (
            <Link href={`/lifts/${lift.id}/edit`} className="px-4 py-2 bg-white dark:bg-[#1e293b] border border-[#f1f5f9] dark:border-[#334155] rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all shadow-sm">
              Edit Data
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Kolom Kiri: Profil */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 mb-4 border-4 border-white dark:border-[#1e293b] shadow-xl">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <h2 className="text-lg font-black text-[#0f172a] dark:text-white uppercase tracking-tight">{lift.nama}</h2>
            <span className="px-3 py-1 bg-gray-100 dark:bg-[#0f172a] rounded-lg text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">{lift.pt}</span>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Informasi</h3>
            </div>
            <InfoRow label="PT / Perusahaan" value={lift.pt} />
            <InfoRow label="Departemen" value={lift.departemen} />
            <InfoRow label="Masa Berlaku" value={lift.berlaku ? format(new Date(lift.berlaku), 'dd MMM yyyy', { locale: id }) : 'Permanen'} />
          </div>
        </div>

        {/* Kolom Kanan: Hak Akses + Kartu */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hak Akses Lantai */}
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f1f5f9] dark:border-[#334155] bg-gray-50/50 dark:bg-[#0f172a]/20 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-[10px] font-black text-[#0f172a] dark:text-white uppercase tracking-[0.2em]">Hak Akses Lantai</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[3, 5, 7].map((lantai) => {
                const hasAccess = Array.isArray(lift.aksesArray) && lift.aksesArray.map(String).includes(String(lantai))
                return (
                  <div key={lantai} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${hasAccess ? 'bg-blue-50/50 dark:bg-blue-500/5 border-blue-100 dark:border-blue-900/40' : 'bg-gray-50/30 dark:bg-gray-900/10 border-gray-100 dark:border-gray-800 opacity-60'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${hasAccess ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}>
                        LT{lantai}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${hasAccess ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>Lantai 0{lantai}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">{hasAccess ? 'Akses Diizinkan' : 'Akses Ditolak'}</span>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${hasAccess ? 'bg-blue-600 border-blue-600' : 'border-gray-200 dark:border-gray-800'}`}>
                      {hasAccess && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Kartu Akses */}
          <div className="bg-blue-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-blue-600/20">
            <div className="relative z-10">
              <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Sistem Keamanan IT</p>
              <h4 className="text-lg font-bold mb-1">Kartu Akses Terdaftar</h4>
              <p className="text-blue-100/60 text-xs font-medium max-w-xs">Hak Akses lift gedung GPE/THS.</p>
            </div>
            <svg className="w-24 h-24 text-white/10 absolute -right-4 -bottom-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" /></svg>
          </div>
        </div>
      </div>

      {/* Log Aktivitas — center */}
      <div className="flex justify-center">
        <div className="w-full max-w-xl">
          <ActivityLogPanel entityType="lift" entityId={lift.id} />
        </div>
      </div>

    </div>
  )
}
