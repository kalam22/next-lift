import { formatWITA } from '@/lib/utils/date'

interface MetadataCardProps {
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
}

export default function MetadataCard({ createdAt, updatedAt }: MetadataCardProps) {
  // Convert Date to string if needed
  const createdAtStr = createdAt instanceof Date ? createdAt.toISOString() : createdAt
  const updatedAtStr = updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 border-b border-[#f1f5f9] dark:border-[#334155] pb-4 mb-4">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Metadata</h3>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold text-gray-400 uppercase">Dibuat</span>
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
            {createdAtStr ? formatWITA(createdAtStr) + ' WITA' : '-'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold text-gray-400 uppercase">Diperbarui</span>
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
            {updatedAtStr ? formatWITA(updatedAtStr, true) + ' WITA' : '-'}
          </span>
        </div>
      </div>
    </div>
  )
}

