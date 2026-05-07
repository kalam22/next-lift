import { NextResponse } from 'next/server'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function successResponse<T>(
  data: T,
  status = 200,
  pagination?: ApiResponse<T>['pagination']
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(pagination && { pagination }),
    },
    { status }
  )
}

export function errorResponse(
  error: string,
  status = 500,
  message?: string
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      error,
      message,
    },
    { status }
  )
}

export function validationErrorResponse(
  errors: Array<{ field: string; message: string }>
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      message: 'Invalid input data',
      data: errors as any,
    },
    { status: 400 }
  )
}

