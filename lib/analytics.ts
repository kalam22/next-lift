/**
 * Performance monitoring and analytics utilities
 * Track Web Vitals and API performance metrics
 */

export interface WebVitalsMetric {
  id: string
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta?: number
  navigationType?: string
}

export interface APIMetric {
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  timestamp: number
}

// In-memory storage for metrics (in production, use external service)
const metrics: {
  webVitals: WebVitalsMetric[]
  apiMetrics: APIMetric[]
} = {
  webVitals: [],
  apiMetrics: [],
}

/**
 * Report Web Vitals metric
 */
export function reportWebVital(metric: WebVitalsMetric): void {
  // Store metric
  metrics.webVitals.push(metric)

  // Keep only last 100 metrics
  if (metrics.webVitals.length > 100) {
    metrics.webVitals.shift()
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric.name, metric.value, metric.rating)
  }

  // In production, send to analytics service
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    // Send to analytics endpoint
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'web-vital', metric }),
    }).catch(() => {
      // Silent fail - don't block on analytics
    })
  }
}

/**
 * Report API metric
 */
export function reportAPIMetric(metric: APIMetric): void {
  // Store metric
  metrics.apiMetrics.push(metric)

  // Keep only last 500 metrics
  if (metrics.apiMetrics.length > 500) {
    metrics.apiMetrics.shift()
  }

  // Log slow requests (> 1 second)
  if (metric.responseTime > 1000) {
    console.warn(`[Slow API] ${metric.method} ${metric.endpoint} took ${metric.responseTime}ms`)
  }
}

/**
 * Get Web Vitals metrics
 */
export function getWebVitalsMetrics(): WebVitalsMetric[] {
  return [...metrics.webVitals]
}

/**
 * Get API metrics
 */
export function getAPIMetrics(): APIMetric[] {
  return [...metrics.apiMetrics]
}

/**
 * Get average API response time for an endpoint
 */
export function getAverageResponseTime(endpoint: string, method: string = 'GET'): number {
  const relevantMetrics = metrics.apiMetrics.filter(
    m => m.endpoint === endpoint && m.method === method
  )

  if (relevantMetrics.length === 0) return 0

  const sum = relevantMetrics.reduce((acc, m) => acc + m.responseTime, 0)
  return Math.round(sum / relevantMetrics.length)
}

/**
 * Get performance summary
 */
export function getPerformanceSummary(): {
  webVitals: {
    total: number
    good: number
    needsImprovement: number
    poor: number
  }
  apiMetrics: {
    total: number
    averageResponseTime: number
    slowRequests: number
  }
} {
  const webVitalsSummary = metrics.webVitals.reduce(
    (acc, m) => {
      acc.total++
      if (m.rating === 'good') acc.good++
      else if (m.rating === 'needs-improvement') acc.needsImprovement++
      else acc.poor++
      return acc
    },
    { total: 0, good: 0, needsImprovement: 0, poor: 0 }
  )

  const apiMetricsSummary = metrics.apiMetrics.reduce(
    (acc, m) => {
      acc.total++
      acc.totalResponseTime += m.responseTime
      if (m.responseTime > 1000) acc.slowRequests++
      return acc
    },
    { total: 0, totalResponseTime: 0, slowRequests: 0 }
  )

  return {
    webVitals: webVitalsSummary,
    apiMetrics: {
      total: apiMetricsSummary.total,
      averageResponseTime:
        apiMetricsSummary.total > 0
          ? Math.round(apiMetricsSummary.totalResponseTime / apiMetricsSummary.total)
          : 0,
      slowRequests: apiMetricsSummary.slowRequests,
    },
  }
}

