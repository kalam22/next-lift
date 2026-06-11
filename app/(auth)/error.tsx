'use client'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="text-center space-y-4 max-w-md bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl">
        <h2 className="text-lg font-black text-gray-900 dark:text-white">
          Autentikasi Gagal
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Terjadi kesalahan saat login. Silakan coba lagi.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  )
}
