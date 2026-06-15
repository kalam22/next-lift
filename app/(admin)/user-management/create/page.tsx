'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { ArrowLeft, UserPlus, Save } from 'lucide-react'
import { MENU_PERMISSIONS } from '@/lib/security/permissions'

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

export default function CreateUserPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', username: '', password: '' })
  const [permissions, setPermissions] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      return {
        ...prev,
        [menuKey]: allSelected ? [] : [...availablePerms],
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await axios.post('/api/user-management', { ...form, permissions })
      router.push('/user-management')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal membuat user')
    } finally {
      setLoading(false)
    }
  }

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
            Tambah <span className="text-primary">User</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-[0.2em] opacity-60">
            Buat akun pengguna baru beserta hak akses
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: User Info */}
        <div className="lg:col-span-1">
          <div className="premium-card p-6">
            <h2 className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-widest mb-5">
              Informasi User
            </h2>

            <div className="space-y-4">
              {error && (
                <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl">
                  <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Budi Santoso"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-2xl text-sm font-semibold text-[#0f172a] dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Username</label>
                <input
                  type="text"
                  required
                  placeholder="budi"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-2xl text-sm font-semibold text-[#0f172a] dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-2xl text-sm font-semibold text-[#0f172a] dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Link
                  href="/user-management"
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                >
                  Batal
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  {loading ? 'Menyimpan...' : 'Buat User'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Permission Matrix */}
        <div className="lg:col-span-2">
          <div className="premium-card p-6">
            <h2 className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-widest mb-5">
              Hak Akses (Permission)
            </h2>

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
                                <span className="inline-block w-4 h-4 rounded bg-gray-100 dark:bg-white/5 opacity-20 mx-auto" />
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
          </div>
        </div>
      </form>
    </div>
  )
}
