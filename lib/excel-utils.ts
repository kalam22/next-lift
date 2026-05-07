import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Swal from 'sweetalert2'
import { logger } from './logger'

// Dynamic import untuk ExcelJS - mengurangi bundle size
let ExcelJS: typeof import('exceljs') | null = null

async function getExcelJS() {
  if (!ExcelJS) {
    ExcelJS = await import('exceljs')
  }
  return ExcelJS
}

export interface ExcelColumn {
  header: string
  key: string
  width: number
}

export interface ExcelImportConfig {
  headerMap: Record<string, string>
  validator: (data: any) => boolean
  requiredFields: string[]
  dataTransformer?: (data: any) => any
  mergedCellFields?: string[] // Fields yang perlu handle merged cells (e.g., ['brand', 'dayaVa'])
}

export interface ExcelExportConfig<T> {
  columns: ExcelColumn[]
  data: T[]
  filename: string
  worksheetName: string
  imageField?: {
    fieldName: string
    columnIndex: number
  }
  dateFields?: string[]
}

/**
 * Parse Excel file and return array of data
 */
export async function parseExcelFile(
  file: File,
  config: ExcelImportConfig
): Promise<{ validData: any[]; invalidData: any[] }> {
  const Excel = await getExcelJS()
  const workbook = new Excel.Workbook()
  const arrayBuffer = await file.arrayBuffer()
  await workbook.xlsx.load(arrayBuffer)
  
  const worksheet = workbook.getWorksheet(1)
  if (!worksheet) {
    throw new Error('File Excel tidak valid atau kosong')
  }

  // Find header row
  let headerRowIndex = 1
  const secondRow = worksheet.getRow(2)
  if (secondRow && secondRow.getCell(1).value) {
    const row2FirstCell = secondRow.getCell(1).value?.toString().toUpperCase().trim()
    const headerKeywords = ['NO', 'MERK', 'BRAND', 'JUMLAH ORDERAN', 'DIPERUNTUKKAN']
    if (headerKeywords.some(keyword => row2FirstCell === keyword)) {
      headerRowIndex = 2
    }
  }

  const headerRow = worksheet.getRow(headerRowIndex)
  const headerMapReverse: { [key: number]: string } = {}
  
  // Map column indices to field names
  headerRow.eachCell((cell, colNumber) => {
    const headerValue = cell.value?.toString().trim().toUpperCase()
    if (headerValue && config.headerMap[headerValue] !== undefined) {
      if (config.headerMap[headerValue]) {
        headerMapReverse[colNumber] = config.headerMap[headerValue]
      }
    }
  })

  // Parse data rows
  const dataStartRow = headerRowIndex + 1
  const parsedData: any[] = []
  
  // Variables untuk store merged cell values
  const mergedCellValues: Record<string, string> = {}
  if (config.mergedCellFields) {
    config.mergedCellFields.forEach(field => {
      mergedCellValues[field] = ''
    })
  }
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < dataStartRow) return
    
    const rowData: any = {}
    let hasData = false

    row.eachCell((cell, colNumber) => {
      const fieldName = headerMapReverse[colNumber]
      if (fieldName) {
        let cellValue: string | number | Date | null = null
        
        // Check if cell has value
        if (cell.value !== null && cell.value !== undefined) {
          const rawValue = cell.value
          if (typeof rawValue === 'object' && 'text' in rawValue) {
            cellValue = String(rawValue.text).trim()
          } else if (rawValue instanceof Date) {
            const year = rawValue.getFullYear()
            const month = String(rawValue.getMonth() + 1).padStart(2, '0')
            const day = String(rawValue.getDate()).padStart(2, '0')
            cellValue = `${year}-${month}-${day}`
          } else {
            cellValue = String(rawValue).trim()
          }
          
          // Handle merged cells - jika field ada di mergedCellFields
          if (config.mergedCellFields && config.mergedCellFields.includes(fieldName)) {
            if (cellValue && cellValue !== '-' && cellValue !== '') {
              mergedCellValues[fieldName] = String(cellValue)
              rowData[fieldName] = cellValue
              hasData = true
            } else if (mergedCellValues[fieldName]) {
              // Use last value for merged cells
              rowData[fieldName] = mergedCellValues[fieldName]
              hasData = true
            }
          } else if (cellValue && cellValue !== '-' && cellValue !== '') {
            // Handle jumlah orderan - extract number from "1 PCS", "1 ROLL", etc.
            if (fieldName === 'jumlahOrderan' || fieldName === 'jumlah') {
              const cleanValue = cellValue.replace(/\s+/g, '').toLowerCase()
              const match = cleanValue.match(/\d+/)
              if (match) {
                rowData[fieldName] = parseInt(match[0])
              } else {
                rowData[fieldName] = 0
              }
              hasData = true
            }
            // Handle nomor PO - convert to string, handle "0" as valid
            else if (fieldName === 'nomorPO' || fieldName === 'nomor_po') {
              rowData[fieldName] = String(cellValue).trim()
              hasData = true
            }
            // Handle nomor surat jalan - optional
            else if (fieldName === 'nomorSuratJalan' || fieldName === 'nomor_surat_jalan') {
              rowData[fieldName] = String(cellValue).trim() || null
              hasData = true
            }
            // Handle tanggal format DD/MM/YY or DD/MM/YYYY
            else if (fieldName === 'tanggalMasuk' || fieldName === 'tanggalKirim' || 
                     fieldName === 'tanggal_masuk' || fieldName === 'tanggal_kirim') {
              const dateMatch = cellValue.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
              if (dateMatch) {
                let day = parseInt(dateMatch[1])
                let month = parseInt(dateMatch[2])
                let year = parseInt(dateMatch[3])
                if (year < 100) {
                  year = year < 50 ? 2000 + year : 1900 + year
                }
                if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
                  const date = new Date(year, month - 1, day)
                  if (!isNaN(date.getTime()) && date.getDate() === day && date.getMonth() === month - 1) {
                    rowData[fieldName] = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    hasData = true
                  }
                }
              } else {
                const parsedDate = new Date(cellValue)
                if (!isNaN(parsedDate.getTime())) {
                  const year = parsedDate.getFullYear()
                  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
                  const day = String(parsedDate.getDate()).padStart(2, '0')
                  rowData[fieldName] = `${year}-${month}-${day}`
                  hasData = true
                }
              }
            }
            else {
              rowData[fieldName] = cellValue
              hasData = true
            }
          }
        } else if (fieldName === 'nomorSuratJalan' || fieldName === 'nomor_surat_jalan') {
          // Handle nomor surat jalan when cell value is null/undefined - set to null
          rowData[fieldName] = null
          hasData = true
        }
      }
    })

    if (hasData && (rowData.brand || rowData.merk || rowData.diperuntukan || rowData.site)) {
      parsedData.push(rowData)
    }
  })

  // Validate and separate valid/invalid data
  const validData: any[] = []
  const invalidData: any[] = []

  parsedData.forEach((item) => {
    if (config.validator(item)) {
      const transformed = config.dataTransformer ? config.dataTransformer(item) : item
      validData.push(transformed)
    } else {
      invalidData.push(item)
    }
  })

  return { validData, invalidData }
}

/**
 * Export data to Excel file
 */
export async function exportToExcel<T extends Record<string, any>>(
  config: ExcelExportConfig<T>
): Promise<void> {
  const Excel = await getExcelJS()
  const { columns, data, filename, worksheetName, imageField, dateFields = [] } = config

  if (data.length === 0) {
    await Swal.fire({
      title: 'Tidak Ada Data',
      text: `Tidak ada data untuk diekspor`,
      icon: 'warning',
      confirmButtonText: 'OK',
      buttonsStyling: false,
      customClass: {
        popup: '!rounded-2xl',
        title: '!font-bold',
        confirmButton: 'swal2-confirm',
      },
    })
    return
  }

  const workbook = new Excel.Workbook()
  const worksheet = workbook.addWorksheet(worksheetName)

  worksheet.columns = columns

  // Style header row
  const headerRow = worksheet.getRow(1)
  headerRow.font = { name: 'Times New Roman', size: 12, bold: true }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }
  headerRow.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  }
  headerRow.height = 20

  const imageColIndex = imageField ? imageField.columnIndex : null

  // Add data rows
  data.forEach((item, index) => {
    const rowData: any = { no: index + 1 }
    
    columns.forEach(col => {
      if (col.key === 'no') return
      
      let value = item[col.key] || ''
      
      // Format date fields
      if (dateFields.includes(col.key) && value) {
        value = format(new Date(value), 'dd/MM/yyyy', { locale: id })
      }
      
      rowData[col.key] = value
    })

    const row = worksheet.addRow(rowData)

    // Style data row
    row.eachCell((cell) => {
      cell.font = { name: 'Times New Roman', size: 12 }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
    row.height = 18
  })

  // Add images if imageField is specified
  if (imageField && imageColIndex) {
    for (let index = 0; index < data.length; index++) {
      const item = data[index]
      const rowNumber = index + 2
      const row = worksheet.getRow(rowNumber)
      const imageUrl = item[imageField.fieldName]

      if (imageUrl) {
        try {
          const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${window.location.origin}${imageUrl}`
          const imageResponse = await fetch(fullImageUrl)
          if (!imageResponse.ok) throw new Error('Failed to load image')
          
          const imageBlob = await imageResponse.blob()
          
          // Get image dimensions
          const getImageDimensions = (blob: Blob): Promise<{ width: number; height: number }> => {
            return new Promise((resolve, reject) => {
              const img = document.createElement('img')
              const url = URL.createObjectURL(blob)
              img.onload = () => {
                URL.revokeObjectURL(url)
                resolve({ width: img.naturalWidth, height: img.naturalHeight })
              }
              img.onerror = () => {
                URL.revokeObjectURL(url)
                reject(new Error('Failed to load image'))
              }
              img.src = url
            })
          }

          const imageDimensions = await getImageDimensions(imageBlob)
          
          // Convert to base64
          const reader = new FileReader()
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const base64String = reader.result as string
              const base64Data = base64String.split(',')[1]
              resolve(base64Data)
            }
            reader.onerror = reject
          })
          reader.readAsDataURL(imageBlob)
          const base64Data = await base64Promise

          // Determine extension
          let extension: 'png' | 'jpeg' | 'gif' = 'png'
          const contentType = imageResponse.headers.get('content-type')
          if (contentType?.includes('jpeg') || contentType?.includes('jpg')) {
            extension = 'jpeg'
          } else if (contentType?.includes('png')) {
            extension = 'png'
          } else if (contentType?.includes('gif')) {
            extension = 'gif'
          }

          const imageId = workbook.addImage({ base64: base64Data, extension })

          // Scale image
          const maxSize = 150
          let displayWidth = imageDimensions.width
          let displayHeight = imageDimensions.height
          
          if (displayWidth > maxSize || displayHeight > maxSize) {
            const aspectRatio = displayWidth / displayHeight
            if (displayWidth > displayHeight) {
              displayWidth = maxSize
              displayHeight = maxSize / aspectRatio
            } else {
              displayHeight = maxSize
              displayWidth = maxSize * aspectRatio
            }
          }

          const imageHeightPoints = displayHeight / 1.33 + 10
          row.height = imageHeightPoints

          const imageCell = row.getCell(imageColIndex)
          imageCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false }

          worksheet.addImage(imageId, {
            tl: { col: imageColIndex - 1, row: rowNumber - 1 },
            ext: { width: displayWidth, height: displayHeight },
          })
        } catch (imgError) {
          console.error(`Error loading image for item ${item.id}:`, imgError)
          row.height = 18
        }
      }
    }
  }

  // Generate and download file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)

  await Swal.fire({
    title: 'Berhasil!',
    text: `Berhasil mengekspor ${data.length} data`,
    icon: 'success',
    timer: 2000,
    showConfirmButton: false,
    buttonsStyling: false,
    customClass: {
      popup: '!rounded-2xl',
      title: '!font-bold',
    },
  })
}

