'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import Swal from 'sweetalert2'
import { ArrowLeft, Save, Key } from 'lucide-react'
import { MENU_PERMISSIONS, isSuperAdminRole } from '@/lib/security/permissions'

interface UserDetail {
  id: number
  name: string
  username: string
  role: string
  isActive: boolean
}

const MENU_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  lifts: 'Data Lift',
  laptops: 'Data Laptop',
  pcs: 'Data PC',
  mouse: 'Data Mouse',
  monitor: 'Data Monitor',
  ups: 'Data UPS',
  printer: 'Data Printer',
  tools_jaringan: 'Data Tools Jaringan',
  cctv: 'Data CCTV',
  storage: 'Data Storage',
  stock_move: 'Stock Move',
}

const ALL_PERMISSIONS = ['view', 'create', 'edit', 'delete', 'export', 'import', 'serah_terima'] as const

const PERM_LABELS: Record<string, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  export: 'Export',
  import: 'Import',
  serah_terima: 'Serah Terima',
}

export default function EditUserPage() {
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<UserDetail | null>(null)
  const [permissions, setPermissions] = useState<Record<string, string[]>>({})
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPermissions, setSavingPermissions] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUser()
    fetchPermissions()
  }, [userId])

  const fetchUser = async () => {
    try {
      const res = await axios.get(`/api/user-management/${userId}`)
      const u = res.data
      setUser(u)
      setName(u.name)
    } catch {
      setError('Gagal memuat data user')
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const res = await axios.get(`/api/user-management/${userId}/permissions`)
      setPermissions(res.data.permissions || {})
    } catch {
      // permissions may be empty
    }
  }

  const handlePermissionToggle = (menuKey: string, perm: string) => {
    setPermissions((prev) => {
      const current = prev[menuKey] || []
      const updated = current.includes(perm)
        ? current.filter((p) => p !== perm)
        : [...current, perm]
      return { ...prev, [menuKey]: updated }
    })
  }

  const handleSelectAllMenu = (menuKey: string, availablePerms: readonly string[]) => {
    setPermissions((prev) => {
      const current = prev[menuKey] || []
      const allSelected = availablePerms.every((p) => current.includes(p))
      return { ...prev, [menuKey]: allSelected ? [] : [...availablePerms] }
    })
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await axios.put(`/api/user-management/${userId}`, { name })
      Swal.fire({
        title: 'Berhasil!',
        text: 'Data user berhasil diperbarui.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: '!rounded-2xl' },
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal menyimpan data user')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePermissions = async () => {
    setSavingPermissions(true)
    try {
      await axios.put(`/api/user-management/${userId}/permissions`, { permissions })
      Swal.fire({
        title: 'Berhasil!',
        text: 'Permissions berhasil disimpan.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: '!rounded-2xl' },
      })
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal!',
        text: err.response?.data?.error || 'Gagal menyimpan permissions.',
        icon: 'error',
        confirmButtonText: 'OK',
        buttonsStyling: false,
        customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' },
      })
    } finally {
      setSavingPermissions(false)
    }
  }

  const handleResetPassword = async () => {
    const { value: newPassword } = await Swal.fire({
      title: 'Reset Password',
      input: 'password',
      inputLabel: 'Password baru (minimal 6 karakter)',
      inputPlaceholder: '••••••••',
      showCancelButton: true,
      confirmButtonText: 'Reset',
      cancelButtonText: 'Batal',
      buttonsStyling: false,
      customClass: {
        popup: '!rounded-2xl',
        title: '!font-bold',
        confirmButton: 'swal2-confirm',
        cancelButton: 'swal2-cancel',
      },
      inputValidator: (value) => {
        if (!value || value.length < 6) return 'Password minimal 6 karakter'
      },
    })

    if (!newPassword) return

    try {
      await axios.put(`/api/user-management/${userId}/password`, { newPassword })
      Swal.fire({
        title: 'Berhasil!',
        text: 'Password berhasil direset.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: '!rounded-2xl' },
      })
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal!',
        text: err.response?.data?.error || 'Gagal mereset password.',
        icon: 'error',
        confirmButtonText: 'OK',
        buttonsStyling: false,
        customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' },
      })
    }
  }

  if (loading) {
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

  const isThisSuperAdmin = isSuperAdminRole(user?.role)

  return (
    <div className="min-h-screen mesh-gradient dark:mesh-gradient-dark p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/user-management"
          className="p-2.5 bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-white/5 rounded-xl text-gray-400 hover:text-primary hover:scale-110 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black text-[#020617] dark:text-white tracking-tighter uppercase">
            Edit <span className="text-primary">User</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-[0.2em] opacity-60">
            {user?.username}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: User Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="premium-card p-6">
            <h2 className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-widest mb-5">
              Informasi User
            </h2>
            <form onSubmit={handleSaveUser} className="space-y-4">
              {error && (
                <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl">
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Username</label>
                <div className="px-4 py-3 bg-gray-100 dark:bg-white/5 rounded-2xl text-sm font-mono font-bold text-gray-500 dark:text-gray-400">
                  {user?.username}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</label>
                <div className="px-4 py-3 bg-gray-100 dark:bg-white/5 rounded-2xl text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">
                  {user?.role}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-2xl text-sm font-semibold text-[#0f172a] dark:text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Menyimpan...' : 'Simpan Nama'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
              <button
                onClick={handleResetPassword}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 rounded-2xl text-sm font-black uppercase tracking-widest transition-all"
              >
                <Key className="w-4 h-4" />
                Reset Password
              </button>
            </div>
          </div>
        </div>

        {/* Right: Permission Matrix */}
        <div className="lg:col-span-2">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-widest">
                Permission Matrix
              </h2>
              {!isThisSuperAdmin && (
                <button
                  onClick={handleSavePermissions}
                  disabled={savingPermissions}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
                >
                  {savingPermissions ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {savingPermissions ? 'Menyimpan...' : 'Simpan Permissions'}
                </button>
              )}
            </div>

            {isThisSuperAdmin ? (
              <div className="flex items-center gap-3 px-4 py-4 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-2xl">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  Super Admin memiliki akses penuh ke semua menu dan semua permission secara otomatis.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-black/10 uppercase font-black text-[9px] tracking-[0.2em] text-gray-400/80">
                      <th className="px-4 py-3 min-w-[160px]">Menu</th>
                      {ALL_PERMISSIONS.map((perm) => (
                        <th key={perm} className="px-3 py-3 text-center">{PERM_LABELS[perm] || perm}</th>
                      ))}
                      <th className="px-3 py-3 text-center">Semua</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/50 dark:divide-white/[0.02]">
                    {Object.entries(MENU_PERMISSIONS).map(([menuKey, availablePerms]) => {
                      const currentPerms = permissions[menuKey] || []
                      const allSelected = availablePerms.every((p) => currentPerms.includes(p))
                      return (
                        <tr key={menuKey} className="hover:bg-gray-50/30 dark:hover:bg-white/[0.01] transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-xs font-black text-[#0f172a] dark:text-white uppercase tracking-tight">
                              {MENU_LABELS[menuKey] || menuKey}
                            </span>
                          </td>
                          {ALL_PERMISSIONS.map((perm) => {
                            const isAvailable = availablePerms.includes(perm as any)
                            const isChecked = currentPerms.includes(perm)
                            return (
                              <td key={perm} className="px-3 py-3 text-center">
                                {isAvailable ? (
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handlePermissionToggle(menuKey, perm)}
                                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                                  />
                                ) : (
                                  <span className="inline-block w-4 h-4 rounded bg-gray-100 dark:bg-white/5 opacity-30 mx-auto" />
                                )}
                              </td>
                            )
                          })}
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={() => handleSelectAllMenu(menuKey, availablePerms)}
                              className="w-4 h-4 text-blue-500 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
