/**
 * Pure helper functions untuk fitur Laptop History.
 * Tidak ada side effects — dapat diuji secara terisolasi.
 */

import { SITE_OPTIONS } from '@/lib/constants'
import type { LaptopHistory } from '@/types/entities'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LaptopHistoryInput {
  pic: string
  tanggalTerima: string // ISO date string
  site: string
  departemen?: string
  keterangan?: string
}

export type ValidationResult =
  | { valid: true; data: LaptopHistoryInput }
  | { valid: false; errors: Record<string, string> }

type PrismaLaptopHistory = {
  id: number
  laptop_id: number
  pic: string
  tanggal_terima: Date
  site: string
  departemen: string | null
  keterangan: string | null
  created_at: Date
  updated_at: Date
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validasi input histori baru.
 *
 * Rules:
 * - pic: wajib, tidak boleh kosong atau hanya whitespace
 * - tanggalTerima: wajib, harus parseable sebagai Date yang valid
 * - site: wajib, harus salah satu dari SITE_OPTIONS
 * - departemen: opsional
 * - keterangan: opsional
 */
export function validateHistoryInput(body: unknown): ValidationResult {
  const errors: Record<string, string> = {}

  if (typeof body !== 'object' || body === null) {
    return {
      valid: false,
      errors: {
        pic: 'PIC wajib diisi',
        tanggalTerima: 'Tanggal terima wajib diisi',
        site: 'Site wajib diisi',
      },
    }
  }

  const input = body as Record<string, unknown>

  // Validate pic
  const pic = input.pic
  if (typeof pic !== 'string' || pic.trim() === '') {
    errors.pic = 'PIC wajib diisi'
  }

  // Validate tanggalTerima
  const tanggalTerima = input.tanggalTerima
  if (tanggalTerima === undefined || tanggalTerima === null || tanggalTerima === '') {
    errors.tanggalTerima = 'Tanggal terima wajib diisi'
  } else if (typeof tanggalTerima !== 'string') {
    errors.tanggalTerima = 'Format tanggal tidak valid'
  } else {
    const parsed = new Date(tanggalTerima)
    if (isNaN(parsed.getTime())) {
      errors.tanggalTerima = 'Format tanggal tidak valid'
    }
  }

  // Validate site
  const site = input.site
  if (site === undefined || site === null || site === '') {
    errors.site = 'Site wajib diisi'
  } else if (typeof site !== 'string' || !(SITE_OPTIONS as readonly string[]).includes(site)) {
    errors.site = 'Site tidak valid'
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors }
  }

  // Build validated data
  const data: LaptopHistoryInput = {
    pic: (pic as string).trim(),
    tanggalTerima: tanggalTerima as string,
    site: site as string,
  }

  const departemen = input.departemen
  if (typeof departemen === 'string' && departemen.trim() !== '') {
    data.departemen = departemen.trim()
  }

  const keterangan = input.keterangan
  if (typeof keterangan === 'string' && keterangan.trim() !== '') {
    data.keterangan = keterangan.trim()
  }

  return { valid: true, data }
}

// ─── Formatter ────────────────────────────────────────────────────────────────

/**
 * Format response histori dari Prisma ke shape yang konsisten untuk frontend.
 * Mengkonversi snake_case ke camelCase.
 */
export function formatHistoryResponse(history: PrismaLaptopHistory): LaptopHistory {
  return {
    id: history.id,
    laptopId: history.laptop_id,
    pic: history.pic,
    tanggalTerima: history.tanggal_terima,
    site: history.site,
    departemen: history.departemen,
    keterangan: history.keterangan,
    createdAt: history.created_at,
    updatedAt: history.updated_at,
  }
}
