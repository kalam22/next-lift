'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, Lock, Save, Eye, EyeOff, ArrowLeft, LogOut, ShieldCheck } from 'lucide-react'
import axios from 'axios'

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()

  const [profile, setProfile] = useState<{ name: string; username: string; role: string; createdAt: string } | null>(null)
  const [loading, setLoading] = useState(true)

  // Username form
  const [username, setUsername] = useState('')
  const [usernameLoading, setUsernameLoading] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [usernameSuccess, setUsernameSuccess] = useState('')

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/profile')
        setProfile(res.data)
        setUsername(res.data.username)
      } catch {
        // fallback ke session
        if (session?.user) {
          setUsername(session.user.username || '')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUsernameError('')
    setUsernameSuccess('')

    if (!username.trim()) {
      setUsernameError('Username tidak boleh kosong')
      return
    }
    if (username.trim() === profile?.username) {
      setUsernameError('Username sama dengan yang sekarang')
      return
    }

    setUsernameLoading(true)
    try {
      const res = await axios.put('/api/profile', { username: username.trim() })
      setProfile((prev) => prev ? { ...prev, username: res.data.username } : prev)
      setUsernameSuccess('Username berhasil diubah')
      // Update session agar sidebar ikut berubah
      await updateSession()
    } catch (err: any) {
      setUsernameError(err.response?.data?.error || 'Gagal mengubah username')
    } finally {
      setUsernameLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Semua field wajib diisi')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password tidak cocok')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Password baru minimal 6 karakter')
      return
    }

    setPasswordLoading(true)
    try {
      await axios.put('/api/profile', { currentPassword, newPassword })
      setPasswordSuccess('Password berhasil diubah')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Gagal mengubah password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const initials = getInitials(session?.user?.name)
  const roleLabel = profile?.role || session?.user?.role || '—'

  return (
    <div className="min-h-screen bg-[#f0f4f8] dark:bg-[#0a0a0a] p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] hover:bg-gray-50 dark:hover:bg-[#334155] transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#0f172a] dark:text-white uppercase tracking-tight">
              Profil <span className="text-primary">Saya</span>
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Kelola akun dan keamanan
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#e2e8f0] dark:border-[#334155] shadow-lg shadow-gray-200/50 dark:shadow-black/20 p-6">
          <div className="flex items-center gap-5">
            <div className="size-16 rounded-2xl bg-gradient-to-tr from-primary/20 to-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-black text-xl flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-5 w-40 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                  <div className="h-3 w-24 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                </div>
              ) : (
                <>
                  <p className="text-lg font-black text-[#0f172a] dark:text-white truncate">
                    {profile?.name || session?.user?.name}
                  </p>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    @{profile?.username || session?.user?.username}
                  </p>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-xl">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Ubah Username */}
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#e2e8f0] dark:border-[#334155] shadow-lg shadow-gray-200/50 dark:shadow-black/20 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10">
              <User className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-tight">
                Ubah Username
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Username digunakan untuk login
              </p>
            </div>
          </div>

          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            {usernameError && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl">
                <span className="text-xs font-bold text-red-600 dark:text-red-400">{usernameError}</span>
              </div>
            )}
            {usernameSuccess && (
              <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-2xl">
                <span className="text-xs font-bold text-green-600 dark:text-green-400">{usernameSuccess}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                Username Baru
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setUsernameError('')
                  setUsernameSuccess('')
                }}
                placeholder="username"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-2xl text-sm font-semibold text-[#0f172a] dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={usernameLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {usernameLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Simpan Username
            </button>
          </form>
        </div>

        {/* Ubah Password */}
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#e2e8f0] dark:border-[#334155] shadow-lg shadow-gray-200/50 dark:shadow-black/20 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-500/10">
              <Lock className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-tight">
                Ubah Password
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Minimal 6 karakter
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordError && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl">
                <span className="text-xs font-bold text-red-600 dark:text-red-400">{passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-2xl">
                <span className="text-xs font-bold text-green-600 dark:text-green-400">{passwordSuccess}</span>
              </div>
            )}

            {/* Password Lama */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                Password Lama
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError('') }}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 bg-gray-50 dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-2xl text-sm font-semibold text-[#0f172a] dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Baru */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                Password Baru
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordError('') }}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 bg-gray-50 dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-2xl text-sm font-semibold text-[#0f172a] dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError('') }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pr-11 bg-gray-50 dark:bg-[#0f172a] border rounded-2xl text-sm font-semibold text-[#0f172a] dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 transition-all ${
                    confirmPassword && newPassword !== confirmPassword
                      ? 'border-red-300 dark:border-red-500/50 focus:border-red-400 focus:ring-red-500/10'
                      : 'border-[#e2e8f0] dark:border-[#334155] focus:border-primary/50 focus:ring-primary/10'
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[10px] font-bold text-red-500 pl-1">Password tidak cocok</p>
              )}
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {passwordLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              Simpan Password
            </button>
          </form>
        </div>

        {/* Logout */}
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#e2e8f0] dark:border-[#334155] shadow-lg shadow-gray-200/50 dark:shadow-black/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-tight">
                Keluar dari Akun
              </p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                Sesi akan diakhiri
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98]"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
