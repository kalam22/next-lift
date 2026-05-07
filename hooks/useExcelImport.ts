import { useCallback } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { parseExcelFile, ExcelImportConfig } from '@/lib/excel-utils'
import { logger } from '@/lib/logger'

export interface UseExcelImportConfig {
  apiEndpoint: string
  entityName: string
  entityNamePlural: string
  importConfig: ExcelImportConfig
  onSuccess?: () => void
}

export function useExcelImport(config: UseExcelImportConfig) {
  const { apiEndpoint, entityName, entityNamePlural, importConfig, onSuccess } = config

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    event.target.value = ''

    try {
      const { validData, invalidData } = await parseExcelFile(file, importConfig)

      if (validData.length === 0) {
        await Swal.fire({
          title: 'Data Tidak Valid',
          text: `Tidak ada data yang memiliki semua field wajib`,
          icon: 'error',
          confirmButtonText: 'OK',
          buttonsStyling: false,
          customClass: {
            popup: '!rounded-2xl',
            title: '!font-bold',
            confirmButton: 'swal2-confirm',
          },
        })
        return
      }

      if (invalidData.length > 0) {
        const skipped = invalidData.length
        const confirmResult = await Swal.fire({
          title: 'Data Tidak Lengkap',
          text: `${skipped} baris akan dilewati karena tidak memiliki field wajib. Lanjutkan import ${validData.length} data yang valid?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Ya, Lanjutkan',
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
        if (!confirmResult.isConfirmed) {
          return
        }
      }

      // Parallel import — jauh lebih cepat dari sequential
      const results = await Promise.allSettled(
        validData.map(itemData => axios.post(apiEndpoint, itemData))
      )
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          successCount++
        } else {
          errorCount++
          const err = r.reason as any
          const msg = err?.response?.data?.message || err?.message || 'Unknown error'
          errors.push(`Baris ${i + 1}: ${msg}`)
        }
      })

      if (successCount > 0 && onSuccess) {
        onSuccess()
      }
      
      if (errorCount === 0) {
        await Swal.fire({
          title: 'Berhasil!',
          text: `Berhasil mengimpor ${successCount} data ${entityNamePlural}`,
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
        await Swal.fire({
          title: 'Sebagian Berhasil',
          html: `Berhasil mengimpor ${successCount} data, gagal ${errorCount} data:<br><br>${errors.slice(0, 5).join('<br>')}${errors.length > 5 ? `<br>... dan ${errors.length - 5} error lainnya` : ''}`,
          icon: 'warning',
          timer: 3000,
          showConfirmButton: false,
          buttonsStyling: false,
          customClass: {
            popup: '!rounded-2xl',
            title: '!font-bold',
          },
        })
      }
    } catch (error: any) {
      logger.error('Error importing Excel:', error)
      await Swal.fire({
        title: 'Gagal!',
        text: `Gagal mengimpor file Excel: ${error.message || 'File tidak valid'}`,
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
  }, [apiEndpoint, entityNamePlural, importConfig, onSuccess])

  return { handleImport }
}

