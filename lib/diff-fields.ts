/**
 * Helper untuk membandingkan field lama vs baru dan menghasilkan
 * deskripsi perubahan yang human-readable untuk activity log.
 *
 * Contoh output: `Brand: "Acer" → "HP" · Status: "BARU" → "SECOND"`
 */

export interface FieldDiff {
  label: string
  oldValue: string | number | null | undefined
  newValue: string | number | null | undefined
}

/**
 * Bandingkan array field dan kembalikan string deskripsi perubahan.
 * Hanya field yang benar-benar berubah yang dimasukkan.
 */
export function buildDiffDescription(diffs: FieldDiff[]): string | null {
  const changes = diffs
    .filter(({ oldValue, newValue }) => {
      const o = oldValue ?? ''
      const n = newValue ?? ''
      return String(o).trim() !== String(n).trim()
    })
    .map(({ label, oldValue, newValue }) => {
      const o = oldValue ? String(oldValue) : '-'
      const n = newValue ? String(newValue) : '-'
      return `${label}: "${o}" → "${n}"`
    })

  return changes.length > 0 ? changes.join(' · ') : null
}

/**
 * Format tanggal untuk ditampilkan di diff (dd/mm/yyyy)
 */
export function formatDateForDiff(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
