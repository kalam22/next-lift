/**
 * Shared constants untuk aplikasi
 * Single source of truth untuk values yang digunakan di multiple places
 */

// Site options yang digunakan di semua form
export const SITE_OPTIONS = ['HO', 'WS89', 'THS', 'GAM', 'AKP', 'ARSY'] as const

// Status barang options
export const STATUS_BARANG_OPTIONS = ['BARU', 'SECOND', 'SERVICE'] as const
export type StatusBarang = typeof STATUS_BARANG_OPTIONS[number]

// Status untuk Lifts
export const LIFT_STATUS = {
  ACTIVE: 'active',
  EXPIRING_SOON: 'expiring_soon',
  EXPIRED: 'expired',
} as const


// Departemen options yang digunakan di semua form inventaris
export const DEPARTEMEN_OPTIONS = [
  'HRD', 'Plant', 'Logistik', 'GA', 'Payroll', 'HSE',
  'Engineering', 'Finance', 'Purchasing', 'IT',
  'Management', 'Accounting', 'Pajak', 'Legal', 'Training Center', 'PJO',
] as const

export type Departemen = typeof DEPARTEMEN_OPTIONS[number]
