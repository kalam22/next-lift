/**
 * Pure helper functions untuk fitur PC History.
 * Tidak ada side effects — dapat diuji secara terisolasi.
 */

import { SITE_OPTIONS } from '@/lib/constants'
import type { PcHistory } from '@/types/entities'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PcHistoryInput {
  pic: string
  tanggalTerima: string // ISO date string
  site: string
  departemen?: string
  keterangan?: string
}

export type ValidationResult =
  | { valid: true; data: PcHistoryInput }
  | { valid: false; errors: Record<string, string> }

type PrismaPcHistory = {
  id: number
  pc_id: number
  pic: string
  tanggal_terima: Date
  site: string
  departemen: string | null
  keterangan: string | null
  created_at: Date
  updated_at: Date
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validatePcHistoryInput(body: unknown): ValidationResult {
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

  const pic = input.pic
  if (typeof pic !== 'string' || pic.trim() === '') {
    errors.pic = 'PIC wajib diisi'
  }

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

  const site = input.site
  if (site === undefined || site === null || site === '') {
    errors.site = 'Site wajib diisi'
  } else if (typeof site !== 'string' || !(SITE_OPTIONS as readonly string[]).includes(site)) {
    errors.site = 'Site tidak valid'
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors }
  }

  const data: PcHistoryInput = {
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

export function formatPcHistoryResponse(history: PrismaPcHistory): PcHistory {
  return {
    id: history.id,
    pcId: history.pc_id,
    pic: history.pic,
    tanggalTerima: history.tanggal_terima,
    site: history.site,
    departemen: history.departemen,
    keterangan: history.keterangan,
    createdAt: history.created_at,
    updatedAt: history.updated_at,
  }
}
