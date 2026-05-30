'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { History, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'

interface ActivityLogEntry {
  id: number
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  description: string | null
  userName: string | null
  userId: number | null
  createdAt: string
}

interface ActivityLogPanelProps {
  entityType: string
  entityId: number
}

// Warna avatar berdasarkan nama user (konsisten per user)
function getAvatarColor(name: string | null): string {
  if (!name) return 'bg-gray-400'
  const colors = [
    'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
    'bg-orange-500', 'bg-pink-500', 'bg-cyan-500',
    'bg-indigo-500', 'bg-teal-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function actionConfig(action: string) {
  if (action === 'CREATE') return {
    icon: <Plus className="w-3 h-3" />,
    label: 'Ditambahkan',
    bg: 'bg-green-50 dark:bg-green-500/10',
    text: 'text-green-600 dark:text-green-400',
    dot: 'bg-green-400',
  }
  if (action === 'UPDATE') return {
    icon: <Pencil className="w-3 h-3" />,
    label: 'Diperbarui',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-400',
  }
  return {
    icon: <Trash2 className="w-3 h-3" />,
    label: 'Dihapus',
    bg: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-400',
  }
}

function formatRelative(dateInput: string): string {
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return '-'
  const now = Date.now()
  const diff = now - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} menit lalu`
  if (hours < 24) return `${hours} jam lalu`
  if (days < 7) return `${days} hari lalu`
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date).replace(/\./g, ' ')
}

function formatFull(dateInput: string): string {
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date).replace(/\./g, ' ')
}

// Group logs by date
function groupByDate(logs: ActivityLogEntry[]) {
  const groups: { date: string; items: ActivityLogEntry[] }[] = []
  const map = new Map<string, ActivityLogEntry[]>()

  logs.forEach((log) => {
    const d = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      day: '2-digit', month: 'long', year: 'numeric',
    }).format(new Date(log.createdAt))
    if (!map.has(d)) map.set(d, [])
    map.get(d)!.push(log)
  })

  map.forEach((items, date) => groups.push({ date, items }))
  return groups
}

export default function ActivityLogPanel({ entityType, entityId }: ActivityLogPanelProps) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      // entityId = 0 berarti ambil semua log untuk entityType (tanpa filter per item)
      const url = entityId === 0
        ? `/api/activity-log?entityType=${entityType}`
        : `/api/activity-log?entityType=${entityType}&entityId=${entityId}`
      const res = await axios.get<ActivityLogEntry[]>(url)
      setLogs(res.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [entityType, entityId])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const groups = groupByDate(logs)

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-[#f1f5f9] dark:border-[#334155] bg-gray-50/50 dark:bg-[#0f172a]/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <History className="w-4 h-4 text-gray-400" />
          <h3 className="text-[10px] font-black text-[#0f172a] dark:text-white uppercase tracking-[0.2em]">
            Log Aktivitas
          </h3>
          {!loading && (
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-[10px] font-black text-gray-500 dark:text-gray-400">
              {logs.length}
            </span>
          )}
        </div>
        <button
          onClick={() => fetchLogs(true)}
          disabled={refreshing}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-2xl bg-gray-100 dark:bg-gray-700 flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 w-32 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                  <div className="h-3 w-56 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
              <History className="w-5 h-5 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Belum ada aktivitas</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-[#f1f5f9] dark:bg-[#334155]" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 whitespace-nowrap">
                    {group.date}
                  </span>
                  <div className="flex-1 h-px bg-[#f1f5f9] dark:bg-[#334155]" />
                </div>

                {/* Log entries */}
                <div className="space-y-3">
                  {group.items.map((log) => {
                    const cfg = actionConfig(log.action)
                    const initials = getInitials(log.userName)
                    const avatarColor = getAvatarColor(log.userName)

                    return (
                      <div key={log.id} className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-2xl ${avatarColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <span className="text-[10px] font-black text-white">{initials}</span>
                        </div>

                        {/* Bubble */}
                        <div className="flex-1 min-w-0">
                          <div className="bg-gray-50 dark:bg-[#0f172a]/40 rounded-2xl rounded-tl-sm px-4 py-3 border border-[#f1f5f9] dark:border-[#334155]">
                            {/* Top row: name + badge + time */}
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <span className="text-xs font-black text-[#0f172a] dark:text-white">
                                {log.userName || 'System'}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ${cfg.bg} ${cfg.text} text-[10px] font-black uppercase tracking-widest`}>
                                {cfg.icon}
                                {cfg.label}
                              </span>
                              <span
                                className="text-[10px] text-gray-400 font-bold ml-auto"
                                title={formatFull(log.createdAt)}
                              >
                                {formatRelative(log.createdAt)}
                              </span>
                            </div>
                            {/* Description */}
                            {log.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                {log.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
