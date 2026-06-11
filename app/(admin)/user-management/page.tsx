'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import Swal from 'sweetalert2'
import { Users, Plus, Edit, Trash2, Wifi, WifiOff, Clock } from 'lucide-react'
import { isSuperAdminRole } from '@/lib/permissions'

interface User {
  id: number
  name: string
  username: string
  role: string
  isActive: boolean
  lastLoginAt: string | null
  lastActiveAt: string | null
  createdAt: string
  _count: { permissions: number }
}

function isOnline(lastActiveAt: string | null): boolean {
  if (!lastActiveAt) return false
  return Date.now() - new Date(lastActiveAt).getTime() < 5 * 60 * 1000
}

function formatLastLogin(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Baru saja'
  if (diffMin < 60) return `${diffMin}m lalu`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}j lalu`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}h lalu`
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function UserManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !isSuperAdminRole(session.user.role)) {
      router.push('/403')
      return
    }
    fetchUsers()
  }, [session, status])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/user-management')
      setUsers(res.data.data)
    } catch {
      setError('Gagal memuat daftar user')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (user: User) => {
    const action = user.isActive ? 'menonaktifkan' : 'mengaktifkan'
    const result = await Swal.fire({
      title: `${user.isActive ? 'Nonaktifkan' : 'Aktifkan'} User?`,
      text: `Apakah Anda yakin ingin ${action} user "${user.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya',
      cancelButtonText: 'Batal',
      buttonsStyling: false,
      customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm', cancelButton: 'swal2-cancel' },
    })
    if (!result.isConfirmed) return

    try {
      await axios.patch(`/api/user-management/${user.id}`)
      await fetchUsers()
      Swal.fire({ title: 'Berhasil!', text: `User berhasil di${action}.`, icon: 'success', timer: 1500, showConfirmButton: false, customClass: { popup: '!rounded-2xl' } })
    } catch (err: any) {
      Swal.fire({ title: 'Gagal!', text: err.response?.data?.error || `Gagal ${action} user.`, icon: 'error', confirmButtonText: 'OK', buttonsStyling: false, customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' } })
    }
  }

  const handleDelete = async (user: User) => {
    const result = await Swal.fire({
      title: 'Hapus User?',
      text: `User "${user.name}" akan dihapus permanen beserta semua permission-nya. Tindakan ini tidak dapat dibatalkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
      buttonsStyling: false,
      customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm', cancelButton: 'swal2-cancel' },
    })
    if (!result.isConfirmed) return

    try {
      await axios.delete(`/api/user-management/${user.id}`)
      await fetchUsers()
      Swal.fire({ title: 'Berhasil!', text: 'User berhasil dihapus.', icon: 'success', timer: 1500, showConfirmButton: false, customClass: { popup: '!rounded-2xl' } })
    } catch (err: any) {
      Swal.fire({ title: 'Gagal!', text: err.response?.data?.error || 'Gagal menghapus user.', icon: 'error', confirmButtonText: 'OK', buttonsStyling: false, customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' } })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen mesh-gradient dark:mesh-gradient-dark p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black text-[#020617] dark:text-white tracking-tighter uppercase">
            User <span className="text-primary">Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-[0.2em] opacity-60">
            Kelola akun dan hak akses pengguna
          </p>
        </div>
        <Link
          href="/user-management/create"
          className="btn-premium flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3.5 bg-primary hover:bg-primary/90 shadow-primary/25 text-[10px] sm:text-[11px]"
        >
          <Plus className="w-4 h-4" />
          <span className="uppercase tracking-widest">Tambah User</span>
        </Link>
      </div>

      {/* Table */}
      <div className="premium-card overflow-hidden">
        {error ? (
          <div className="p-12 text-center">
            <p className="text-sm font-bold text-red-500">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50/30 dark:bg-black/10 uppercase font-black text-[10px] tracking-[0.25em] text-gray-400/80">
                  <th className="px-6 lg:px-8 py-5 lg:py-6">NO</th>
                  <th className="px-6 lg:px-8 py-5 lg:py-6">NAMA</th>
                  <th className="px-6 lg:px-8 py-5 lg:py-6">USERNAME</th>
                  <th className="px-6 lg:px-8 py-5 lg:py-6">PERMISSIONS</th>
                  <th className="px-6 lg:px-8 py-5 lg:py-6">ONLINE</th>
                  <th className="px-6 lg:px-8 py-5 lg:py-6">LAST LOGIN</th>
                  <th className="px-6 lg:px-8 py-5 lg:py-6">STATUS</th>
                  <th className="px-6 lg:px-8 py-5 lg:py-6 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/50 dark:divide-white/[0.02]">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-50">
                        <Users className="w-12 h-12 text-gray-300" />
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">No Users Found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={user.id} className="group hover:bg-primary/5/30 dark:hover:bg-primary/50/[0.02] transition-all duration-300">
                      <td className="px-6 lg:px-8 py-5 lg:py-6">
                        <span className="text-xs font-black text-gray-500 dark:text-gray-400">{index + 1}</span>
                      </td>
                      <td className="px-6 lg:px-8 py-5 lg:py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[#020617] dark:text-white uppercase tracking-tight">{user.name}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isSuperAdminRole(user.role) ? 'text-purple-500' : 'text-gray-400'}`}>
                            {user.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 lg:px-8 py-5 lg:py-6">
                        <span className="text-xs font-mono font-bold text-primary">{user.username}</span>
                      </td>
                      <td className="px-6 lg:px-8 py-5 lg:py-6">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                          {isSuperAdminRole(user.role) ? (
                            <span className="text-purple-500 font-black">All Access</span>
                          ) : (
                            `${user._count.permissions} permissions`
                          )}
                        </span>
                      </td>
                      {/* Online/Offline Status */}
                      <td className="px-6 lg:px-8 py-5 lg:py-6">
                        {isOnline(user.lastActiveAt) ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ring-1 ring-inset bg-green-500/5 text-green-600 ring-green-500/10">
                            <Wifi className="w-3 h-3" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Online</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ring-1 ring-inset bg-gray-100/50 dark:bg-white/5 text-gray-400 ring-gray-200/50 dark:ring-white/5">
                            <WifiOff className="w-3 h-3" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Offline</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                          </div>
                        )}
                      </td>
                      {/* Last Login */}
                      <td className="px-6 lg:px-8 py-5 lg:py-6">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {formatLastLogin(user.lastLoginAt)}
                          </span>
                        </div>
                      </td>
                      {/* Active/Inactive Status */}
                      <td className="px-6 lg:px-8 py-5 lg:py-6">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ring-1 ring-inset text-[9px] font-black uppercase tracking-widest ${
                          user.isActive
                            ? 'bg-green-500/5 text-green-600 ring-green-500/20'
                            : 'bg-red-500/5 text-red-500 ring-red-500/20'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          {user.isActive ? 'Aktif' : 'Nonaktif'}
                        </div>
                      </td>
                      <td className="px-6 lg:px-8 py-5 lg:py-6">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/user-management/${user.id}/edit`}
                            className="p-2.5 bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-white/5 rounded-xl text-gray-400 hover:text-amber-500 hover:scale-110 hover:shadow-xl hover:shadow-amber-500/10 transition-all"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          {String(user.id) !== session?.user?.id && (
                            <>
                              <button
                                onClick={() => handleToggleActive(user)}
                                className="relative inline-flex items-center group"
                                title={user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                              >
                                <span className={`block w-8 h-[18px] rounded-full transition-colors duration-200 ease-in-out ${
                                  user.isActive
                                    ? 'bg-green-500 group-hover:bg-green-600'
                                    : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400'
                                }`}>
                                  <span className={`block w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
                                    user.isActive ? 'translate-x-[17px]' : 'translate-x-px'
                                  }`} />
                                </span>
                              </button>
                              <button
                                onClick={() => handleDelete(user)}
                                className="p-2.5 bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-white/5 rounded-xl text-gray-400 hover:text-red-500 hover:scale-110 hover:shadow-xl hover:shadow-red-500/10 transition-all"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
