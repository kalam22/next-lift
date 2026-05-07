import { z } from 'zod'
import { validationErrorResponse } from './api-response'

export function handleValidationError(error: z.ZodError) {
  const errors = error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }))
  return validationErrorResponse(errors)
}

export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; response: Response }> {
  try {
    const validatedData = await schema.parseAsync(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, response: handleValidationError(error) }
    }
    throw error
  }
}

