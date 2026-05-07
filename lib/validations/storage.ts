import { z } from 'zod'
import { baseEntitySchema } from './base-schema'

export const storageSchema = z.object({
  ...baseEntitySchema,
  storage: z.string().min(1, 'Storage wajib diisi'),
  jumlahOrderan: z.number().int().positive('Jumlah orderan harus positif'),
})

export type StorageInput = z.infer<typeof storageSchema>

