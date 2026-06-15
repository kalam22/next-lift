/**
 * Simple in-memory LRU cache
 * Redis dependency removed (was not needed).
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class SimpleCache<T> {
  store = new Map<string, CacheEntry<T>>()
  private maxSize: number

  constructor(maxSize = 100) {
    this.maxSize = maxSize
  }

  get(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  set(key: string, value: T, ttlMs = 30000): void {
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      const first = this.store.keys().next().value
      if (first) this.store.delete(first)
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  delete(key: string): void { this.store.delete(key) }
  clear(): void { this.store.clear() }
}

const apiStore = new SimpleCache<any>(100)
const dashboardStore = new SimpleCache<any>(50)

export const cache = {
  get: <T>(key: string) => Promise.resolve(apiStore.get(key) as T | null),
  set: <T>(key: string, value: T, ttl?: number) => { apiStore.set(key, value, ttl); return Promise.resolve() },
  delete: (key: string) => { apiStore.delete(key); return Promise.resolve() },
  clear: () => { apiStore.clear(); dashboardStore.clear(); return Promise.resolve() },
  deleteByPrefix: (prefix: string) => {
    const keys = Array.from((apiStore as any).store?.keys?.() ?? [])
    for (const key of keys) {
      if (typeof key === 'string' && key.startsWith(prefix)) apiStore.delete(key)
    }
    return Promise.resolve()
  },
  generateKey: (url: string, params?: Record<string, string | null>) => {
    if (!params || Object.keys(params).length === 0) return url
    const sorted = Object.keys(params).sort().map(k => `${k}=${params[k] ?? ''}`).join('&')
    return `${url}?${sorted}`
  },
}

export const dashboardCacheMultiLayer = {
  get: <T>(key: string) => Promise.resolve(dashboardStore.get(key) as T | null),
  set: <T>(key: string, value: T, ttl?: number) => { dashboardStore.set(key, value, ttl); return Promise.resolve() },
  delete: (key: string) => { dashboardStore.delete(key); return Promise.resolve() },
  clear: () => { dashboardStore.clear(); return Promise.resolve() },
}

export async function invalidateDashboardCache(): Promise<void> {
  dashboardStore.clear()
}
