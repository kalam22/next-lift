'use client'

import { useEffect } from 'react'
import { onCLS, onINP, onLCP, onFCP, onTTFB, Metric } from 'web-vitals'
import { reportWebVital } from '@/lib/analytics'

/**
 * Web Vitals tracking component
 * Tracks Core Web Vitals and other performance metrics
 */
export function WebVitals() {
  useEffect(() => {
    // Track Largest Contentful Paint (LCP)
    onLCP((metric: Metric) => {
      reportWebVital({
        id: metric.id,
        name: metric.name,
        value: metric.value,
        rating: getRating(metric.name, metric.value),
        delta: metric.delta,
        navigationType: metric.navigationType,
      })
    })

    // Track Interaction to Next Paint (INP) - replaces FID in web-vitals v3+
    onINP((metric: Metric) => {
      reportWebVital({
        id: metric.id,
        name: metric.name,
        value: metric.value,
        rating: getRating(metric.name, metric.value),
        delta: metric.delta,
        navigationType: metric.navigationType,
      })
    })

    // Track Cumulative Layout Shift (CLS)
    onCLS((metric: Metric) => {
      reportWebVital({
        id: metric.id,
        name: metric.name,
        value: metric.value,
        rating: getRating(metric.name, metric.value),
        delta: metric.delta,
        navigationType: metric.navigationType,
      })
    })

    // Track First Contentful Paint (FCP)
    onFCP((metric: Metric) => {
      reportWebVital({
        id: metric.id,
        name: metric.name,
        value: metric.value,
        rating: getRating(metric.name, metric.value),
        delta: metric.delta,
        navigationType: metric.navigationType,
      })
    })

    // Track Time to First Byte (TTFB)
    onTTFB((metric: Metric) => {
      reportWebVital({
        id: metric.id,
        name: metric.name,
        value: metric.value,
        rating: getRating(metric.name, metric.value),
        delta: metric.delta,
        navigationType: metric.navigationType,
      })
    })
  }, [])

  return null
}

/**
 * Get rating for a metric based on thresholds
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  // Thresholds based on Web Vitals guidelines
  const thresholds: Record<string, { good: number; poor: number }> = {
    LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
    INP: { good: 200, poor: 500 }, // Interaction to Next Paint (replaces FID)
    CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
    FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
    TTFB: { good: 800, poor: 1800 }, // Time to First Byte
  }

  const threshold = thresholds[name]
  if (!threshold) return 'good'

  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

