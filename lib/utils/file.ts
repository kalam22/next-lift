import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { logger } from '@/lib/logger'

/**
 * Delete image file from uploads directory
 * @param imageUrl - The image URL (e.g., /uploads/filename.jpg)
 */
export async function deleteImageFile(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) {
    return
  }

  try {
    const filename = imageUrl.split('/uploads/')[1]
    const filepath = join(process.cwd(), 'public', 'uploads', filename)
    
    if (existsSync(filepath)) {
      await unlink(filepath)
      logger.info('Deleted image file:', filename)
    }
  } catch (error) {
    logger.error('Error deleting image file:', error)
    // Don't throw error, just log it
  }
}

/**
 * Delete PDF file from uploads directory
 * @param pdfUrl - The PDF URL (e.g., /uploads/filename.pdf)
 */
export async function deletePdfFile(pdfUrl: string | null | undefined): Promise<void> {
  if (!pdfUrl || !pdfUrl.startsWith('/uploads/')) {
    return
  }

  try {
    const filename = pdfUrl.split('/uploads/')[1]
    const filepath = join(process.cwd(), 'public', 'uploads', filename)
    
    if (existsSync(filepath)) {
      await unlink(filepath)
      logger.info('Deleted PDF file:', filename)
    }
  } catch (error) {
    logger.error('Error deleting PDF file:', error)
    // Don't throw error, just log it
  }
}

/**
 * Delete any file from uploads directory (generic)
 * @param fileUrl - The file URL (e.g., /uploads/filename.ext)
 */
export async function deleteUploadedFile(fileUrl: string | null | undefined): Promise<void> {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
    return
  }

  try {
    const filename = fileUrl.split('/uploads/')[1]
    const filepath = join(process.cwd(), 'public', 'uploads', filename)
    
    if (existsSync(filepath)) {
      await unlink(filepath)
      logger.info('Deleted file:', filename)
    }
  } catch (error) {
    logger.error('Error deleting file:', error)
    // Don't throw error, just log it
  }
}
