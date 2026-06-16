import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

redis.on('error', (err) => {
  console.warn('[cache] Redis error:', err.message)
})

export const cache = {
  async get(key: string): Promise<unknown | null> {
    try {
      const val = await redis.get(key)
      return val ? JSON.parse(val) : null
    } catch {
      return null
    }
  },

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
    } catch {
      // fallback silencieux si Redis indisponible
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch {
      // fallback silencieux
    }
  },

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) await redis.del(keys)
    } catch {
      // fallback silencieux
    }
  },
}
