import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const lifts = await prisma.lifts.findMany({
      orderBy: { created_at: 'desc' },
    })

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Data Lift')

    // Define columns with headers and widths
    worksheet.columns = [
      { header: 'NO', key: 'no', width: 8 },
      { header: 'NAMA PENGGUNA', key: 'nama', width: 35 },
      { header: 'PERUSAHAAN (PT)', key: 'pt', width: 30 },
      { header: 'DEPARTEMEN', key: 'departemen', width: 30 },
      { header: 'MASA BERLAKU', key: 'berlaku', width: 25 },
      { header: 'HAK AKSES LANTAI', key: 'akses', width: 40 },
    ]

    // Add data rows
    lifts.forEach((lift, index) => {
      let aksesArray: number[] = []
      try {
        aksesArray = lift.akses ? JSON.parse(lift.akses) : []
      } catch (e) {
        aksesArray = []
      }

      worksheet.addRow({
        no: index + 1,
        nama: lift.nama?.toUpperCase(),
        pt: lift.pt,
        departemen: lift.departemen || '-',
        berlaku: lift.berlaku ? format(new Date(lift.berlaku), 'dd MMMM yyyy') : '-',
        akses: aksesArray.sort((a, b) => a - b).map((f) => f.toString()).join(', ') || '-',
      })
    })

    // Global Styling: Times New Roman and Center alignment
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.font = {
          name: 'Times New Roman',
          size: 11
        }
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true
        }

        // Header specific styling
        if (rowNumber === 1) {
          cell.font = {
            name: 'Times New Roman',
            bold: true,
            size: 12,
            color: { argb: 'FFFFFFFF' } // White text
          }
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2563EB' } // Blue color (primary-600)
          }
        } else {
          // Borer for data cells
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        }
      })

      // Auto row height
      row.height = 25
    })

    // Set first row height a bit larger
    worksheet.getRow(1).height = 30

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Generate filename dengan tanggal
    const filename = `Data_User_Lift_${format(new Date(), 'yyyyMMdd')}.xlsx`

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    logger.error('Error exporting lifts:', error)
    
    // Check if it's a database connection error
    if (error instanceof Error && (error.name === 'PrismaClientInitializationError' || error.message.includes('Can\'t reach database server'))) {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          message: 'Cannot connect to database server. Please ensure PostgreSQL is running at localhost:5432',
          details: error.message
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to export lifts', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

