import { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { compressImage, formatFileSize } from '@/lib/imageCompression'
import { logger } from '@/lib/logger'

interface UseImageUploadOptions {
  onSuccess?: (url: string) => void
  onError?: (error: Error) => void
  maxSizeMB?: number
  showCompressionInfo?: boolean
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const {
    onSuccess,
    onError,
    maxSizeMB = 0.2, // 200KB default
    showCompressionInfo = true,
  } = options

  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const deleteOldImage = async (imageUrl: string) => {
    if (!imageUrl || !imageUrl.startsWith('/uploads/')) return

    try {
      const filename = imageUrl.split('/uploads/')[1]
      await axios.delete(`/api/upload?filename=${filename}`)
      logger.info('Old image deleted:', filename)
    } catch (error) {
      logger.error('Error deleting old image:', error)
      // Don't throw error, just log it
    }
  }

  const uploadImage = async (
    file: File,
    oldImageUrl?: string
  ): Promise<string> => {
    setUploading(true)
    setProgress(0)

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Hanya file gambar yang diizinkan')
      }

      const originalSize = file.size
      setProgress(10)

      // Compress image
      logger.info('Compressing image...', {
        originalSize: formatFileSize(originalSize),
        targetSize: formatFileSize(maxSizeMB * 1024 * 1024),
      })

      const compressedFile = await compressImage(file, {
        maxSizeMB,
        maxWidthOrHeight: 1920,
        quality: 0.8,
      })

      const compressedSize = compressedFile.size
      const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1)

      logger.info('Image compressed:', {
        originalSize: formatFileSize(originalSize),
        compressedSize: formatFileSize(compressedSize),
        compressionRatio: `${compressionRatio}%`,
      })

      setProgress(50)

      // Show compression info
      if (showCompressionInfo && originalSize > compressedSize) {
        await Swal.fire({
          title: 'Gambar Dikompres',
          html: `
            <div class="text-left space-y-2">
              <p><strong>Ukuran Asli:</strong> ${formatFileSize(originalSize)}</p>
              <p><strong>Ukuran Setelah Kompresi:</strong> ${formatFileSize(compressedSize)}</p>
              <p><strong>Pengurangan:</strong> ${compressionRatio}%</p>
            </div>
          `,
          icon: 'info',
          timer: 2000,
          showConfirmButton: false,
          buttonsStyling: false,
          customClass: {
            popup: '!rounded-2xl',
            title: '!font-bold',
          },
        })
      }

      // Upload compressed image
      const formData = new FormData()
      formData.append('file', compressedFile)

      setProgress(70)

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const newImageUrl = response.data.url

      setProgress(90)

      // Delete old image if exists
      if (oldImageUrl) {
        await deleteOldImage(oldImageUrl)
      }

      setProgress(100)

      if (onSuccess) {
        onSuccess(newImageUrl)
      }

      return newImageUrl
    } catch (error: any) {
      logger.error('Error uploading image:', error)
      
      const errorMessage = error.response?.data?.error || error.message || 'Gagal mengupload gambar'
      
      await Swal.fire({
        title: 'Gagal Upload',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
        buttonsStyling: false,
        customClass: {
          popup: '!rounded-2xl',
          title: '!font-bold',
          confirmButton: 'swal2-confirm',
        },
      })

      if (onError) {
        onError(error)
      }

      throw error
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return {
    uploadImage,
    deleteOldImage,
    uploading,
    progress,
  }
}
