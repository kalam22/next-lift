import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join, basename } from 'path'
import { existsSync } from 'fs'
import { logger } from '@/lib/logger'
import { isValidImageType, isValidFileSize, sanitizeFileName, validateFileContent } from '@/lib/sanitize'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validasi tipe file
    const isPDF = file.type === 'application/pdf'
    const isImage = isValidImageType(file.type)
    
    if (!isPDF && !isImage) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed.' },
        { status: 400 }
      )
    }

    // Validasi ukuran file (max 5MB untuk gambar, max 1MB untuk PDF)
    const maxSizeMB = isPDF ? 1 : 5
    if (!isValidFileSize(file.size, maxSizeMB)) {
      return NextResponse.json(
        { error: `File size too large. Maximum size is ${maxSizeMB}MB.` },
        { status: 400 }
      )
    }

    // Validasi file content untuk gambar (check magic numbers)
    if (isImage) {
      try {
        const isValidContent = await validateFileContent(file)
        if (!isValidContent) {
          return NextResponse.json(
            { error: 'File content does not match declared type. Possible file corruption or malicious file.' },
            { status: 400 }
          )
        }
      } catch (error) {
        logger.error('Error validating file content:', error)
        return NextResponse.json(
          { error: 'Failed to validate file content.' },
          { status: 400 }
        )
      }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = sanitizeFileName(file.name)
    const filename = `${timestamp}_${sanitizedName}`

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Save file
    const filepath = join(uploadsDir, filename)
    await writeFile(filepath, buffer)

    // Return URL path
    const url = `/uploads/${filename}`

    return NextResponse.json({ url, filename })
  } catch (error) {
    logger.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Support both query parameter and body JSON
    const { searchParams } = new URL(request.url)
    let filename = searchParams.get('filename')
    
    // If no query param, try to get from body
    if (!filename) {
      try {
        const body = await request.json()
        const url = body.url
        if (url) {
          // Extract filename from URL (e.g., "/uploads/123_file.pdf" -> "123_file.pdf")
          filename = basename(url)
        }
      } catch {
        // Body parsing failed, continue with null filename
      }
    }

    if (!filename) {
      return NextResponse.json({ error: 'Filename or URL is required' }, { status: 400 })
    }

    // Use basename to strip any path components — prevents directory traversal
    const sanitizedFilename = basename(filename).replace(/\.\./g, '')
    if (!sanitizedFilename || sanitizedFilename === '') {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }
    const filepath = join(process.cwd(), 'public', 'uploads', sanitizedFilename)

    if (existsSync(filepath)) {
      await unlink(filepath)
      logger.info(`File deleted: ${sanitizedFilename}`)
      return NextResponse.json({ message: 'File deleted successfully' })
    } else {
      logger.warn(`File not found for deletion: ${sanitizedFilename}`)
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    logger.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}

