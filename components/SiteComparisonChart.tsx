'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useResponsiveHeight, useResponsiveFontSize, useResponsiveMargin, useResponsiveYAxisWidth } from '@/hooks/use-responsive-height'

interface SiteComparisonChartProps {
  data: Array<{ site: string; masuk: number; keluar: number }>
  title: string
}

function SiteComparisonChart({ data, title }: SiteComparisonChartProps) {
  const chartHeight = useResponsiveHeight()
  const fontSize = useResponsiveFontSize()
  const margin = useResponsiveMargin()
  const yAxisWidth = useResponsiveYAxisWidth()
  const [xAxisHeight, setXAxisHeight] = React.useState(80)
  const [xAxisAngle, setXAxisAngle] = React.useState(-45)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const updateResponsive = () => {
      const mobile = window.innerWidth < 640
      setIsMobile(mobile)
      setXAxisHeight(mobile ? 100 : 80)
      setXAxisAngle(mobile ? -90 : -45)
    }
    updateResponsive()
    window.addEventListener("resize", updateResponsive)
    return () => window.removeEventListener("resize", updateResponsive)
  }, [])

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
      <h3 className="text-base sm:text-lg font-black text-[#0f172a] dark:text-white uppercase tracking-tight mb-4 sm:mb-6">{title}</h3>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-[#334155]" />
          <XAxis 
            dataKey="site" 
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize }}
            angle={xAxisAngle}
            textAnchor={isMobile ? 'end' : 'end'}
            height={xAxisHeight}
            interval={0}
          />
          <YAxis 
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize }}
            width={yAxisWidth}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #f1f5f9',
              borderRadius: '12px',
              fontSize: isMobile ? '10px' : '12px',
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: isMobile ? '10px' : '20px' }}
            iconSize={isMobile ? 12 : 14}
            fontSize={isMobile ? 10 : 12}
          />
          <Bar dataKey="masuk" fill="#ec4899" name="Barang Masuk" radius={[8, 8, 0, 0]} />
          <Bar dataKey="keluar" fill="#f97316" name="Barang Keluar" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default React.memo(SiteComparisonChart)

