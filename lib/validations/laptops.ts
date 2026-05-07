import { z } from 'zod'

export const laptopSchema = z.object({
  merk: z.string().min(1, 'Merk wajib diisi').max(200),
  prosesor: z.string().min(1, 'Prosesor wajib diisi').max(200),
  sn: z.string().max(200).optional().nullable(),
  ssdHdd: z.string().min(1, 'Storage wajib diisi').max(200),
  ram: z.string().min(1, 'RAM wajib diisi').max(100),
  monitor: z.string().max(200).optional().nullable(),
  printer: z.string().max(200).optional().nullable(),
  keyboard: z.string().max(200).optional().nullable(),
  masuk: z.string().min(1, 'Tanggal masuk wajib diisi'),
  kirim: z.string().optional().nullable(),
  unit: z.string().max(50).optional().nullable(),
  untuk: z.string().min(1, 'Untuk wajib diisi').max(200),
  site: z.string().min(1, 'Site wajib diisi').max(200),
  departemen: z.string().max(191).optional().nullable(),
  po: z.union([z.string(), z.number()]).transform((val) => {
    const n = parseInt(String(val))
    return n
  }).refine((n) => !isNaN(n) && n >= 0, { message: 'PO harus berupa angka valid' }),
  status: z.string().min(1, 'Status wajib diisi').max(100),
  kerusakan: z.string().max(500).optional().nullable(),
  suratJalan: z.string().max(200).optional().nullable(),
  catatan: z.string().max(1000).optional().nullable(),
  gambar: z.string().max(500).optional().nullable(),
  serahTerimaPdf: z.string().max(500).optional().nullable(),
})

export type LaptopInput = z.infer<typeof laptopSchema>
