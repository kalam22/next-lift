/**
 * Type definitions untuk Lift data
 */

export interface Lift {
  id: number
  nama: string
  pt: string
  departemen: string | null
  berlaku: Date | string | null
  akses: string | number[] | null
  created_at: Date | string
  updated_at: Date | string
  // Computed fields
  aksesArray?: number[]
  formattedLantai?: string
  sisaHari?: string
}

export interface LiftFormData {
  nama: string
  pt: string
  departemen: string
  berlaku: string
  akses: number[]
}

export interface LiftsApiResponse {
  data: Lift[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface LiftApiResponse {
  data: Lift
}

