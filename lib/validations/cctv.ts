import { z } from 'zod'
import { baseEntitySchema } from './base-schema'

export const cctvSchema = z.object({
  ...baseEntitySchema,
  storage: z.string().optional().nullable(),
  jumlahOrderan: z.number().int().positive('Jumlah orderan harus positif'),
})

export type CctvInput = z.infer<typeof cctvSchema>

