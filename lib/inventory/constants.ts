/**
 * Shared Inventory Constants
 * Common constants for all inventory pages (laptops, mouse, monitor, etc.)
 */

// ─── Timing Constants ─────────────────────────────────────────────────────────

export const FOCUS_DELAY_MS = 50
export const DEBOUNCE_DELAY_MS = 300
export const SEARCH_DEBOUNCE_MS = 500

// ─── Pagination Constants ─────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

// ─── SweetAlert2 Configurations ───────────────────────────────────────────────

export const SWAL_BASE_CONFIG = {
  buttonsStyling: false,
  customClass: {
    popup: '!rounded-2xl',
    title: '!font-bold',
  },
} as const

export const SWAL_ERROR_CONFIG = {
  ...SWAL_BASE_CONFIG,
  icon: 'error' as const,
  confirmButtonText: 'OK',
  customClass: {
    ...SWAL_BASE_CONFIG.customClass,
    confirmButton: 'swal2-confirm',
  },
} as const

export const SWAL_CONFIRM_DELETE_CONFIG = {
  ...SWAL_BASE_CONFIG,
  icon: 'warning' as const,
  showCancelButton: true,
  confirmButtonText: 'Ya, Hapus!',
  cancelButtonText: 'Batal',
  reverseButtons: true,
  customClass: {
    ...SWAL_BASE_CONFIG.customClass,
    confirmButton: 'swal2-confirm',
    cancelButton: 'swal2-cancel',
  },
} as const

export const SWAL_SUCCESS_CONFIG = {
  ...SWAL_BASE_CONFIG,
  icon: 'success' as const,
  timer: 2000,
  showConfirmButton: false,
} as const

// ─── CSS Class Constants ──────────────────────────────────────────────────────

export const INPUT_CLASSES = {
  base: 'input-premium w-full',
  error: 'border-red-400/50',
  disabled: 'opacity-50',
} as const

export const BUTTON_CLASSES = {
  primary: 'px-6 py-3 bg-primary text-white rounded-2xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 font-bold',
  secondary: 'px-6 py-3 bg-gray-50 dark:bg-[#0f172a] text-gray-600 dark:text-gray-400 rounded-2xl border border-[#f1f5f9] dark:border-[#334155] hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-bold',
  danger: 'p-2 bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-white/5 rounded-xl text-gray-400 hover:text-red-500 hover:scale-110 hover:shadow-xl hover:shadow-red-500/10 transition-all',
  edit: 'p-2 bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-white/5 rounded-xl text-gray-400 hover:text-amber-500 hover:scale-110 hover:shadow-xl hover:shadow-amber-500/10 transition-all',
  view: 'p-2 bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-white/5 rounded-xl text-gray-400 hover:text-blue-500 hover:scale-110 hover:shadow-xl hover:shadow-blue-500/10 transition-all',
} as const

export const LABEL_CLASSES = 'text-[10px] font-black uppercase tracking-widest text-gray-400' as const

export const TABLE_CLASSES = {
  container: 'overflow-x-auto custom-scrollbar',
  table: 'w-full border-collapse',
  header: 'bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-[#0f172a] dark:to-[#1e293b]/50 border-b-2 border-[#e2e8f0] dark:border-[#334155]',
  headerCell: 'px-4 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]',
  row: 'group hover:bg-primary/[0.02] dark:hover:bg-primary/[0.03] transition-all duration-300 border-b border-gray-100/50 dark:border-white/[0.02]',
  cell: 'px-4 py-5',
} as const

// ─── Error Messages ───────────────────────────────────────────────────────────

export const ERROR_MESSAGES = {
  fetchFailed: 'Gagal memuat data',
  saveFailed: 'Gagal menyimpan data',
  updateFailed: 'Gagal memperbarui data',
  deleteFailed: 'Gagal menghapus data',
  exportFailed: 'Gagal mengekspor data',
  uploadFailed: 'Gagal mengupload file',
  generic: 'Terjadi kesalahan',
} as const

// ─── Success Messages ─────────────────────────────────────────────────────────

export const SUCCESS_MESSAGES = {
  saved: 'Data berhasil disimpan',
  updated: 'Data berhasil diperbarui',
  deleted: 'Data berhasil dihapus',
  exported: 'Data berhasil diekspor',
  uploaded: 'File berhasil diupload',
} as const

// ─── Validation Messages ──────────────────────────────────────────────────────

export const VALIDATION_MESSAGES = {
  required: (field: string) => `${field} wajib diisi`,
  minLength: (field: string, min: number) => `${field} minimal ${min} karakter`,
  maxLength: (field: string, max: number) => `${field} maksimal ${max} karakter`,
  invalidFormat: (field: string) => `Format ${field} tidak valid`,
  invalidDate: 'Tanggal tidak valid',
  invalidNumber: 'Harus berupa angka',
  minValue: (field: string, min: number) => `${field} minimal ${min}`,
  maxValue: (field: string, max: number) => `${field} maksimal ${max}`,
} as const

// ─── Status Options ───────────────────────────────────────────────────────────

export const STATUS_OPTIONS = [
  { value: 'BARU', label: 'BARU' },
  { value: 'SECOND', label: 'SECOND' },
  { value: 'SERVICE', label: 'SERVICE' },
] as const

// ─── Site Options ─────────────────────────────────────────────────────────────

export const SITE_OPTIONS = [
  { value: 'HO', label: 'HO' },
  { value: 'WS89', label: 'WS89' },
  { value: 'THS', label: 'THS' },
  { value: 'GAM', label: 'GAM' },
  { value: 'AKP', label: 'AKP' },
  { value: 'ARSY', label: 'ARSY' },
] as const
