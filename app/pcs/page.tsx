'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useDataTable } from '@/hooks/useDataTable'
import { useExcelImport } from '@/hooks/useExcelImport'
import { useExcelExport } from '@/hooks/useExcelExport'
import { usePermissions } from '@/hooks/usePermissions'
import { PC_HEADER_MAP, PC_LAPTOP_VALIDATOR, PC_LAPTOP_REQUIRED_FIELDS } from '@/lib/excel-header-maps'
import type { PC } from '@/types/entities'

export default function PCsPage() {
  const { canCreate, canEdit, canDelete, canExport, canImport } = usePermissions('pcs')
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const {
    data: pcs,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    selectedItems,
    handleDelete,
    handleSort,
    handleSelectAll,
    handleSelectItem,
    handleClearSelection,
    handleBulkDelete,
    isAllSelected,
    isIndeterminate,
    fetchData,
    colorTheme,
  } = useDataTable<PC>({
    apiEndpoint: '/api/pcs',
    entityName: 'PC',
    entityNamePlural: 'PC',
    colorTheme: 'blue',
  })

  const { handleImport } = useExcelImport({
    apiEndpoint: '/api/pcs',
    entityName: 'PC',
    entityNamePlural: 'PC',
    importConfig: {
      headerMap: PC_HEADER_MAP,
      validator: PC_LAPTOP_VALIDATOR,
      requiredFields: [...PC_LAPTOP_REQUIRED_FIELDS],
    },
    onSuccess: () => {
      fetchData()
    },
  })

  const { handleExport } = useExcelExport({
    apiEndpoint: '/api/pcs',
    entityName: 'PC',
    columns: [
      { header: 'NO', key: 'no', width: 8 },
      { header: 'JENIS PERANGKAT', key: 'merk', width: 30 },
      { header: 'PROCESOR', key: 'prosesor', width: 30 },
      { header: 'SSD/HDD', key: 'ssdHdd', width: 15 },
      { header: 'RAM', key: 'ram', width: 15 },
      { header: 'MONITOR', key: 'monitor', width: 20 },
      { header: 'PRINTER', key: 'printer', width: 20 },
      { header: 'KEYBOARD+MOUSE', key: 'keyboard', width: 20 },
      { header: 'UPS', key: 'ups', width: 15 },
      { header: 'TANGGAL MASUK', key: 'masuk', width: 18 },
      { header: 'TANGGAL KIRIM', key: 'kirim', width: 18 },
      { header: 'JUMLAH UNIT', key: 'unit', width: 15 },
      { header: 'DIPERUNTUKKAN', key: 'untuk', width: 25 },
      { header: 'SITE', key: 'site', width: 12 },
      { header: 'NOMOR PO', key: 'po', width: 15 },
      { header: 'STATUS UNIT', key: 'status', width: 18 },
      { header: 'KERUSAKAN', key: 'kerusakan', width: 30 },
      { header: 'NOMOR SURAT JALAN', key: 'suratJalan', width: 18 },
      { header: 'CATATAN', key: 'catatan', width: 40 },
      { header: 'FOTO', key: 'gambar', width: 30 },
    ],
    filename: 'Data_PC',
    worksheetName: 'Master Assets',
    imageField: {
      fieldName: 'gambar',
      columnIndex: 20,
    },
    dateFields: ['masuk', 'kirim'],
    sortBy: 'masuk',
    sortOrder: 'asc',
  })

  return (
    <div className="min-h-screen mesh-gradient dark:mesh-gradient-dark p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black text-[#020617] dark:text-white tracking-tighter uppercase">
            Master <span className="text-primary">Assets</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-[0.2em] opacity-60">Inventory / PC Units</p>
        </div>
        <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
          {canImport && (
          <label className="flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3.5 bg-white dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#1e293b] rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/5 cursor-pointer">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            Import
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          )}
          {canExport && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3.5 bg-white dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#1e293b] rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/5"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export
          </button>
          )}
          {canCreate && (
          <Link
            href="/pcs/create"
            className="btn-premium flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3.5 bg-primary hover:bg-primary/90 shadow-primary/25 text-[10px] sm:text-[11px]"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            <span className="uppercase tracking-widest">Register Unit</span>
          </Link>
          )}
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8 border-b border-[#f1f5f9]/50 dark:border-[#1e293b]/50 bg-white/50 dark:bg-black/20 backdrop-blur-3xl">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="relative w-full lg:w-auto lg:flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                type="text"
                placeholder="Cari merk, prosesor, atau user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-premium pl-12 w-full lg:max-w-md focus:ring-primary/5 focus:border-primary/30"
              />
            </div>
          </div>
        </div>

        {selectedItems.size > 0 && (
          <div className="p-4 sm:p-6 lg:p-8 border-b border-primary/20 bg-primary/5/50 dark:bg-primary/50/5 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-full bg-primary text-white text-xs font-black uppercase tracking-widest">
                  {selectedItems.size} Dipilih
                </div>
                <button
                  onClick={handleClearSelection}
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
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/30 dark:bg-black/10 uppercase font-black text-[10px] tracking-[0.25em] text-gray-400/80">
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 w-12">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isIndeterminate
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                    />
                  </div>
                </th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 min-w-[60px]">NO</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 min-w-[200px]">BRAND</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 min-w-[150px]">SPESIFIKASI</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 min-w-[150px]">PIC</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 min-w-[120px]">SITE</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 min-w-[120px]">DEPARTEMEN</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 min-w-[120px]">STATUS</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 min-w-[120px]">FOTO</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right min-w-[140px]">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50 dark:divide-white/[0.02]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 sm:px-8 py-24 sm:py-32 text-center">
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
                  <td colSpan={10} className="px-4 sm:px-8 py-24 sm:py-32 text-center">
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
              ) : pcs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 sm:px-8 py-24 sm:py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-50">
                      <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">No PC Registered</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pcs.map((pc: PC, index: number) => {
                  const rowNumber = (currentPage - 1) * itemsPerPage + index + 1
                  return (
                    <tr key={pc.id} className={`group hover:bg-primary/5/30 dark:hover:bg-primary/50/[0.02] transition-all duration-500 ease-out ${selectedItems.has(pc.id) ? 'bg-primary/5/50 dark:bg-primary/50/10' : ''}`}>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(pc.id)}
                            onChange={(e) => handleSelectItem(pc.id, e.target.checked)}
                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                          />
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                        <span className="text-xs font-black text-gray-500 dark:text-gray-400">{rowNumber}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                        <Link href={`/pcs/${pc.id}/view`} className="flex flex-col hover:opacity-80 transition-opacity">
                          <span className="text-sm font-black text-[#020617] dark:text-white uppercase tracking-tight group-hover:text-primary transition-colors">{pc.merk}</span>
                        </Link>
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] sm:text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight">{pc.prosesor}</span>
                          <span className="text-[9px] sm:text-[10px] text-primary font-black uppercase tracking-widest mt-0.5">{pc.ram} RAM / {pc.ssdHdd}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                        <span className="text-xs sm:text-sm font-black text-[#020617] dark:text-white uppercase tracking-tight underline decoration-primary/20 underline-offset-8 decoration-2">{pc.untuk}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                        <span className="inline-flex items-center px-3 sm:px-4 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-white/50 dark:border-white/5 text-[9px] sm:text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest shadow-sm whitespace-nowrap">
                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {pc.site}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                        <span className="inline-flex items-center px-3 sm:px-4 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-white/50 dark:border-white/5 text-[9px] sm:text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest shadow-sm whitespace-nowrap">
                          {pc.departemen || '-'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                        <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 rounded-full ring-1 ring-inset ${
                          pc.status?.toUpperCase() === 'BARU'
                            ? 'bg-green-500/5 text-green-500 ring-green-500/20'
                            : pc.status?.toUpperCase() === 'SECOND'
                            ? 'bg-yellow-500/5 text-yellow-500 ring-yellow-500/20'
                            : pc.status?.toUpperCase() === 'SERVICE'
                            ? 'bg-red-500/5 text-red-500 ring-red-500/20'
                            : pc.status?.toLowerCase().includes('rusak') || pc.status?.toLowerCase().includes('error')
                            ? 'bg-red-500/5 text-red-500 ring-red-500/20'
                            : 'bg-gray-500/5 text-gray-500 ring-gray-500/20'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            pc.status?.toUpperCase() === 'BARU'
                              ? 'bg-green-500'
                              : pc.status?.toUpperCase() === 'SECOND'
                              ? 'bg-yellow-500'
                              : pc.status?.toUpperCase() === 'SERVICE'
                              ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                              : pc.status?.toLowerCase().includes('rusak') || pc.status?.toLowerCase().includes('error')
                              ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                              : 'bg-gray-500'
                          }`}></div>
                          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] whitespace-nowrap">{pc.status}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                        {pc.gambar ? (
                          <div className="flex items-center justify-center">
                            {imageErrors.has(pc.id) ? (
                              <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-white/5 border border-[#f1f5f9] dark:border-[#334155] flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            ) : (
                              <Image
                                src={pc.gambar}
                                alt={pc.merk}
                                width={64}
                                height={64}
                                className="object-cover rounded-xl border border-[#f1f5f9] dark:border-[#334155] cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => {
                                  if (pc.gambar) {
                                    window.open(pc.gambar, '_blank')
                                  }
                                }}
                                loading="lazy"
                                placeholder="blur"
                                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YxZjVmOSIvPjwvc3ZnPg=="
                                unoptimized={pc.gambar?.startsWith('/')}
                                onError={() => {
                                  setImageErrors(prev => new Set(prev).add(pc.id))
                                }}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-white/5 border border-[#f1f5f9] dark:border-[#334155] flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                        <div className="flex items-center justify-end gap-1 sm:gap-2 lg:gap-3">
                          <Link
                            href={`/pcs/${pc.id}/view`}
                            className="p-2.5 bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-white/5 rounded-xl text-gray-400 hover:text-primary hover:scale-110 hover:shadow-xl hover:shadow-primary/10 transition-all"
                            title="View"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </Link>
                          {canEdit && (
                          <Link
                            href={`/pcs/${pc.id}/edit`}
                            className="p-2.5 bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-white/5 rounded-xl text-gray-400 hover:text-amber-500 hover:scale-110 hover:shadow-xl hover:shadow-amber-500/10 transition-all font-sans"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </Link>
                          )}
                          {canDelete && (
                          <button
                            onClick={() => handleDelete(pc.id)}
                            className="p-2.5 bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-white/5 rounded-xl text-gray-400 hover:text-red-500 hover:scale-110 hover:shadow-xl hover:shadow-red-500/10 transition-all"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 dark:bg-black/20 border-t border-[#f1f5f9]/50 dark:border-[#1e293b]/50 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">Rows per page:</span>
            <select
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
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 sm:p-3 bg-white dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#1e293b] rounded-xl sm:rounded-2xl text-gray-400 hover:text-primary disabled:opacity-20 transition-all shadow-lg sm:shadow-xl shadow-black/5 active:scale-90"
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
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 sm:p-3 bg-white dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#1e293b] rounded-xl sm:rounded-2xl text-gray-400 hover:text-primary disabled:opacity-20 transition-all shadow-lg sm:shadow-xl shadow-black/5 active:scale-90"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}