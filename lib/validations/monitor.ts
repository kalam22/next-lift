import { z } from 'zod'
import { baseEntitySchema } from './base-schema'

export const monitorSchema = z.object({
  ...baseEntitySchema,
  jumlahOrderan: z.number().int().positive('Jumlah orderan harus positif'),
})

export type MonitorInput = z.infer<typeof monitorSchema>

