import { NextRequest, NextResponse } from 'next/server'
import { reportWebVital, reportAPIMetric, getPerformanceSummary } from '@/lib/analytics'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, metric } = body

    if (type === 'web-vital') {
      reportWebVital(metric)
      return NextResponse.json({ success: true })
    }

    if (type === 'api-metric') {
      reportAPIMetric(metric)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid metric type' },
      { status: 400 }
    )
  } catch (error) {
    logger.error('Error reporting analytics:', error)
    return NextResponse.json(
      { error: 'Failed to report analytics' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const summary = getPerformanceSummary()
    return NextResponse.json(summary)
  } catch (error) {
    logger.error('Error getting analytics:', error)
    return NextResponse.json(
      { error: 'Failed to get analytics' },
      { status: 500 }
    )
  }
}

