import { pool } from './pool'

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - windowMs)

  const result = await pool.query(`
    INSERT INTO rate_limits (key, count, window_start)
    VALUES ($1, 1, NOW())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limits.window_start < $2 THEN 1
        ELSE rate_limits.count + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start < $2 THEN NOW()
        ELSE rate_limits.window_start
      END
    RETURNING count, window_start
  `, [key, windowStart])

  const { count, window_start } = result.rows[0]
  const resetAt = new Date(new Date(window_start).getTime() + windowMs)

  // Probabilistic cleanup (1% of requests)
  if (Math.random() < 0.01) {
    pool.query("DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 hour'")
      .catch(() => {})
  }

  return {
    allowed: count <= maxAttempts,
    remaining: Math.max(0, maxAttempts - count),
    resetAt
  }
}
