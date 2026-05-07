import { z } from 'zod'
import { baseEntitySchema } from './base-schema'

export const toolsJaringanSchema = z.object({
  ...baseEntitySchema,
  jumlahOrderan: z.number().int().nonnegative('Jumlah orderan harus non-negatif'),
  // Override foto untuk tools-jaringan yang menggunakan .url()
  foto: z.string().url().optional().nullable().or(z.literal('')),
})

export type ToolsJaringanInput = z.infer<typeof toolsJaringanSchema>

