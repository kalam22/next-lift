import { useCallback } from 'react'
import axios from 'axios'
import { exportToExcel, ExcelExportConfig, ExcelColumn } from '@/lib/excel/utils'
import { logger } from '@/lib/logger'

export interface UseExcelExportConfig<T> {
  apiEndpoint: string
  entityName: string
  columns: ExcelColumn[]
  filename: string
  worksheetName: string
  imageField?: {
    fieldName: string
    columnIndex: number
  }
  dateFields?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function useExcelExport<T extends Record<string, any>>(config: UseExcelExportConfig<T>) {
  const { 
    apiEndpoint, 
    columns, 
    filename, 
    worksheetName, 
    imageField, 
    dateFields = [],
    sortBy = 'tanggalMasuk',
    sortOrder = 'asc'
  } = config

  const handleExport = useCallback(async () => {
    try {
      const response = await axios.get(apiEndpoint, {
        params: {
          page: 1,
          limit: 'all',
          sort_by: sortBy,
          sort_order: sortOrder
        }
      })

      const allData = Array.isArray(response.data.data) ? response.data.data : []

      await exportToExcel<T>({
        columns,
        data: allData,
        filename,
        worksheetName,
        imageField,
        dateFields,
      })
    } catch (error: any) {
      logger.error('Error exporting Excel:', error)
      const { default: Swal } = await import('sweetalert2')
      await Swal.fire({
        title: 'Gagal!',
        text: `Gagal mengekspor data: ${error.message || 'Unknown error'}`,
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
  }, [apiEndpoint, columns, filename, worksheetName, imageField, dateFields, sortBy, sortOrder])

  return { handleExport }
}

