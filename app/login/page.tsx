'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
    // Prevent redirect loops — never redirect back to /login or /
    const safeCallbackUrl = (callbackUrl === '/login' || callbackUrl === '/') ? '/dashboard' : callbackUrl

    const [form, setForm] = useState({ username: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await signIn('credentials', {
                username: form.username.trim(),
                password: form.password,
                redirect: false,
            })

            if (result?.error) {
                setError(result.error)
            } else {
                router.push(safeCallbackUrl)
                router.refresh()
            }
        } catch {
            setError('Terjadi kesalahan. Silakan coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#f0f4f8] dark:bg-[#0a0a0a] flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative">
                {/* Card */}
                <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-[#e2e8f0] dark:border-[#1e293b] shadow-xl shadow-gray-200/50 dark:shadow-black/30 overflow-hidden">

                    {/* Header */}
                    <div className="px-8 pt-10 pb-8 border-b border-[#f1f5f9] dark:border-[#1e293b]">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex aspect-square size-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                                <span className="font-black text-sm tracking-tighter">GPE</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-[#0f172a] dark:text-white tracking-tight uppercase">
                                    IT Infrastruktur
                                </h1>
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                                    Control Panel
                                </p>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#0f172a] dark:text-white tracking-tight">
                                Selamat Datang
                            </h2>
                            <p className="text-sm font-medium text-gray-400 mt-1">
                                Login ke akun Anda untuk melanjutkan
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">

                        {/* Error message */}
                        {error && (
                            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl">
                                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Username */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                                Username
                            </label>
                            <input
                                type="text"
                                required
                                autoComplete="username"
                                placeholder="Masukkan Username"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-2xl text-sm font-semibold text-[#0f172a] dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    placeholder="Masukkan Password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="w-full px-4 py-3.5 pr-12 bg-gray-50 dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-2xl text-sm font-semibold text-[#0f172a] dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 disabled:cursor-not-allowed active:scale-[0.98] mt-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Login...</span>
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    <span>Login</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="px-8 pb-8">
                        <p className="text-center text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-widest">
                            IT Infrastruktur GPE © {new Date().getFullYear()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
