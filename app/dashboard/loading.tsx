export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
      <div className="h-10 w-48 bg-gray-200 dark:bg-white/10 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 dark:bg-white/10 rounded-3xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-72 bg-gray-200 dark:bg-white/10 rounded-3xl" />
        ))}
      </div>
    </div>
  )
}
