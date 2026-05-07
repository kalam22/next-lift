'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { useResponsiveHeight, useResponsiveOuterRadius } from '@/hooks/use-responsive-height'

interface CategoryDistributionChartProps {
  data: Array<{ name: string; value: number; percentage: number }>
  title: string
}

const COLORS = ['#ec4899', '#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b']

// Custom legend yang rapi dan tidak overflow
const renderLegend = (props: any) => {
  const { payload } = props
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-3 px-2">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-1.5 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-[10px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 truncate max-w-[80px] sm:max-w-none">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function CategoryDistributionChart({ data, title }: CategoryDistributionChartProps) {
  const chartHeight = useResponsiveHeight()
  const outerRadius = useResponsiveOuterRadius()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl border-2 border-[#e2e8f0] dark:border-[#334155] shadow-lg shadow-gray-200/50 dark:shadow-black/20 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-black text-[#0f172a] dark:text-white uppercase tracking-tight mb-4 sm:mb-6">{title}</h3>
        <div className="flex items-center justify-center h-[250px] sm:h-[350px] text-gray-500 dark:text-gray-400">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest">Tidak ada data</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border-2 border-[#e2e8f0] dark:border-[#334155] shadow-lg shadow-gray-200/50 dark:shadow-black/20 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-black text-[#0f172a] dark:text-white uppercase tracking-tight mb-2 sm:mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            labelLine={false}
            label={false}
            outerRadius={outerRadius}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => {
              const v = typeof value === 'number' ? value : 0
              const item = data.find(d => d.name === String(name))
              return [`${v} unit (${item?.percentage ?? 0}%)`, name]
            }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #f1f5f9',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default React.memo(CategoryDistributionChart)
