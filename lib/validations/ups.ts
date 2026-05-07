import { z } from 'zod'
import { baseEntitySchema } from './base-schema'

export const upsSchema = z.object({
  ...baseEntitySchema,
  dayaVa: z.string().min(1, 'Daya VA wajib diisi'),
  jumlahOrderan: z.number().int().nonnegative('Jumlah orderan harus non-negatif').optional(),
})

export type UpsInput = z.infer<typeof upsSchema>

