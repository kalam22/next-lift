/**
 * Stock Move Constants
 * Shared constants for stock movement operations
 */

// ─── Timing Constants ─────────────────────────────────────────────────────────

export const FOCUS_DELAY_MS = 50
export const DEBOUNCE_DELAY_MS = 300
export const REFETCH_DELAY_MS = 100

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

export const SWAL_CONFIRM_CONFIG = {
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
  primary: 'btn-premium flex items-center gap-2 px-6 py-3 text-[11px]',
  secondary: 'px-4 py-2 bg-white dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#1e293b] rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all',
  danger: 'p-2 bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-white/5 rounded-xl text-gray-400 hover:text-red-500 hover:scale-110 hover:shadow-xl hover:shadow-red-500/10 transition-all',
  edit: 'p-2 bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-white/5 rounded-xl text-gray-400 hover:text-amber-500 hover:scale-110 hover:shadow-xl hover:shadow-amber-500/10 transition-all',
} as const

export const LABEL_CLASSES = 'text-[10px] font-black uppercase tracking-widest text-gray-400' as const

export const DROPDOWN_CLASSES = {
  container: 'absolute z-50 mt-1 w-full bg-white dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#1e293b] rounded-2xl shadow-xl shadow-black/10 overflow-hidden',
  item: 'w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-primary/5 transition-colors',
  itemActive: 'text-primary bg-primary/5',
} as const

// ─── API Endpoints ────────────────────────────────────────────────────────────

export const API_ENDPOINTS = {
  stockMove: '/api/stock-move',
  itemTypes: '/api/stock-move/item-types',
  vendors: '/api/stock-move/vendors',
  namaSuggestions: '/api/stock-move/nama-suggestions',
} as const

// ─── Form Validation Messages ─────────────────────────────────────────────────

export const VALIDATION_MESSAGES = {
  tanggalRequired: 'Tanggal wajib diisi',
  typeBarangRequired: 'Type barang wajib diisi',
  namaBarangRequired: 'Nama barang wajib diisi',
  qualityMinimum: 'Quality minimal 1',
} as const

// ─── Error Messages ───────────────────────────────────────────────────────────

export const ERROR_MESSAGES = {
  fetchFailed: 'Gagal memuat data',
  saveFailed: 'Gagal menyimpan transaksi',
  updateFailed: 'Gagal memperbarui transaksi',
  deleteFailed: 'Gagal menghapus transaksi',
  exportFailed: 'Gagal mengekspor data',
  generic: 'Terjadi kesalahan',
} as const
