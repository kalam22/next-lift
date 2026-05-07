/**
 * Base validation schema untuk entitas
 * Mengurangi duplikasi kode untuk validation yang sama
 */

import { z } from 'zod'
import { STATUS_BARANG_OPTIONS } from '@/lib/constants'

// Base schema fields yang digunakan oleh semua entitas
export const baseEntitySchema = {
  brand: z.string().min(1, 'Brand wajib diisi'),
  diperuntukan: z.string().min(1, 'Diperuntukan wajib diisi'),
  site: z.string().min(1, 'Site wajib diisi'),
  departemen: z.string().max(191).optional().nullable(),
  nomorPO: z.string().min(1, 'Nomor PO wajib diisi'),
  nomorSuratJalan: z.string().optional().nullable(),
  statusBarang: z.enum(STATUS_BARANG_OPTIONS, {
    message: `Status barang harus ${STATUS_BARANG_OPTIONS.join(', ')}`,
  }),
  tanggalMasuk: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  tanggalKirim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD').optional().nullable(),
  keterangan: z.string().optional().nullable(),
  foto: z.string().optional().nullable().or(z.literal('')).refine(
    (val) => !val || val === '' || val.startsWith('http') || val.startsWith('/'),
    { message: 'Foto harus berupa URL yang valid atau path' }
  ),
}

