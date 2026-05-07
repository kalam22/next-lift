/**
 * Redis client wrapper dengan fallback ke in-memory cache
 * Redis adalah optional - akan fallback jika tidak tersedia
 */

let redisClient: any = null
let redisAvailable = false

// Try to initialize Redis client
try {
  if (process.env.REDIS_URL) {
    const redis = require('redis')
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
    })

    redisClient.on('error', (err: Error) => {
      console.warn('Redis Client Error:', err)
      redisAvailable = false
    })

    redisClient.on('connect', () => {
      redisAvailable = true
      console.log('Redis Client Connected')
    })

    // Connect to Redis (non-blocking)
    redisClient.connect().catch(() => {
      redisAvailable = false
      console.warn('Redis connection failed, using in-memory cache')
    })
  }
} catch (error) {
  console.warn('Redis not available, using in-memory cache:', error)
  redisAvailable = false
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redisAvailable && redisClient !== null
}

/**
 * Get value from Redis
 */
export async function redisGet(key: string): Promise<string | null> {
  if (!isRedisAvailable()) {
    return null
  }

  try {
    return await redisClient.get(key)
  } catch (error) {
    console.warn('Redis GET error:', error)
    return null
  }
}

/**
 * Set value in Redis with TTL
 */
export async function redisSet(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false
  }

  try {
    if (ttlSeconds) {
      await redisClient.setEx(key, ttlSeconds, value)
    } else {
      await redisClient.set(key, value)
    }
    return true
  } catch (error) {
    console.warn('Redis SET error:', error)
    return false
  }
}

/**
 * Delete key from Redis
 */
export async function redisDelete(key: string): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false
  }

  try {
    await redisClient.del(key)
    return true
  } catch (error) {
    console.warn('Redis DELETE error:', error)
    return false
  }
}

/**
 * Delete multiple keys from Redis
 */
export async function redisDeletePattern(pattern: string): Promise<number> {
  if (!isRedisAvailable()) {
    return 0
  }

  try {
    const keys = await redisClient.keys(pattern)
    if (keys.length > 0) {
      await redisClient.del(keys)
    }
    return keys.length
  } catch (error) {
    console.warn('Redis DELETE pattern error:', error)
    return 0
  }
}

/**
 * Clear all Redis cache (use with caution)
 */
export async function redisClear(): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false
  }

  try {
    await redisClient.flushDb()
    return true
  } catch (error) {
    console.warn('Redis CLEAR error:', error)
    return false
  }
}

/**
 * Increment a key in Redis (for rate limiting)
 */
export async function redisIncr(key: string): Promise<number> {
  if (!isRedisAvailable()) {
    return 0
  }

  try {
    return await redisClient.incr(key)
  } catch (error) {
    console.warn('Redis INCR error:', error)
    return 0
  }
}

/**
 * Set expiration for a key in Redis
 */
export async function redisExpire(key: string, seconds: number): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false
  }

  try {
    await redisClient.expire(key, seconds)
    return true
  } catch (error) {
    console.warn('Redis EXPIRE error:', error)
    return false
  }
}

/**
 * Close Redis connection
 */
export async function redisClose(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit()
    } catch (error) {
      console.warn('Redis close error:', error)
    }
  }
}

