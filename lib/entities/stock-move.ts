export const VALID_CATEGORIES = [
  'LAPTOP',
  'PC',
  'MONITOR',
  'MOUSE',
  'PRINTER',
  'STORAGE',
  'TOOLS_JARINGAN',
  'CCTV',
  'UPS',
] as const

export type Kategori = (typeof VALID_CATEGORIES)[number]
export type TipeTransaksi = 'MASUK' | 'KELUAR'

export interface StockSummaryResult {
  totalMasuk: number
  totalKeluar: number
  sisaStok: number
}

export interface ValidStockTransactionData {
  kategori: Kategori
  tipeTransaksi: TipeTransaksi
  jumlah: number
  tanggal: Date
  tujuan?: string
  keterangan?: string
}

export type ValidationResult =
  | { valid: true; data: ValidStockTransactionData }
  | { valid: false; error: string }

/**
 * Calculate stock summary from pre-aggregated values.
 * baseStockSum: sum of jumlahOrderan (or jumlah for Printer) from the category table
 * masukTransactionsSum: sum of jumlah from MASUK stock_transactions for this category
 * keluarTransactionsSum: sum of jumlah from KELUAR stock_transactions for this category
 */
export function calculateStockSummary(
  baseStockSum: number,
  masukTransactionsSum: number,
  keluarTransactionsSum: number
): StockSummaryResult {
  const totalMasuk = baseStockSum + masukTransactionsSum
  const totalKeluar = keluarTransactionsSum
  const sisaStok = totalMasuk - totalKeluar
  return { totalMasuk, totalKeluar, sisaStok }
}

/**
 * Validate raw request body for a new stock transaction.
 * Rules:
 * - kategori must be one of the 9 valid enum values
 * - tipeTransaksi must be 'MASUK' or 'KELUAR'
 * - jumlah must be a positive integer (> 0)
 * - tanggal must be parseable as a valid Date
 * - tujuan is optional string
 * - keterangan is optional string
 */
export function validateStockTransactionInput(body: unknown): ValidationResult {
  if (body === null || typeof body !== 'object') {
    return { valid: false, error: 'Request body harus berupa object' }
  }

  const obj = body as Record<string, unknown>

  // Validate kategori
  if (!VALID_CATEGORIES.includes(obj.kategori as Kategori)) {
    return {
      valid: false,
      error: `kategori harus salah satu dari: ${VALID_CATEGORIES.join(', ')}`,
    }
  }

  // Validate tipeTransaksi
  if (obj.tipeTransaksi !== 'MASUK' && obj.tipeTransaksi !== 'KELUAR') {
    return { valid: false, error: "tipeTransaksi harus 'MASUK' atau 'KELUAR'" }
  }

  // Validate jumlah: must be a positive integer
  const jumlah = obj.jumlah
  if (
    jumlah === null ||
    jumlah === undefined ||
    typeof jumlah !== 'number' ||
    !Number.isInteger(jumlah) ||
    jumlah <= 0
  ) {
    return {
      valid: false,
      error: 'jumlah harus berupa integer positif (lebih dari 0)',
    }
  }

  // Validate tanggal
  const tanggalRaw = obj.tanggal
  if (tanggalRaw === null || tanggalRaw === undefined) {
    return { valid: false, error: 'tanggal wajib diisi' }
  }

  let tanggal: Date
  if (tanggalRaw instanceof Date) {
    tanggal = tanggalRaw
  } else if (typeof tanggalRaw === 'string' || typeof tanggalRaw === 'number') {
    tanggal = new Date(tanggalRaw)
  } else {
    return { valid: false, error: 'tanggal tidak valid' }
  }

  if (isNaN(tanggal.getTime())) {
    return { valid: false, error: 'tanggal tidak valid' }
  }

  // Validate optional fields
  if (obj.tujuan !== undefined && typeof obj.tujuan !== 'string') {
    return { valid: false, error: 'tujuan harus berupa string' }
  }

  if (obj.keterangan !== undefined && typeof obj.keterangan !== 'string') {
    return { valid: false, error: 'keterangan harus berupa string' }
  }

  return {
    valid: true,
    data: {
      kategori: obj.kategori as Kategori,
      tipeTransaksi: obj.tipeTransaksi as TipeTransaksi,
      jumlah,
      tanggal,
      tujuan: obj.tujuan as string | undefined,
      keterangan: obj.keterangan as string | undefined,
    },
  }
}
