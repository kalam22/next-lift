import React from 'react'
import { formatWITA } from '@/lib/date-utils'

interface Activity {
  menu: string
  item: string
  action: 'masuk' | 'keluar'
  quantity: number
  site: string
  timestamp: string
  updatedAt: string
}

interface RecentActivityListProps {
  activities: Activity[]
  title: string
}

function RecentActivityList({ activities, title }: RecentActivityListProps) {
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(Math.abs(diffMs) / 60000)
    const diffHours = Math.floor(Math.abs(diffMs) / 3600000)
    const diffDays = Math.floor(Math.abs(diffMs) / 86400000)

    // Handle negative time (future dates or very old dates)
    const prefix = diffMs < 0 ? '-' : ''

    if (diffMins < 60) {
      return `${prefix}${diffMins} menit lalu`
    } else if (diffHours < 24) {
      return `${prefix}${diffHours} jam lalu`
    } else if (diffDays < 7) {
      return `${prefix}${diffDays} hari lalu`
    } else {
      return formatWITA(timestamp)
    }
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl border-2 border-[#e2e8f0] dark:border-[#334155] shadow-lg shadow-gray-200/50 dark:shadow-black/20 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-black text-[#0f172a] dark:text-white uppercase tracking-tight mb-4 sm:mb-6">{title}</h3>
        <div className="flex items-center justify-center h-[250px] sm:h-[350px] text-gray-500 dark:text-gray-400">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest">Tidak ada aktivitas</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border-2 border-[#e2e8f0] dark:border-[#334155] shadow-lg shadow-gray-200/50 dark:shadow-black/20 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-black text-[#0f172a] dark:text-white uppercase tracking-tight mb-4 sm:mb-6">{title}</h3>
      <div className="space-y-3 sm:space-y-4">
        {activities.map((activity, index) => (
          <div
            key={index}
            className={`relative pl-3 sm:pl-4 border-l-4 ${
              activity.action === 'masuk'
                ? 'border-green-500'
                : 'border-red-500'
            } bg-gray-50 dark:bg-[#0f172a]/40 rounded-2xl p-3 sm:p-4`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-tight mb-1 truncate">
                  {activity.item}
                </h4>
                <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest truncate">
                  {activity.menu}
                </p>
              </div>
              <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-bold whitespace-nowrap">
                {formatTimeAgo(activity.timestamp)}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 sm:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    activity.action === 'masuk'
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                  }`}
                >
                  {activity.action === 'masuk' ? 'Masuk' : 'Keluar'}
                </span>
                {activity.site && (
                  <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest truncate">
                    {activity.site}
                  </span>
                )}
              </div>
              <span
                className={`text-xs sm:text-sm font-black ${
                  activity.action === 'masuk'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {activity.action === 'masuk' ? '+' : '-'}{activity.quantity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default React.memo(RecentActivityList)

