import { z } from 'zod'

export const liftSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi').max(200),
  pt: z.string().min(1, 'PT wajib diisi').max(200),
  departemen: z.string().max(200).optional().nullable(),
  berlaku: z.string().optional().nullable(),
  akses: z.array(z.number().int().min(1).max(100)).optional().nullable(),
})

export type LiftInput = z.infer<typeof liftSchema>
