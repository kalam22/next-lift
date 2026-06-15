import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateStockSummary,
  validateStockTransactionInput,
  VALID_CATEGORIES,
} from './entities/stock-move'

// ─── Unit Tests: calculateStockSummary ───────────────────────────────────────

describe('calculateStockSummary', () => {
  it('calculates correctly with typical values', () => {
    const result = calculateStockSummary(10, 5, 3)
    expect(result.totalMasuk).toBe(15)
    expect(result.totalKeluar).toBe(3)
    expect(result.sisaStok).toBe(12)
  })

  it('returns all zeros when all inputs are zero', () => {
    const result = calculateStockSummary(0, 0, 0)
    expect(result.totalMasuk).toBe(0)
    expect(result.totalKeluar).toBe(0)
    expect(result.sisaStok).toBe(0)
  })

  it('allows negative sisaStok when keluar exceeds masuk', () => {
    const result = calculateStockSummary(0, 2, 10)
    expect(result.totalMasuk).toBe(2)
    expect(result.totalKeluar).toBe(10)
    expect(result.sisaStok).toBe(-8)
  })
})

// ─── Unit Tests: validateStockTransactionInput ───────────────────────────────

describe('validateStockTransactionInput', () => {
  it('accepts valid MASUK transaction', () => {
    const result = validateStockTransactionInput({
      kategori: 'LAPTOP',
      tipeTransaksi: 'MASUK',
      jumlah: 5,
      tanggal: '2024-01-15',
    })
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.data.kategori).toBe('LAPTOP')
      expect(result.data.tipeTransaksi).toBe('MASUK')
      expect(result.data.jumlah).toBe(5)
    }
  })

  it('accepts valid KELUAR transaction with optional fields', () => {
    const result = validateStockTransactionInput({
      kategori: 'UPS',
      tipeTransaksi: 'KELUAR',
      jumlah: 3,
      tanggal: '2024-06-01',
      tujuan: 'Gudang A',
      keterangan: 'Pengiriman rutin',
    })
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.data.tujuan).toBe('Gudang A')
      expect(result.data.keterangan).toBe('Pengiriman rutin')
    }
  })

  it('accepts valid input without optional tujuan and keterangan', () => {
    const result = validateStockTransactionInput({
      kategori: 'MONITOR',
      tipeTransaksi: 'MASUK',
      jumlah: 1,
      tanggal: '2024-03-10',
    })
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.data.tujuan).toBeUndefined()
      expect(result.data.keterangan).toBeUndefined()
    }
  })

  it('rejects jumlah = 0', () => {
    const result = validateStockTransactionInput({
      kategori: 'LAPTOP',
      tipeTransaksi: 'MASUK',
      jumlah: 0,
      tanggal: '2024-01-15',
    })
    expect(result.valid).toBe(false)
  })

  it('rejects jumlah = -1', () => {
    const result = validateStockTransactionInput({
      kategori: 'LAPTOP',
      tipeTransaksi: 'MASUK',
      jumlah: -1,
      tanggal: '2024-01-15',
    })
    expect(result.valid).toBe(false)
  })

  it('rejects jumlah = 1.5 (float)', () => {
    const result = validateStockTransactionInput({
      kategori: 'LAPTOP',
      tipeTransaksi: 'MASUK',
      jumlah: 1.5,
      tanggal: '2024-01-15',
    })
    expect(result.valid).toBe(false)
  })

  it('rejects jumlah = null', () => {
    const result = validateStockTransactionInput({
      kategori: 'LAPTOP',
      tipeTransaksi: 'MASUK',
      jumlah: null,
      tanggal: '2024-01-15',
    })
    expect(result.valid).toBe(false)
  })

  it('rejects unknown kategori', () => {
    const result = validateStockTransactionInput({
      kategori: 'UNKNOWN_CATEGORY',
      tipeTransaksi: 'MASUK',
      jumlah: 1,
      tanggal: '2024-01-15',
    })
    expect(result.valid).toBe(false)
  })

  it('rejects invalid tanggal string', () => {
    const result = validateStockTransactionInput({
      kategori: 'LAPTOP',
      tipeTransaksi: 'MASUK',
      jumlah: 1,
      tanggal: 'not-a-date',
    })
    expect(result.valid).toBe(false)
  })

  it('rejects non-object body', () => {
    expect(validateStockTransactionInput(null).valid).toBe(false)
    expect(validateStockTransactionInput('string').valid).toBe(false)
    expect(validateStockTransactionInput(42).valid).toBe(false)
  })
})

// ─── Property Tests ───────────────────────────────────────────────────────────

describe('Property-based tests', () => {
  // Feature: stock-move, Property 1: Stock Summary Calculation Invariant
  it('Property 1: calculateStockSummary invariant holds for all non-negative inputs', () => {
    fc.assert(
      fc.property(fc.nat(), fc.nat(), fc.nat(), (base, masuk, keluar) => {
        const result = calculateStockSummary(base, masuk, keluar)
        return (
          result.totalMasuk === base + masuk &&
          result.totalKeluar === keluar &&
          result.sisaStok === result.totalMasuk - result.totalKeluar
        )
      }),
      { numRuns: 100 }
    )
  })

  // Feature: stock-move, Property 2: Invalid jumlah Rejected
  it('Property 2: invalid jumlah values are always rejected', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(0),
          fc.integer({ max: -1 }),
          fc.double({ min: 0.1, max: 0.9, noNaN: true }),
          fc.constant(null),
          fc.constant(undefined)
        ),
        (invalidJumlah) => {
          const body = {
            kategori: 'LAPTOP',
            tipeTransaksi: 'MASUK',
            jumlah: invalidJumlah,
            tanggal: '2024-01-15',
          }
          const result = validateStockTransactionInput(body)
          return result.valid === false
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: stock-move, Property 3: Invalid kategori Rejected
  it('Property 3: strings that are not valid kategori are always rejected', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !(VALID_CATEGORIES as readonly string[]).includes(s)),
        (invalidKategori) => {
          const body = {
            kategori: invalidKategori,
            tipeTransaksi: 'MASUK',
            jumlah: 1,
            tanggal: '2024-01-15',
          }
          const result = validateStockTransactionInput(body)
          return result.valid === false
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: stock-move, Property 4: Valid Transaction Input Accepted
  it('Property 4: valid combinations of inputs are always accepted', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_CATEGORIES),
        fc.constantFrom('MASUK' as const, 'KELUAR' as const),
        fc.integer({ min: 1, max: 10000 }),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31'), noInvalidDate: true }),
        (kategori, tipeTransaksi, jumlah, tanggal) => {
          const body = {
            kategori,
            tipeTransaksi,
            jumlah,
            tanggal: tanggal.toISOString(),
          }
          const result = validateStockTransactionInput(body)
          return result.valid === true
        }
      ),
      { numRuns: 100 }
    )
  })
})
