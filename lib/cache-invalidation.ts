/**
 * Cache invalidation utilities
 * Invalidate cache when data is modified (POST, PUT, DELETE)
 */

import { dashboardCacheMultiLayer, cache } from './cache'

/**
 * Invalidate dashboard cache (both Redis and in-memory)
 */
export async function invalidateDashboardCache(): Promise<void> {
  await dashboardCacheMultiLayer.clear()
}

/**
 * Invalidate a specific entity list cache + dashboard.
 * Call this after any POST/PUT/DELETE on an entity.
 */
export async function invalidateEntityCache(entityPath: string): Promise<void> {
  await Promise.all([
    cache.delete(entityPath),
    dashboardCacheMultiLayer.clear(),
  ])
}

/**
 * Invalidate all caches
 */
export async function invalidateAllCache(): Promise<void> {
  await Promise.all([
    dashboardCacheMultiLayer.clear(),
  ])
}
