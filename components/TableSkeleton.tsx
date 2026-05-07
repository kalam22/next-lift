export default function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-10 w-48 bg-gray-200 dark:bg-white/10 rounded-2xl" />
        <div className="flex gap-3">
          <div className="h-10 w-24 bg-gray-200 dark:bg-white/10 rounded-2xl" />
          <div className="h-10 w-32 bg-gray-200 dark:bg-white/10 rounded-2xl" />
        </div>
      </div>
      <div className="rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-white/5">
          <div className="h-10 w-72 bg-gray-200 dark:bg-white/10 rounded-2xl" />
        </div>
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="px-8 py-5 flex gap-6 items-center">
              <div className="h-4 w-4 bg-gray-200 dark:bg-white/10 rounded" />
              <div className="h-4 w-8 bg-gray-200 dark:bg-white/10 rounded" />
              <div className="h-4 flex-1 bg-gray-200 dark:bg-white/10 rounded" />
              <div className="h-4 w-28 bg-gray-200 dark:bg-white/10 rounded" />
              <div className="h-4 w-20 bg-gray-200 dark:bg-white/10 rounded" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
