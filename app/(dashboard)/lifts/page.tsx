'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Swal from 'sweetalert2'
import { logger } from '@/lib/logger'
import type { Lift, LiftsApiResponse } from '@/types/lift'
import LiftTableRow from '@/components/LiftTableRow'
import { usePermissions } from '@/hooks/usePermissions'
import LiftForm from '@/components/LiftForm'
import CreateModal from '@/components/CreateModal'
// ExcelJS akan di-import secara dynamic untuk mengurangi bundle size

/**
 * Halaman Lifts menggunakan custom implementation (bukan useDataTable hook)
 * karena memiliki kebutuhan khusus:
 * - Filter status khusus (active, expiring_soon, expired)
 * - Sort manual dengan indikator visual
 * - Column visibility toggle
 * - Struktur data berbeda dengan entitas lain (akses array, validity dates)
 * 
 * Jika di masa depan struktur data Lifts disamakan dengan entitas lain,
 * pertimbangkan untuk menggunakan useDataTable hook untuk konsistensi.
 */
export default function LiftsPage() {
  const { canCreate, canEdit, canDelete, canExport } = usePermissions('lifts')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [lifts, setLifts] = useState<Lift[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'none' | 'pt' | 'departemen'>('none')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring_soon' | 'expired'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showColumns, setShowColumns] = useState({
    no: true,
    nama: true,
    pt: true,
    departemen: true,
    berlaku: true,
    akses: true,
    status: true,
    aksi: true
  })
  const [showColumnFilter, setShowColumnFilter] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | 'none' }>({
    key: 'none',
    direction: 'none'
  })
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [totalItems, setTotalItems] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300) // Reduced from 500ms to 300ms for faster response
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchLifts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        status: statusFilter
      })
      
      // Only add sort params if user has selected a sort option
      if (sortConfig.key !== 'none') {
        params.append('sort_by', sortConfig.key)
        if (sortConfig.direction !== 'none') {
          params.append('sort_order', sortConfig.direction)
        }
      } else if (sortBy !== 'none') {
        // Use dropdown sort if no manual sort is selected
        params.append('sort_by', sortBy)
      }
      
      // Only add search param if it has a value
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        params.append('search', debouncedSearchTerm.trim())
      }

      const response = await axios.get<LiftsApiResponse>(`/api/lifts?${params.toString()}`)
      setLifts(Array.isArray(response.data.data) ? response.data.data : [])
      setTotalItems(response.data.pagination?.total || 0)
      setError(null)
      // Reset selected items when data changes
      setSelectedItems(new Set())
    } catch (error: unknown) {
      logger.error('Error fetching lifts:', error)
      setLifts([])
      const axiosError = error && typeof error === 'object' && 'response' in error
        ? error as { response?: { status?: number; data?: { error?: string } } }
        : null
      
      if (axiosError?.response?.status === 503 || axiosError?.response?.data?.error === 'Database connection failed') {
        setError('Tidak dapat terhubung ke database. Pastikan PostgreSQL server berjalan di localhost:5432')
      } else {
        setError('Gagal memuat data. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, sortConfig, sortBy, statusFilter])

  useEffect(() => {
    fetchLifts()
  }, [fetchLifts])

  const handleDelete = useCallback(async (liftId: number) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Data yang dihapus tidak dapat dikembalikan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        popup: '!rounded-2xl',
        title: '!font-bold',
        confirmButton: 'swal2-confirm',
        cancelButton: 'swal2-cancel',
      },
    })

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/lifts/${liftId}`)

        // Hapus dari state lokal langsung — sama seperti useDataTable
        setLifts(prev => prev.filter(l => l.id !== liftId))
        setTotalItems(prev => Math.max(prev - 1, 0))
        setSelectedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(liftId)
          return newSet
        })

        Swal.fire({
          title: 'Terhapus!',
          text: 'Data berhasil dihapus.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          buttonsStyling: false,
          customClass: { popup: '!rounded-2xl', title: '!font-bold' },
        })
      } catch (error) {
        logger.error('Error deleting lift:', error)
        Swal.fire({
          title: 'Gagal!',
          text: 'Gagal menghapus data. Silakan coba lagi.',
          icon: 'error',
          confirmButtonText: 'OK',
          buttonsStyling: false,
          customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' },
        })
      }
    }
  }, [fetchLifts])

  const exportToExcel = useCallback(async () => {
    try {
      // Dynamic import untuk ExcelJS - mengurangi bundle size
      const ExcelJS = (await import('exceljs')).default
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('User Lift')

      worksheet.columns = [
      { header: 'NO', key: 'no', width: 5 },
      { header: 'NAMA', key: 'nama', width: 25 },
      { header: 'PT', key: 'pt', width: 10 },
      { header: 'DEPARTEMEN', key: 'departemen', width: 15 },
      { header: 'MASA BERLAKU', key: 'berlaku', width: 20 },
      { header: 'HAK AKSES LANTAI', key: 'akses', width: 20 },
    ]

      // Style header
      worksheet.getRow(1).font = { bold: true, name: 'Times New Roman' }
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }
      worksheet.getRow(1).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }

      lifts.forEach((lift, index) => {
        const row = worksheet.addRow({
          no: index + 1,
          nama: lift.nama.toUpperCase(),
          pt: lift.pt,
          departemen: lift.departemen || '-',
          berlaku: lift.berlaku ? format(new Date(lift.berlaku), 'dd MMMM yyyy', { locale: id }).toUpperCase() : 'PERMANEN',
          akses: Array.isArray(lift.aksesArray) ? lift.aksesArray.map((f: number) => `LT ${f}`).join(', ') : '-'
        })

        row.font = { name: 'Times New Roman' }
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        })
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `User_Lift_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`
      anchor.click()
      window.URL.revokeObjectURL(url)
    } catch (error: unknown) {
      logger.error('Error exporting lifts:', error)
      Swal.fire({
        title: 'Gagal!',
        text: 'Gagal mengekspor data. Pastikan ada data yang dapat diekspor.',
        icon: 'error',
        confirmButtonText: 'OK',
        buttonsStyling: false,
        customClass: {
          popup: '!rounded-2xl',
          title: '!font-bold',
          confirmButton: 'swal2-confirm',
        },
      })
    }
  }, [lifts])

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
      return { key, direction }
    })
    setCurrentPage(1) // Reset to first page when sorting changes
  }, [])

  // Memoize computed values
  const currentItems = useMemo(() => lifts, [lifts])
  const totalPages = useMemo(() => Math.ceil(totalItems / itemsPerPage), [totalItems, itemsPerPage])
  const isAllSelected = useMemo(() => currentItems.length > 0 && currentItems.every((lift: Lift) => selectedItems.has(lift.id)), [currentItems, selectedItems])
  const isIndeterminate = useMemo(() => selectedItems.size > 0 && selectedItems.size < currentItems.length, [selectedItems.size, currentItems.length])

  // Bulk action handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = new Set(currentItems.map((lift: any) => lift.id))
      setSelectedItems(allIds)
    } else {
      setSelectedItems(new Set())
    }
  }, [currentItems])

  const handleSelectItem = useCallback((id: number, checked: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }, [])

  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.size === 0) return

    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Anda akan menghapus ${selectedItems.size} data user lift. Tindakan ini tidak dapat dibatalkan!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Ya, Hapus ${selectedItems.size} Data!`,
      cancelButtonText: 'Batal',
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        popup: '!rounded-2xl',
        title: '!font-bold',
        confirmButton: 'swal2-confirm',
        cancelButton: 'swal2-cancel',
      },
    })

    if (result.isConfirmed) {
      try {
        const idsToDelete = Array.from(selectedItems)
        let successCount = 0
        let errorCount = 0

        // Delete all selected items
        for (const id of idsToDelete) {
          try {
            await axios.delete(`/api/lifts/${id}`)
            successCount++
          } catch (error) {
            logger.error(`Error deleting lift ${id}:`, error)
            errorCount++
          }
        }

        // Clear selection
        setSelectedItems(new Set())

        // Refresh data
        await fetchLifts()

        if (errorCount === 0) {
          Swal.fire({
            title: 'Berhasil!',
            text: `Berhasil menghapus ${successCount} data user lift`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            buttonsStyling: false,
            customClass: {
              popup: '!rounded-2xl',
              title: '!font-bold',
            },
          })
        } else {
          Swal.fire({
            title: 'Sebagian Berhasil',
            text: `Berhasil menghapus ${successCount} data, gagal ${errorCount} data`,
            icon: 'warning',
            timer: 2000,
            showConfirmButton: false,
            buttonsStyling: false,
            customClass: {
              popup: '!rounded-2xl',
              title: '!font-bold',
            },
          })
        }
      } catch (error) {
        logger.error('Error in bulk delete:', error)
        Swal.fire({
          title: 'Gagal!',
          text: 'Gagal menghapus data. Silakan coba lagi.',
          icon: 'error',
          confirmButtonText: 'OK',
          buttonsStyling: false,
          customClass: {
            popup: '!rounded-2xl',
            title: '!font-bold',
            confirmButton: 'swal2-confirm',
          },
        })
      }
    }
  }, [selectedItems, fetchLifts])

  return (
    <div className="min-h-screen mesh-gradient dark:mesh-gradient-dark p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black text-[#020617] dark:text-white tracking-tighter uppercase">
            Management <span className="text-primary">Lift</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-[0.2em] opacity-60">Control Panel / Access Systems</p>
        </div>
        <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
          {canExport && (
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3.5 bg-white dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#1e293b] rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/5"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export
          </button>
          )}
          {canCreate && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-premium flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3.5 text-[10px] sm:text-[11px]"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            <span className="uppercase tracking-widest">Tambah User</span>
          </button>
          )}
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        {/* Header Section */}
        <div className="p-4 sm:p-6 lg:p-8 border-b border-[#f1f5f9]/50 dark:border-[#1e293b]/50 bg-white/50 dark:bg-black/20 backdrop-blur-3xl">
          {/* Filters and Controls Row */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search Bar */}
            <div className="relative w-full lg:w-auto lg:flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                id="lifts-search"
                type="text"
                aria-label="Cari data lift berdasarkan nama, PT, atau departemen"
                placeholder="Cari Nama, PT, atau Departemen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-premium pl-12 w-full lg:max-w-md"
              />
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2 bg-gray-100/50 dark:bg-white/5 p-1 rounded-xl">
              <button
                aria-pressed={statusFilter === 'all'}
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 min-h-[44px] rounded-lg text-xs font-bold transition-all whitespace-nowrap ${statusFilter === 'all' ? 'bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
              >
                All
              </button>
              <button
                aria-pressed={statusFilter === 'active'}
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 min-h-[44px] rounded-lg text-xs font-bold transition-all whitespace-nowrap ${statusFilter === 'active' ? 'bg-white dark:bg-[#0f172a] text-primary shadow-sm' : 'text-gray-500 hover:text-primary'}`}
              >
                Active
              </button>
              <button
                aria-pressed={statusFilter === 'expiring_soon'}
                onClick={() => setStatusFilter('expiring_soon')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 min-h-[44px] rounded-lg text-xs font-bold transition-all whitespace-nowrap ${statusFilter === 'expiring_soon' ? 'bg-white dark:bg-[#0f172a] text-amber-500 shadow-sm' : 'text-gray-500 hover:text-amber-500'}`}
              >
                Will Expire
              </button>
              <button
                aria-pressed={statusFilter === 'expired'}
                onClick={() => setStatusFilter('expired')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 min-h-[44px] rounded-lg text-xs font-bold transition-all whitespace-nowrap ${statusFilter === 'expired' ? 'bg-white dark:bg-[#0f172a] text-red-500 shadow-sm' : 'text-gray-500 hover:text-red-500'}`}
              >
                Expired
              </button>
            </div>

            {/* Sort and Column Controls */}
            <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50/50 dark:bg-[#020617]/50 border border-transparent rounded-xl hover:bg-white dark:hover:bg-[#0f172a] transition-all">
                <label htmlFor="lifts-sort" className="text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Sort:</label>
                <select
                  id="lifts-sort"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any)
                    setSortConfig({ key: 'none', direction: 'none' })
                  }}
                  className="bg-transparent border-none text-[11px] font-black uppercase tracking-tighter focus:ring-0 cursor-pointer text-gray-950 dark:text-white"
                >
                  <option value="none">Auto</option>
                  <option value="pt">PT</option>
                  <option value="departemen">Departemen</option>
                </select>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowColumnFilter(!showColumnFilter)}
                  aria-label="Filter kolom tampilan"
                  aria-expanded={showColumnFilter}
                  className="p-2.5 sm:p-3.5 bg-gray-50/50 dark:bg-[#020617]/50 hover:bg-white dark:hover:bg-[#0f172a] border border-transparent rounded-xl text-gray-500 hover:text-primary transition-all shadow-sm group"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                </button>
                {showColumnFilter && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1e293b] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl shadow-xl z-50 p-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-2">Sort Kolom</p>
                    <div className="space-y-1">
                      {Object.entries(showColumns).map(([key, value]) => (
                        <label key={key} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-[#0f172a] rounded-xl cursor-pointer transition-colors group">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={() => setShowColumns(prev => ({ ...prev, [key as keyof typeof showColumns]: !prev[key as keyof typeof showColumns] }))}
                            className="rounded-lg border-[#e2e8f0] dark:border-[#334155] text-primary focus:ring-primary"
                          />
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-300 capitalize group-hover:text-primary transition-colors">{key}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedItems.size > 0 && (
          <div className="p-4 sm:p-6 lg:p-8 border-b border-primary/20 bg-primary/5/50 dark:bg-primary/50/5 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-full bg-primary text-white text-xs font-black uppercase tracking-widest">
                  {selectedItems.size} Dipilih
                </div>
                <button
                  onClick={() => setSelectedItems(new Set())}
                  className="text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  Batal Pilihan
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {canDelete && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Hapus ({selectedItems.size})
                </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/30 dark:bg-black/10 uppercase font-black text-[10px] tracking-[0.25em] text-gray-400/80">
                <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 w-12">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      aria-label="Pilih semua item"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isIndeterminate
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                    />
                  </div>
                </th>
                {showColumns.no && <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 min-w-[60px]" scope="col">NO</th>}
                {showColumns.nama && (
                  <th
                    scope="col"
                    aria-sort={sortConfig.key === 'nama' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 cursor-pointer hover:text-primary transition-colors group/h min-w-[180px]"
                    onClick={() => handleSort('nama')}
                  >
                    <div className="flex items-center gap-2">
                      NAMA
                      <div className="flex flex-col opacity-20 group-hover/h:opacity-100 transition-opacity" aria-hidden="true">
                        <svg className={`w-2.5 h-2.5 ${sortConfig.key === 'nama' && sortConfig.direction === 'asc' ? 'text-primary' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 10H19.5L12 2Z" /></svg>
                        <svg className={`w-2.5 h-2.5 ${sortConfig.key === 'nama' && sortConfig.direction === 'desc' ? 'text-primary' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 22L19.5 14H4.5L12 22Z" /></svg>
                      </div>
                    </div>
                  </th>
                )}
                {showColumns.pt && <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 min-w-[80px]" scope="col">PT</th>}
                {showColumns.departemen && <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 min-w-[120px]" scope="col">DEPARTEMEN</th>}
                {showColumns.berlaku && (
                  <th
                    scope="col"
                    aria-sort={sortConfig.key === 'berlaku' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 cursor-pointer hover:text-primary transition-colors group/h min-w-[140px]"
                    onClick={() => handleSort('berlaku')}
                  >
                    <div className="flex items-center gap-2">
                      VALIDITY
                      <div className="flex flex-col opacity-20 group-hover/h:opacity-100 transition-opacity" aria-hidden="true">
                        <svg className={`w-2.5 h-2.5 ${sortConfig.key === 'berlaku' && sortConfig.direction === 'asc' ? 'text-primary' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 10H19.5L12 2Z" /></svg>
                        <svg className={`w-2.5 h-2.5 ${sortConfig.key === 'berlaku' && sortConfig.direction === 'desc' ? 'text-primary' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 22L19.5 14H4.5L12 22Z" /></svg>
                      </div>
                    </div>
                  </th>
                )}
                {showColumns.akses && <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 min-w-[150px]" scope="col">FLOORS</th>}
                {showColumns.status && <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 min-w-[100px]" scope="col">STATUS</th>}
                {showColumns.aksi && <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 text-right min-w-[120px]" scope="col">ACTION</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50 dark:divide-white/[0.02]">
              {loading ? (
                <tr>
                  <td colSpan={Object.values(showColumns).filter(v => v).length + 1} className="px-4 sm:px-8 py-24 sm:py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative w-12 h-12">
                        <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Loading Data...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={Object.values(showColumns).filter(v => v).length + 1} className="px-4 sm:px-8 py-24 sm:py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      </div>
                      <div className="space-y-2">
                        <span className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wide block">Database Error</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block max-w-md">{error}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={Object.values(showColumns).filter(v => v).length + 1} className="px-4 sm:px-8 py-24 sm:py-32 text-center">
                    <div role="status" className="flex flex-col items-center gap-4 opacity-50">
                      <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0h-1.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                      </div>
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">No Data Found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                lifts.map((lift, index) => (
                  <LiftTableRow
                    key={lift.id}
                    lift={lift}
                    index={index}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    showColumns={showColumns}
                    selectedItems={selectedItems}
                    onSelectItem={handleSelectItem}
                    onDelete={handleDelete}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Improved Pagination */}
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 dark:bg-black/20 border-t border-[#f1f5f9]/50 dark:border-[#1e293b]/50 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <label htmlFor="lifts-rows" className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap">Rows per page:</label>
            <select
              id="lifts-rows"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="bg-transparent border-none text-[10px] sm:text-[11px] font-black uppercase focus:ring-0 cursor-pointer text-gray-950 dark:text-white"
            >
              {[10, 25, 50, 100].map(size => (
                <option key={size} value={size}>{size} Unit/Page</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              aria-label="Halaman sebelumnya"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 sm:p-3 bg-white dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#1e293b] rounded-xl sm:rounded-2xl text-gray-400 hover:text-primary disabled:opacity-20 transition-all shadow-lg sm:shadow-xl shadow-black/5 active:scale-90"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 3 + i + 1;
                }
                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black transition-all ${currentPage === pageNum
                      ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-110'
                      : 'bg-white dark:bg-[#0f172a] text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 border border-[#f1f5f9] dark:border-[#1e293b]'
                      }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              aria-label="Halaman berikutnya"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 sm:p-3 bg-white dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#1e293b] rounded-xl sm:rounded-2xl text-gray-400 hover:text-primary disabled:opacity-20 transition-all shadow-lg sm:shadow-xl shadow-black/5 active:scale-90"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      <CreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tambah User Lift"
        subtitle="Daftarkan akses lift untuk pengguna baru"
      >
        <LiftForm
          onSuccess={() => { setIsCreateOpen(false); fetchLifts() }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </CreateModal>
    </div>
  )
}
