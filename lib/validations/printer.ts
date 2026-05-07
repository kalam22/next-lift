import { z } from 'zod'
import { baseEntitySchema } from './base-schema'

export const printerSchema = z.object({
  ...baseEntitySchema,
  jumlah: z.number().int().nonnegative('Jumlah harus non-negatif').optional(),
  kerusakan: z.string().optional().nullable(),
})

export type PrinterInput = z.infer<typeof printerSchema>

