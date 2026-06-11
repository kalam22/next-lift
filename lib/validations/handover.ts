import { z } from 'zod'

export const handoverSchema = z.object({
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  barang: z.string().min(1, 'Barang wajib diisi'),
  pic: z.string().min(1, 'PIC wajib diisi').max(191),
  site: z.string().min(1, 'Site wajib diisi').max(191),
  namaPenerima: z.string().min(1, 'Nama Penerima wajib diisi').max(191),
  ttd: z.string().optional().nullable(),
})

export type HandoverInput = z.infer<typeof handoverSchema>
