/**
 * Shared Excel import header maps
 * Mengurangi duplikasi kode untuk Excel import configuration
 */

// Base header map untuk PC dan Laptop (shared fields)
const BASE_PC_LAPTOP_HEADER_MAP = {
  'NO': '',
  'JENIS PERANGKAT': 'merk',
  'MERK': 'merk',
  'PROCESOR': 'prosesor',
  'PROCESOR & VGA': 'prosesor',
  'PROSESOR & VGA': 'prosesor',
  'PROSESOR': 'prosesor',
  'SSD/HDD': 'ssdHdd',
  'SSD': 'ssdHdd',
  'HDD': 'ssdHdd',
  'STORAGE': 'ssdHdd',
  'RAM': 'ram',
  'MONITOR': 'monitor',
  'PRINTER': 'printer',
  'KEYBOARD+MOUSE': 'keyboard',
  'KEYBOARD': 'keyboard',
  'TANGGAL MASUK': 'masuk',
  'TANGGAL MASUK BARANG': 'masuk',
  'TANGGAL KIRIM': 'kirim',
  'TANGGAL KIRIM BARANG': 'kirim',
  'JUMLAH UNIT': 'unit',
  'UNIT': 'unit',
  'DIPERUNTUKKAN': 'untuk',
  'DIPERUNTUKKAN KEPADA': 'untuk',
  'SITE': 'site',
  'NOMOR PO': 'po',
  'NO.PO': 'po',
  'NO PO': 'po',
  'PO': 'po',
  'STATUS UNIT': 'status',
  'STATUS': 'status',
  'KERUSAKAN': 'kerusakan',
  'NOMOR SURAT JALAN': 'suratJalan',
  'NO.SURAT JALAN': 'suratJalan',
  'NO SURAT JALAN': 'suratJalan',
  'SURAT JALAN': 'suratJalan',
  'CATATAN': 'catatan',
} as const

// Header map untuk PC (includes MOUSE and UPS)
export const PC_HEADER_MAP = {
  ...BASE_PC_LAPTOP_HEADER_MAP,
  'MOUSE': 'keyboard',
  'UPS': 'ups',
} as const

// Header map untuk Laptop (tanpa MOUSE dan UPS)
export const LAPTOP_HEADER_MAP = {
  ...BASE_PC_LAPTOP_HEADER_MAP,
} as const

// Validator untuk PC/Laptop
export const PC_LAPTOP_VALIDATOR = (data: any) => {
  return data.merk && 
         data.prosesor && 
         data.ssdHdd && 
         data.ram && 
         data.masuk && 
         data.untuk && 
         data.site && 
         data.po && 
         data.status
}

export const PC_LAPTOP_REQUIRED_FIELDS: string[] = ['merk', 'prosesor', 'ssdHdd', 'ram', 'masuk', 'untuk', 'site', 'po', 'status']

