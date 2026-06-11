export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] dark:bg-[#0a0a0a]">
      <div className="text-center">
        <h1 className="text-6xl font-black text-gray-200 dark:text-gray-800">403</h1>
        <h2 className="text-2xl font-black text-[#0f172a] dark:text-white mt-4">Akses Ditolak</h2>
        <p className="text-gray-400 mt-2">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        <a
          href="/dashboard"
          className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors"
        >
          Kembali ke Dashboard
        </a>
      </div>
    </div>
  )
}
