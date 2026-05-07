import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <p className="text-8xl font-black text-primary">404</p>
        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-2.5 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  )
}
