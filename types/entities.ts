/**
 * Comprehensive type definitions untuk semua entities
 * Based on Prisma schema
 */

// Base types
export type StatusBarang = 'BARU' | 'SECOND' | 'SERVICE'
export type StatusPC = string // PC dan Laptop menggunakan status string

// Mouse
export interface Mouse {
  id: number
  brand: string
  jumlahOrderan: number
  diperuntukan: string
  site: string
  departemen?: string | null
  nomorPO: string
  nomorSuratJalan?: string | null
  statusBarang: StatusBarang
  tanggalMasuk: Date | string
  tanggalKirim?: Date | string | null
  keterangan?: string | null
  foto?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

// Monitor
export interface Monitor {
  id: number
  brand: string
  jumlahOrderan: number
  diperuntukan: string
  site: string
  departemen?: string | null
  nomorPO: string
  nomorSuratJalan?: string | null
  statusBarang: StatusBarang
  tanggalMasuk: Date | string
  tanggalKirim?: Date | string | null
  keterangan?: string | null
  foto?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

// UPS
export interface Ups {
  id: number
  brand: string
  dayaVa?: string | null
  jumlahOrderan: number
  diperuntukan: string
  site: string
  departemen?: string | null
  nomorPO: string
  nomorSuratJalan?: string | null
  statusBarang: StatusBarang
  tanggalMasuk: Date | string
  tanggalKirim?: Date | string | null
  keterangan?: string | null
  foto?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

// Stock Move
export interface StockTransaction {
  id: number
  partType: 'MASUK' | 'KELUAR'
  tanggal: Date | string
  namaBarang: string
  typeBarang: string
  quality: number
  vendorTujuan?: string | null
  keterangan?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface StockItemType {
  id: number
  nama: string
  createdAt: Date | string
}

export interface StockVendor {
  id: number
  nama: string
  createdAt: Date | string
}

export interface StockListResponse {
  transactions: StockTransaction[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Printer
export interface Printer {
  id: number
  brand: string
  jumlah: number
  diperuntukan: string
  site: string
  departemen?: string | null
  nomorPO: string
  nomorSuratJalan?: string | null
  statusBarang: StatusBarang
  tanggalMasuk: Date | string
  tanggalKirim?: Date | string | null
  kerusakan?: string | null
  keterangan?: string | null
  foto?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

// Tools Jaringan
export interface ToolsJaringan {
  id: number
  brand: string
  jumlahOrderan: number
  diperuntukan: string
  site: string
  departemen?: string | null
  nomorPO: string
  nomorSuratJalan?: string | null
  statusBarang: StatusBarang
  tanggalMasuk: Date | string
  tanggalKirim?: Date | string | null
  keterangan?: string | null
  foto?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

// CCTV
export interface Cctv {
  id: number
  brand: string
  storage?: string | null
  jumlahOrderan: number
  diperuntukan: string
  site: string
  departemen?: string | null
  nomorPO: string
  nomorSuratJalan?: string | null
  statusBarang: StatusBarang
  tanggalMasuk: Date | string
  tanggalKirim?: Date | string | null
  keterangan?: string | null
  foto?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

// Storage
export interface Storage {
  id: number
  brand: string
  storage: string
  jumlahOrderan: number
  diperuntukan: string
  site: string
  departemen?: string | null
  nomorPO: string
  nomorSuratJalan?: string | null
  statusBarang: StatusBarang
  tanggalMasuk: Date | string
  tanggalKirim?: Date | string | null
  keterangan?: string | null
  foto?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

// Laptop
export interface Laptop {
  id: number
  merk: string
  prosesor: string
  sn?: string | null
  ssdHdd: string
  ram: string
  monitor?: string | null
  printer?: string | null
  keyboard?: string | null
  masuk: Date | string
  kirim?: Date | string | null
  unit?: string | null
  untuk: string
  site: string
  departemen?: string | null
  po: number
  status: StatusPC
  kerusakan?: string | null
  suratJalan?: string | null
  catatan?: string | null
  gambar?: string | null
  serahTerimaPdf?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

// PC
export interface PC {
  id: number
  merk: string
  prosesor: string
  ssdHdd: string
  ram: string
  monitor?: string | null
  printer?: string | null
  keyboard?: string | null
  ups?: string | null
  masuk: Date | string
  kirim?: Date | string | null
  unit?: string | null
  untuk: string
  site: string
  departemen?: string | null
  po: number
  status: StatusPC
  kerusakan?: string | null
  suratJalan?: string | null
  catatan?: string | null
  gambar?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

// Lift (already defined in types/lift.ts, but included here for completeness)
export interface Lift {
  id: number
  nama: string
  pt: string
  departemen?: string | null
  berlaku?: Date | string | null
  akses?: string | null
  aksesArray?: number[]
  createdAt: Date | string
  updatedAt: Date | string
}

// API Response Types
export interface ApiResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface SingleApiResponse<T> {
  data: T
}

// Form Data Types
export interface MouseFormData {
  brand: string
  jumlahOrderan: number
  diperuntukan: string
  site: string
  departemen?: string
  nomorPO: string
  nomorSuratJalan?: string
  statusBarang: StatusBarang
  tanggalMasuk: string
  tanggalKirim?: string
  keterangan?: string
  foto?: string
}

export interface MonitorFormData {
  brand: string
  jumlahOrderan: number
  diperuntukan: string
  site: string
  departemen?: string
  nomorPO: string
  nomorSuratJalan?: string
  statusBarang: StatusBarang
  tanggalMasuk: string
  tanggalKirim?: string
  keterangan?: string
  foto?: string
}

export interface UpsFormData {
  brand: string
  dayaVa?: string
  jumlahOrderan: number
  diperuntukan: string
  site: string
  departemen?: string
  nomorPO: string
  nomorSuratJalan?: string
  statusBarang: StatusBarang
  tanggalMasuk: string
  tanggalKirim?: string
  keterangan?: string
  foto?: string
}

export interface PrinterFormData {
  brand: string
  jumlah: number
  diperuntukan: string
  site: string
  departemen?: string
  nomorPO: string
  nomorSuratJalan?: string
  statusBarang: StatusBarang
  tanggalMasuk: string
  tanggalKirim?: string
  kerusakan?: string
  keterangan?: string
  foto?: string
}

export interface ToolsJaringanFormData {
  brand: string
  jumlahOrderan: number
  diperuntukan: string
  site: string
  departemen?: string
  nomorPO: string
  nomorSuratJalan?: string
  statusBarang: StatusBarang
  tanggalMasuk: string
  tanggalKirim?: string
  keterangan?: string
  foto?: string
}

export interface CctvFormData {
  brand: string
  storage?: string
  jumlahOrderan: number
  diperuntukan: string
  site: string
  departemen?: string
  nomorPO: string
  nomorSuratJalan?: string
  statusBarang: StatusBarang
  tanggalMasuk: string
  tanggalKirim?: string
  keterangan?: string
  foto?: string
}

export interface StorageFormData {
  brand: string
  storage: string
  jumlahOrderan: number | string
  diperuntukan: string
  site: string
  departemen?: string
  nomorPO: string
  nomorSuratJalan?: string
  statusBarang: StatusBarang
  tanggalMasuk: string
  tanggalKirim?: string
  keterangan?: string
  foto?: string
}

export interface LaptopFormData {
  merk: string
  prosesor: string
  sn?: string
  ssdHdd: string
  ram: string
  monitor?: string
  printer?: string
  keyboard?: string
  masuk: string
  kirim?: string
  unit?: string
  untuk: string
  site: string
  departemen?: string
  po: number
  status: StatusPC
  kerusakan?: string
  suratJalan?: string
  catatan?: string
  gambar?: string
  serahTerimaPdf?: string
}

export interface PCFormData {
  merk: string
  prosesor: string
  ssdHdd: string
  ram: string
  monitor?: string
  printer?: string
  keyboard?: string
  ups?: string
  masuk: string
  kirim?: string
  unit?: string
  untuk: string
  site: string
  departemen?: string
  po: number
  status: StatusPC
  kerusakan?: string
  suratJalan?: string
  catatan?: string
  gambar?: string
}


// Laptop History
export interface LaptopHistory {
  id: number
  laptopId: number
  pic: string
  tanggalTerima: Date | string
  site: string
  departemen?: string | null
  keterangan?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

// PC History
export interface PcHistory {
  id: number
  pcId: number
  pic: string
  tanggalTerima: Date | string
  site: string
  departemen?: string | null
  keterangan?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}
