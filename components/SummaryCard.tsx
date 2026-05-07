import React from 'react'

interface SummaryCardProps {
  title: string
  value: number
  subtitle: string
  trend?: 'up' | 'down'
  gradientColor: 'pink' | 'orange' | 'green' // Kept for backward compatibility, but will use primary color
}

function SummaryCard({ title, value, subtitle, trend, gradientColor }: SummaryCardProps) {
  // Menggunakan primary color dengan variasi opacity untuk semua card
  const gradientClasses = {
    pink: 'from-primary/20 to-primary-900/40',
    orange: 'from-primary/25 to-primary-800/40',
    green: 'from-primary/30 to-primary-700/40',
  }

  // Menggunakan primary color untuk semua text
  const textColors = {
    pink: 'text-primary',
    orange: 'text-primary',
    green: 'text-primary',
  }

  const gradientClass = gradientClasses[gradientColor]
  const textColor = textColors[gradientColor]

  return (
    <div className="relative overflow-hidden rounded-[2rem] border-2 border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] shadow-lg shadow-gray-200/50 dark:shadow-black/20 p-4 sm:p-6">
      {/* Gradient Background */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradientClass} rounded-full blur-3xl opacity-30`}></div>
      
      <div className="relative z-10">
        <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-bold uppercase tracking-widest mb-2">
          {title}
        </div>
        <div className={`text-2xl sm:text-3xl md:text-4xl font-black ${textColor} mb-2`}>
          {value.toLocaleString('id-ID')}
        </div>
        <div className="flex items-center gap-2">
          {trend === 'up' && (
            <span className="text-green-500 dark:text-green-400 text-xs font-bold">↑</span>
          )}
          {trend === 'down' && (
            <span className="text-red-500 dark:text-red-400 text-xs font-bold">↓</span>
          )}
          <span className="text-gray-600 dark:text-gray-400 text-xs font-bold">
            {subtitle}
          </span>
        </div>
      </div>
    </div>
  )
}

export default React.memo(SummaryCard)

