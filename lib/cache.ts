/**
 * Multi-layer cache implementation dengan LRU cache dan Redis support
 * Falls back to in-memory cache if Redis is not available
 */

import { redisGet, redisSet, redisDelete, redisDeletePattern, isRedisAvailable } from './redis'

interface CacheEntry<T> {
  value: T
  expiresAt: number
  accessTime: number
}

class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>
  private maxSize: number
  private defaultTTL: number // in milliseconds

  constructor(maxSize: number = 100, defaultTTL: number = 30000) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  /**
   * Generate cache key dari URL dan query parameters
   */
  static generateKey(url: string, params?: Record<string, string | null>): string {
    if (!params || Object.keys(params).length === 0) {
      return url
    }
    
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key] ?? ''}`)
      .join('&')
    
    return `${url}?${sortedParams}`
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    // Update access time (LRU)
    entry.accessTime = Date.now()
    return entry.value
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now()
    const expiresAt = now + (ttl ?? this.defaultTTL)

    // If cache is full, remove least recently used
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU()
    }

    this.cache.set(key, {
      value,
      expiresAt,
      accessTime: now,
    })
  }

  /**
   * Remove least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessTime < oldestTime) {
        oldestTime = entry.accessTime
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    }
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }
}

// Global cache instance untuk API responses
// Dashboard cache: 30 seconds TTL, max 50 entries
export const dashboardCache = new LRUCache<any>(50, 30000)

// General API cache: 10 seconds TTL, max 100 entries
export const apiCache = new LRUCache<any>(100, 10000)

// Multi-layer cache helper for dashboard
export const dashboardCacheMultiLayer = {
  /**
   * Get from cache (Redis first, then in-memory)
   */
  get: async <T>(key: string): Promise<T | null> => {
    // Try Redis first
    if (isRedisAvailable()) {
      try {
        const redisValue = await redisGet(`dashboard:${key}`)
        if (redisValue) {
          const parsed = JSON.parse(redisValue)
          // Also update in-memory cache
          dashboardCache.set(key, parsed)
          return parsed as T
        }
      } catch (error) {
        // Fall through to in-memory cache
      }
    }

    // Fallback to in-memory cache
    return dashboardCache.get(key) as T | null
  },

  /**
   * Set in cache (both Redis and in-memory)
   */
  set: async <T>(key: string, value: T, ttl?: number): Promise<void> => {
    // Set in in-memory cache
    dashboardCache.set(key, value, ttl)

    // Also set in Redis if available
    if (isRedisAvailable()) {
      try {
        const ttlSeconds = ttl ? Math.floor(ttl / 1000) : 30 // Default 30 seconds for dashboard
        await redisSet(`dashboard:${key}`, JSON.stringify(value), ttlSeconds)
      } catch (error) {
        // Silent fail - in-memory cache is still set
      }
    }
  },

  /**
   * Delete from cache
   */
  delete: async (key: string): Promise<void> => {
    dashboardCache.delete(key)
    if (isRedisAvailable()) {
      try {
        await redisDelete(`dashboard:${key}`)
      } catch (error) {
        // Silent fail
      }
    }
  },

  /**
   * Clear all dashboard cache
   */
  clear: async (): Promise<void> => {
    dashboardCache.clear()
    if (isRedisAvailable()) {
      try {
        await redisDeletePattern('dashboard:*')
      } catch (error) {
        // Silent fail
      }
    }
  },
}

// Cache helper functions with multi-layer support
export const cache = {
  /**
   * Get cached response (checks Redis first, then in-memory)
   */
  get: async <T>(key: string): Promise<T | null> => {
    // Try Redis first
    if (isRedisAvailable()) {
      try {
        const redisValue = await redisGet(key)
        if (redisValue) {
          const parsed = JSON.parse(redisValue)
          // Also update in-memory cache for faster subsequent access
          apiCache.set(key, parsed)
          return parsed as T
        }
      } catch (error) {
        // Fall through to in-memory cache
      }
    }

    // Fallback to in-memory cache
    return apiCache.get(key) as T | null
  },

  /**
   * Set cached response (sets in both Redis and in-memory)
   */
  set: async <T>(key: string, value: T, ttl?: number): Promise<void> => {
    // Set in in-memory cache
    apiCache.set(key, value, ttl)

    // Also set in Redis if available
    if (isRedisAvailable()) {
      try {
        const ttlSeconds = ttl ? Math.floor(ttl / 1000) : undefined
        await redisSet(key, JSON.stringify(value), ttlSeconds)
      } catch (error) {
        // Silent fail - in-memory cache is still set
      }
    }
  },

  /**
   * Delete cached response (deletes from both Redis and in-memory)
   */
  delete: async (key: string): Promise<void> => {
    // Delete from in-memory cache
    apiCache.delete(key)

    // Also delete from Redis if available
    if (isRedisAvailable()) {
      try {
        await redisDelete(key)
      } catch (error) {
        // Silent fail
      }
    }
  },

  /**
   * Clear all cache (clears both Redis and in-memory)
   */
  clear: async (): Promise<void> => {
    // Clear in-memory cache
    apiCache.clear()
    dashboardCache.clear()

    // Also clear Redis if available
    if (isRedisAvailable()) {
      try {
        await redisDeletePattern('*')
      } catch (error) {
        // Silent fail
      }
    }
  },

  /**
   * Clear expired entries
   */
  clearExpired: (): void => {
    apiCache.clearExpired()
    dashboardCache.clearExpired()
  },

  /**
   * Generate cache key
   */
  generateKey: LRUCache.generateKey,
}

// Periodic cleanup of expired entries (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.clearExpired()
  }, 5 * 60 * 1000)
}
