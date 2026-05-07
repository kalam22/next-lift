'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Swal from 'sweetalert2'
import { logger } from '@/lib/logger'
import type { Lift } from '@/types/lift'

export default function ViewLift() {
  const router = useRouter()
  const params = useParams()
  const [lift, setLift] = useState<Lift | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLift()
  }, [])

  const fetchLift = async () => {
    try {
      const response = await axios.get<Lift>(`/api/lifts/${params.id}`)
      setLift(response.data)
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
      }).then(() => {
        router.push('/lifts')
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm font-medium">Memuat detail user...</p>
      </div>
    )
  }

  if (!lift) return null

  const isExpired = lift.berlaku && new Date(lift.berlaku) < new Date()

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
            <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight">{lift.nama.toUpperCase()}</h1>
            <p className="text-sm text-gray-400 font-medium">Detail informasi dan hak akses user lift.</p>
          </div>
        </div>
        <div className="flex items-center justify-center sm:justify-start gap-3">
          <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 ${isExpired ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'
            }`}>
            <div className={`w-2 h-2 rounded-full ${isExpired ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-xs font-black uppercase tracking-widest">{isExpired ? 'Masa Berlaku Habis' : 'User Aktif'}</span>
          </div>
          <Link
            href={`/lifts/${lift.id}/edit`}
            className="px-4 py-2 bg-white dark:bg-[#1e293b] border border-[#f1f5f9] dark:border-[#334155] rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all shadow-sm"
          >
            Edit Data
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm p-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 mb-4 border-4 border-white dark:border-[#1e293b] shadow-xl">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-[#0f172a] dark:text-white uppercase tracking-tight">{lift.nama}</h2>
            <span className="px-3 py-1 bg-gray-100 dark:bg-[#0f172a] rounded-lg text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">{lift.pt}</span>

            <div className="w-full mt-8 pt-8 border-t border-[#f1f5f9] dark:border-[#334155] space-y-4">
              <div className="flex justify-between items-center text-left">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Departemen</span>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{lift.departemen || '-'}</span>
              </div>
              <div className="flex justify-between items-center text-left">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Masa Berlaku</span>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                  {lift.berlaku ? format(new Date(lift.berlaku), 'dd MMM yyyy', { locale: id }) : 'Permanen'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Access Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#f1f5f9] dark:border-[#334155] bg-gray-50/50 dark:bg-[#0f172a]/20 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-[0.1em]">Hak Akses Lantai</h3>
            </div>
            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[3, 5, 7].map((lantai) => {
                const hasAccess = Array.isArray(lift.aksesArray) && lift.aksesArray.map(String).includes(String(lantai))
                return (
                  <div key={lantai} className={`p-4 rounded-2xl border flex items-center justify-between group transition-all ${hasAccess
                    ? 'bg-blue-50/50 dark:bg-blue-500/5 border-blue-100 dark:border-blue-900/40'
                    : 'bg-gray-50/30 dark:bg-gray-900/10 border-gray-100 dark:border-gray-800 opacity-60'
                    }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${hasAccess ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                        }`}>
                        LT{lantai}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${hasAccess ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>Lantai 0{lantai}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">{hasAccess ? 'Akses Diizinkan' : 'Akses Ditolak'}</span>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${hasAccess ? 'bg-blue-600 border-blue-600' : 'border-gray-200 dark:border-gray-800'}`}>
                      {hasAccess && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-600/20">
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em]">Sistem Keamanan IT</p>
                <h4 className="text-lg font-bold">Kartu Akses Terdaftar</h4>
                <p className="text-blue-100/60 text-xs font-medium max-w-xs">Data ini tersinkronisasi langsung dengan terminal lift gedung GPE/THS.</p>
              </div>
              <svg className="w-16 h-16 text-white/10 absolute -right-4 -bottom-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" /></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
