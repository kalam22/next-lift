import React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import type { Lift } from '@/types/lift'

interface LiftTableRowProps {
  lift: Lift
  index: number
  currentPage: number
  itemsPerPage: number
  showColumns: {
    no: boolean
    nama: boolean
    pt: boolean
    departemen: boolean
    berlaku: boolean
    akses: boolean
    status: boolean
    aksi: boolean
  }
  selectedItems: Set<number>
  onSelectItem: (id: number, checked: boolean) => void
  onDelete: (id: number) => void
  canEdit?: boolean
  canDelete?: boolean
}

function LiftTableRow({
  lift,
  index,
  currentPage,
  itemsPerPage,
  showColumns,
  selectedItems,
  onSelectItem,
  onDelete,
  canEdit = true,
  canDelete = true,
}: LiftTableRowProps) {
  const now = Date.now()
  const berlakuDate = lift.berlaku ? new Date(lift.berlaku).getTime() : null
  const isExpired = berlakuDate && berlakuDate < now
  const daysRemaining = berlakuDate
    ? Math.ceil((berlakuDate - now) / (86400000))
    : null
  const isExpiringSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7

  const statusStyles = isExpired
    ? 'bg-red-500/5 text-red-500 ring-red-500/20'
    : isExpiringSoon
      ? 'bg-amber-500/5 text-amber-500 ring-amber-500/20'
      : 'bg-emerald-500/5 text-emerald-500 ring-emerald-500/20'

  const dotStyles = isExpired
    ? 'bg-red-500 animate-pulse'
    : isExpiringSoon
      ? 'bg-amber-500 animate-pulse'
      : 'bg-emerald-500'

  return (
    <tr
      className={`group hover:bg-blue-50/10 dark:hover:bg-blue-500/10 transition-colors duration-200 ${selectedItems.has(lift.id) ? 'bg-blue-50/50 dark:bg-blue-500/10' : ''}`}
    >
      <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
        <div className="flex items-center">
          <input
            type="checkbox"
            aria-label={`Pilih ${lift.nama}`}
            checked={selectedItems.has(lift.id)}
            onChange={(e) => onSelectItem(lift.id, e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
          />
        </div>
      </td>
      {showColumns.no && (
        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
          <span className="text-xs font-black text-gray-700 dark:text-gray-300">
            {(currentPage - 1) * itemsPerPage + index + 1}
          </span>
        </td>
      )}
      {showColumns.nama && (
        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
          <span className="text-xs sm:text-sm font-black text-[#020617] dark:text-white uppercase tracking-tight">
            {lift.nama}
          </span>
        </td>
      )}
      {showColumns.pt && (
        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
          <span className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-[9px] sm:text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ring-1 ring-gray-200 dark:ring-white/5 whitespace-nowrap">
            {lift.pt}
          </span>
        </td>
      )}
      {showColumns.departemen && (
        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
          <span className="text-[10px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
            {lift.departemen || '-'}
          </span>
        </td>
      )}
      {showColumns.berlaku && (
        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
          <div className="flex flex-col gap-0.5">
            <span className={`text-[10px] sm:text-xs font-black ${isExpired ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
              {lift.berlaku ? format(new Date(lift.berlaku), 'dd MMM yyyy', { locale: id }) : 'PERMANEN'}
            </span>
            {daysRemaining !== null && !isExpired && (
              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-tighter ${isExpiringSoon ? 'text-amber-500' : 'text-gray-400'}`}>
                {daysRemaining} Hari lagi
              </span>
            )}
          </div>
        </td>
      )}
      {showColumns.akses && (
        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
          <div className="flex gap-1 flex-wrap">
            {Array.isArray(lift.aksesArray) && lift.aksesArray.slice(0, 5).map((lantai: number) => (
              <div
                key={lantai}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-center text-[8px] sm:text-[9px] font-black text-blue-600 shadow-sm"
              >
                {lantai}
              </div>
            ))}
            {Array.isArray(lift.aksesArray) && lift.aksesArray.length > 5 && (
              <span className="text-[8px] sm:text-[9px] font-bold text-gray-400 self-center">+{lift.aksesArray.length - 5}</span>
            )}
          </div>
        </td>
      )}
      {showColumns.status && (
        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
          <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full ring-1 ring-inset ${statusStyles}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${dotStyles}`}></div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              {isExpired ? 'EXPIRED' : isExpiringSoon ? 'SOON' : 'ACTIVE'}
            </span>
          </div>
        </td>
      )}
      {showColumns.aksi && (
        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <Link
              href={`/lifts/${lift.id}/view`}
              aria-label={`Lihat detail ${lift.nama}`}
              title="Lihat Detail"
              className="min-w-[36px] min-h-[36px] flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7" /></svg>
            </Link>
            {canEdit && (
              <Link
                href={`/lifts/${lift.id}/edit`}
                aria-label={`Edit ${lift.nama}`}
                title="Edit"
                className="min-w-[36px] min-h-[36px] flex items-center justify-center p-2 text-gray-400 hover:text-amber-500 transition-colors rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </Link>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(lift.id)}
                aria-label={`Hapus ${lift.nama}`}
                title="Hapus"
                className="min-w-[36px] min-h-[36px] flex items-center justify-center p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  )
}

export default React.memo(LiftTableRow)

