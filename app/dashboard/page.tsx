'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import axios from 'axios'
import { logger } from '@/lib/logger'
import SummaryCard from '@/components/SummaryCard'
import RecentActivityList from '@/components/RecentActivityList'

// Lazy load chart components untuk mengurangi initial bundle size
const ComparisonChart = dynamic(() => import('@/components/ComparisonChart'), {
  ssr: false,
  loading: () => (
    <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] border-2 border-[#e2e8f0] dark:border-[#334155] shadow-lg shadow-gray-200/50 dark:shadow-black/20 p-4 sm:p-6">
      <div className="h-[250px] sm:h-[350px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border-2 border-primary/10 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Loading Chart...</span>
        </div>
      </div>
    </div>
  ),
})

const CategoryDistributionChart = dynamic(() => import('@/components/CategoryDistributionChart'), {
  loading: () => (
    <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] border-2 border-[#e2e8f0] dark:border-[#334155] shadow-lg shadow-gray-200/50 dark:shadow-black/20 p-4 sm:p-6">
      <div className="h-[250px] sm:h-[350px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border-2 border-primary/10 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Loading Chart...</span>
        </div>
      </div>
    </div>
  ),
  ssr: false,
})

const SiteComparisonChart = dynamic(() => import('@/components/SiteComparisonChart'), {
  loading: () => (
    <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] border-2 border-[#e2e8f0] dark:border-[#334155] shadow-lg shadow-gray-200/50 dark:shadow-black/20 p-4 sm:p-6">
      <div className="h-[250px] sm:h-[350px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border-2 border-primary/10 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Loading Chart...</span>
        </div>
      </div>
    </div>
  ),
  ssr: false,
})

const SiteDistributionChart = dynamic(() => import('@/components/SiteDistributionChart'), {
  loading: () => (
    <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] border-2 border-[#e2e8f0] dark:border-[#334155] shadow-lg shadow-gray-200/50 dark:shadow-black/20 p-4 sm:p-6">
      <div className="h-[250px] sm:h-[350px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border-2 border-primary/10 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Loading Chart...</span>
        </div>
      </div>
    </div>
  ),
  ssr: false,
})

interface DashboardData {
  summary: {
    totalMasuk: number
    totalKeluar: number
    stokSaatIni: number
  }
  perMenu: {
    mouse: { masuk: number; keluar: number; stok: number }
    monitor: { masuk: number; keluar: number; stok: number }
    ups: { masuk: number; keluar: number; stok: number }
    printer: { masuk: number; keluar: number; stok: number }
    toolsJaringan: { masuk: number; keluar: number; stok: number }
    pcs: { masuk: number; keluar: number; stok: number }
    laptops: { masuk: number; keluar: number; stok: number }
  }
  monthlyComparison: Array<{ month: string; masuk: number; keluar: number }>
  categoryDistribution: Array<{ name: string; value: number; percentage: number }>
  recentActivity: Array<{
    menu: string
    item: string
    action: 'masuk' | 'keluar'
    quantity: number
    site: string
    pic: string
    timestamp: string
    updatedAt: string
  }>
  siteComparison: Array<{ site: string; masuk: number; keluar: number }>
  siteDistribution: Array<{ name: string; value: number; percentage: number }>
}

export default function DashboardPage() {
  // Get default month (current month)
  const getDefaultMonth = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    return `${year}-${String(month).padStart(2, '0')}`
  }

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedMonth, setSelectedMonth] = useState<string>(getDefaultMonth())
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // Memoize month options (12 months back from current)
  const monthOptions = useMemo(() => {
    const options = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth()
      const monthName = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      const value = `${year}-${String(month + 1).padStart(2, '0')}`
      options.push({ value, label: monthName })
    }
    return options
  }, [])

  // Memoize year options (5 years back from current)
  const yearOptions = useMemo(() => {
    const options = []
    const currentYear = new Date().getFullYear()
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i
      options.push({ value: year, label: year.toString() })
    }
    return options
  }, [])

  // Memoize subtitle untuk summary cards
  const summarySubtitle = useMemo(() => {
    if (period === 'monthly' && selectedMonth) {
      return monthOptions.find((opt) => opt.value === selectedMonth)?.label || 'Bulan ini'
    } else if (period === 'yearly') {
      return `${selectedYear}`
    }
    return 'Tahun ini'
  }, [period, selectedMonth, selectedYear, monthOptions])

  // Wrap fetchData dengan useCallback untuk mencegah re-render berlebihan
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('period', period)
      
      if (period === 'monthly' && selectedMonth) {
        params.append('month', selectedMonth)
      } else if (period === 'yearly') {
        params.append('year', selectedYear.toString())
      }
      
      const response = await axios.get(`/api/dashboard?${params.toString()}`)
      setData(response.data)
      setError(null)
    } catch (err: unknown) {
      logger.error('Error fetching dashboard data:', err)
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      setError(errorMessage || 'Gagal memuat data dashboard')
    } finally {
      setLoading(false)
    }
  }, [period, selectedMonth, selectedYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Loading Dashboard...</span>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wide block">Error</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">{error}</span>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-primary tracking-tighter uppercase mb-2">
              Dashboard Inventory
            </h1>
            <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Monitoring Aktivitas Barang
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-3">
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-4 py-2 sm:px-6 sm:py-3 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all ${
                period === 'monthly'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white dark:bg-[#1e293b] border-2 border-[#e2e8f0] dark:border-[#334155] text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 shadow-md'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              className={`px-4 py-2 sm:px-6 sm:py-3 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all ${
                period === 'yearly'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white dark:bg-[#1e293b] border-2 border-[#e2e8f0] dark:border-[#334155] text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 shadow-md'
              }`}
            >
              Tahunan
            </button>
          </div>
        </div>

        {/* Month/Year Selector */}
        {period === 'monthly' && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">
              Pilih Bulan:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 sm:flex-initial min-w-0 sm:min-w-[200px] px-4 py-3 bg-white dark:bg-[#1e293b] border-2 border-[#e2e8f0] dark:border-[#334155] rounded-2xl text-sm font-bold text-[#0f172a] dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none appearance-none cursor-pointer shadow-md"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {period === 'yearly' && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">
              Pilih Tahun:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="flex-1 sm:flex-initial min-w-0 sm:min-w-[150px] px-4 py-3 bg-white dark:bg-[#1e293b] border-2 border-[#e2e8f0] dark:border-[#334155] rounded-2xl text-sm font-bold text-[#0f172a] dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none appearance-none cursor-pointer shadow-md"
            >
              {yearOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="flex justify-center gap-4 sm:gap-6">
        <div className="w-full max-w-sm">
          <SummaryCard
            title="Total Barang Masuk"
            value={data.summary.totalMasuk}
            subtitle={summarySubtitle}
            trend="up"
            gradientColor="pink"
          />
        </div>
        <div className="w-full max-w-sm">
          <SummaryCard
            title="Total Barang Keluar"
            value={data.summary.totalKeluar}
            subtitle={summarySubtitle}
            trend="down"
            gradientColor="orange"
          />
        </div>
      </div>

      {/* Comparison Charts: Perbandingan Barang Masuk & Keluar and Perbandingan Site */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ComparisonChart
          data={data.monthlyComparison}
          title="Perbandingan Barang Masuk & Keluar"
          period={period}
        />
        <SiteComparisonChart
          data={data.siteComparison}
          title="Perbandingan Site"
        />
      </div>

      {/* Distribution Charts: Distribusi Kategori Barang and Distribusi Site */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <CategoryDistributionChart
          data={data.categoryDistribution}
          title="Distribusi Kategori Barang"
        />
        <SiteDistributionChart
          data={data.siteDistribution}
          title="Distribusi Site"
        />
      </div>

      {/* Recent Activity - Full Width at Bottom */}
      <RecentActivityList
        activities={data.recentActivity}
        title="Aktivitas Terbaru"
      />
    </div>
  )
}