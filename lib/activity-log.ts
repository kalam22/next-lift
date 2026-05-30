/**
 * Activity Log helper — mencatat semua aksi CREATE/UPDATE/DELETE
 * pada setiap entitas di semua menu.
 *
 * Gunakan fungsi `logActivity()` dari API routes setelah operasi DB berhasil.
 * Fire-and-forget: error tidak akan menggagalkan request utama.
 */

import { prisma } from '@/lib/prisma'

export type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE'

export interface LogActivityParams {
  entityType: string       // 'laptop' | 'pc' | 'mouse' | 'monitor' | 'ups' | 'printer' | 'tools_jaringan' | 'cctv' | 'storage' | 'lift' | 'stock_move'
  entityId: number
  action: ActivityAction
  description?: string     // Deskripsi singkat apa yang berubah
  userId?: number | null
  userName?: string | null
}

/**
 * Catat satu entri activity log.
 * Selalu fire-and-forget — tidak melempar error ke caller.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await (prisma as any).activityLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        description: params.description ?? null,
        userId: params.userId ?? null,
        userName: params.userName ?? null,
      },
    })
  } catch {
    // Jangan sampai gagal log menggagalkan request utama
  }
}

/**
 * Ambil activity log untuk satu entitas, diurutkan terbaru dulu.
 */
export async function getActivityLogs(entityType: string, entityId: number) {
  return (prisma as any).activityLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      action: true,
      description: true,
      userName: true,
      userId: true,
      createdAt: true,
    },
  })
}

/**
 * Label aksi dalam Bahasa Indonesia
 */
export function actionLabel(action: string): string {
  switch (action) {
    case 'CREATE': return 'Ditambahkan'
    case 'UPDATE': return 'Diperbarui'
    case 'DELETE': return 'Dihapus'
    default: return action
  }
}

/**
 * Warna badge per aksi
 */
export function actionColor(action: string): 'green' | 'blue' | 'red' {
  switch (action) {
    case 'CREATE': return 'green'
    case 'UPDATE': return 'blue'
    case 'DELETE': return 'red'
    default: return 'blue'
  }
}
