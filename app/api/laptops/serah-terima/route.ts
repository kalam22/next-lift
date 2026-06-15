import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'
import { handleDbError } from '@/lib/security/security'
import fs from 'fs'
import path from 'path'

function formatTanggal(date: Date): string {
  const bulan = ['Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember']
  const d = date.getDate().toString().padStart(2, '0')
  const m = bulan[date.getMonth()]
  const y = date.getFullYear()
  return `${d} - ${m} - ${y}`
}

function formatNomorSurat(nomor: string, date: Date): string {
  const dd = date.getDate().toString().padStart(2, '0')
  const mm = (date.getMonth() + 1).toString().padStart(2, '0')
  const yy = date.getFullYear().toString().slice(-2)
  return `${nomor}-${dd}/${mm}/${yy}.IT`
}

function extractNama(untuk: string | null): string {
  if (!untuk) return '-'
  return untuk.replace(/\s*\([^)]*\)/g, '').trim()
}

function extractBrandDepan(brand: string | null): string {
  if (!brand) return '-'
  return brand.trim().split(/\s+/)[0]
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    if (url.startsWith('/')) {
      const localPath = path.join(process.cwd(), 'public', url)
      if (fs.existsSync(localPath)) return fs.readFileSync(localPath)
      return null
    }
    const res = await fetch(url)
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

function detectImageExt(buf: Buffer): string {
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg'
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'png'
  return 'jpg'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nomorSurat } = body

    if (!id) return NextResponse.json({ error: 'ID laptop wajib diisi' }, { status: 400 })

    const laptop = await prisma.laptops.findUnique({ where: { id: parseInt(String(id)) } })
    if (!laptop) return NextResponse.json({ error: 'Laptop tidak ditemukan' }, { status: 404 })

    const templatePath = path.join(process.cwd(), 'public', 'templates', 'serah-terima.docx')
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template tidak ditemukan' }, { status: 500 })
    }

    // Lazy require — harus di server side
    const Docxtemplater = require('docxtemplater')
    const PizZip = require('pizzip')
    const ImageModule = require('docxtemplater-image-module-free')

    const now = new Date()
    const penerima = laptop.untuk || '-'
    const penerimaNama = extractNama(laptop.untuk)
    const brandDepan = extractBrandDepan(laptop.merk)

    // Ambil foto
    let imgBuf: Buffer | null = null
    if (laptop.gambar) {
      imgBuf = await fetchImageBuffer(laptop.gambar)
      if (!imgBuf || imgBuf.length === 0) imgBuf = null
    }

    const templateBin = fs.readFileSync(templatePath, 'binary')
    const zip = new PizZip(templateBin)

    let doc: any

    if (imgBuf) {
      // Ada foto — pakai image module dengan API yang benar
      const capturedBuf = imgBuf // capture untuk closure
      const imageModule = new ImageModule({
        centered: false,
        getImage: (_tagValue: string, _tagName: string): Buffer => {
          return capturedBuf
        },
        getSize: (_imgBuffer: Buffer, _tagValue: string, _tagName: string): [number, number] => {
          return [150, 150]
        },
      })

      doc = new Docxtemplater(zip, {
        modules: [imageModule],
        paragraphLoop: true,
        linebreaks: true,
      })

      doc.render({
        nomor_surat: formatNomorSurat(nomorSurat || '-', now),
        tanggal_serah: formatTanggal(now),
        site: laptop.site || '-',
        penerima,
        penerima_nama: penerimaNama,
        brand: laptop.merk || '-',
        brand_depan: brandDepan,
        sn: laptop.sn || '-',
        status: laptop.status || '-',
        prosesor: laptop.prosesor || '-',
        ram: laptop.ram || '-',
        storage: laptop.ssd_hdd || '-',
        foto: 'foto', // nilai apapun asal truthy — getImage akan return capturedBuf
      })
    } else {
      // Tidak ada foto — hapus baris {%foto} dari XML sebelum render
      let xmlContent: string = zip.file('word/document.xml').asText()
      // Hapus paragraf yang mengandung {%foto}
      xmlContent = xmlContent.replace(/<w:p\b[^>]*>(?:(?!<\/w:p>)[\s\S])*\{%foto\}(?:(?!<\/w:p>)[\s\S])*<\/w:p>/g, '')
      zip.file('word/document.xml', xmlContent)

      doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      })

      doc.render({
        nomor_surat: formatNomorSurat(nomorSurat || '-', now),
        tanggal_serah: formatTanggal(now),
        site: laptop.site || '-',
        penerima,
        penerima_nama: penerimaNama,
        brand: laptop.merk || '-',
        brand_depan: brandDepan,
        sn: laptop.sn || '-',
        status: laptop.status || '-',
        prosesor: laptop.prosesor || '-',
        ram: laptop.ram || '-',
        storage: laptop.ssd_hdd || '-',
      })
    }

    const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })

    const safeName = penerimaNama.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_')
    const filename = `Serah_Terima_${safeName}_${now.toISOString().slice(0, 10)}.docx`

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    logger.error('Error generating serah terima:', error)
    return handleDbError(error, 'membuat dokumen serah terima')
  }
}
