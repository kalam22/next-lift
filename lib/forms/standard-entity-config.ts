import type { FieldDef } from '@/components/StandardEntityForm'
import { SITE_OPTIONS, STATUS_BARANG_OPTIONS, DEPARTEMEN_OPTIONS } from '@/lib/constants'

export interface EntityFormConfig {
  /** API route prefix, e.g. '/api/ups' */
  apiPath: string
  /** Route for redirect after success, e.g. '/ups' */
  listPath: string
  /** Entity label (bahasa Indonesia), e.g. 'UPS' */
  label: string
  /** Fields definition */
  fields: FieldDef[]
  /** Image field key (default: 'foto') */
  imageKey?: string
  /** Additional submit data transforms */
  transformSubmit?: (data: Record<string, string | number>) => Record<string, unknown>
}

const STANDARD_FIELDS_BASE: FieldDef[] = [
  { key: 'site', label: 'Site', type: 'select', required: true, placeholder: 'Pilih Site...', options: SITE_OPTIONS },
  { key: 'departemen', label: 'Departemen', type: 'select', placeholder: 'Pilih Departemen...', options: DEPARTEMEN_OPTIONS },
  { key: 'nomorPO', label: 'Nomor PO', type: 'text', required: true, placeholder: 'Nomor PO...' },
  { key: 'nomorSuratJalan', label: 'Nomor Surat Jalan', type: 'text', placeholder: 'Nomor Surat Jalan...' },
  { key: 'statusBarang', label: 'Status Barang', type: 'select', required: true, placeholder: 'Pilih Status...', options: STATUS_BARANG_OPTIONS },
  { key: 'tanggalMasuk', label: 'Tanggal Masuk', type: 'date', required: true },
  { key: 'tanggalKirim', label: 'Tanggal Kirim', type: 'date' },
  { key: 'keterangan', label: 'Keterangan', type: 'textarea', placeholder: 'Keterangan...', span: 2 },
]

export const STANDARD_ENTITY_CONFIGS: Record<string, EntityFormConfig> = {
  ups: {
    apiPath: '/api/ups',
    listPath: '/ups',
    label: 'UPS',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'Brand...' },
      { key: 'dayaVa', label: 'Daya (VA)', type: 'text', placeholder: 'Daya (VA)...' },
      { key: 'jumlahOrderan', label: 'Jumlah Orderan', type: 'number', required: true, min: 1, placeholder: 'Jumlah Orderan...' },
      { key: 'diperuntukan', label: 'PIC', type: 'text', required: true, placeholder: 'PIC...' },
      ...STANDARD_FIELDS_BASE,
    ],
    transformSubmit: (d) => ({
      brand: String(d.brand || '').trim(),
      dayaVa: String(d.dayaVa || '').trim() || null,
      jumlahOrderan: parseInt(String(d.jumlahOrderan || '0')),
      diperuntukan: String(d.diperuntukan || '').trim(),
      site: d.site,
      departemen: d.departemen || null,
      nomorPO: String(d.nomorPO || '').trim(),
      nomorSuratJalan: String(d.nomorSuratJalan || '').trim() || null,
      statusBarang: d.statusBarang,
      tanggalMasuk: d.tanggalMasuk,
      tanggalKirim: d.tanggalKirim || null,
      keterangan: String(d.keterangan || '').trim() || null,
      foto: d.foto || null,
    }),
  },
  cctv: {
    apiPath: '/api/cctv',
    listPath: '/cctv',
    label: 'CCTV',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'Brand...' },
      { key: 'storage', label: 'Storage', type: 'text', placeholder: 'Storage...' },
      { key: 'jumlahOrderan', label: 'Jumlah Orderan', type: 'number', required: true, min: 1, placeholder: 'Jumlah Orderan...' },
      { key: 'diperuntukan', label: 'PIC', type: 'text', required: true, placeholder: 'PIC...' },
      ...STANDARD_FIELDS_BASE,
    ],
    transformSubmit: (d) => ({
      brand: String(d.brand || '').trim(),
      storage: String(d.storage || '').trim() || null,
      jumlahOrderan: parseInt(String(d.jumlahOrderan || '0')),
      diperuntukan: String(d.diperuntukan || '').trim(),
      site: d.site,
      departemen: d.departemen || null,
      nomorPO: String(d.nomorPO || '').trim(),
      nomorSuratJalan: String(d.nomorSuratJalan || '').trim() || null,
      statusBarang: d.statusBarang,
      tanggalMasuk: d.tanggalMasuk,
      tanggalKirim: d.tanggalKirim || null,
      keterangan: String(d.keterangan || '').trim() || null,
      foto: d.foto || null,
    }),
  },
  mouse: {
    apiPath: '/api/mouse',
    listPath: '/mouse',
    label: 'Mouse',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'Brand...' },
      { key: 'jumlahOrderan', label: 'Jumlah Orderan', type: 'number', required: true, min: 1, placeholder: 'Jumlah Orderan...' },
      { key: 'diperuntukan', label: 'PIC', type: 'text', required: true, placeholder: 'PIC...' },
      ...STANDARD_FIELDS_BASE,
    ],
    transformSubmit: (d) => ({
      brand: String(d.brand || '').trim(),
      jumlahOrderan: parseInt(String(d.jumlahOrderan || '0')),
      diperuntukan: String(d.diperuntukan || '').trim(),
      site: d.site,
      departemen: d.departemen || null,
      nomorPO: String(d.nomorPO || '').trim(),
      nomorSuratJalan: String(d.nomorSuratJalan || '').trim() || null,
      statusBarang: d.statusBarang,
      tanggalMasuk: d.tanggalMasuk,
      tanggalKirim: d.tanggalKirim || null,
      keterangan: String(d.keterangan || '').trim() || null,
      foto: d.foto || null,
    }),
  },
  monitor: {
    apiPath: '/api/monitor',
    listPath: '/monitor',
    label: 'Monitor',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'Brand...' },
      { key: 'ukuran', label: 'Ukuran', type: 'text', placeholder: 'Ukuran...' },
      { key: 'jumlahOrderan', label: 'Jumlah Orderan', type: 'number', required: true, min: 1, placeholder: 'Jumlah Orderan...' },
      { key: 'diperuntukan', label: 'PIC', type: 'text', required: true, placeholder: 'PIC...' },
      ...STANDARD_FIELDS_BASE,
    ],
    transformSubmit: (d) => ({
      brand: String(d.brand || '').trim(),
      ukuran: String(d.ukuran || '').trim() || null,
      jumlahOrderan: parseInt(String(d.jumlahOrderan || '0')),
      diperuntukan: String(d.diperuntukan || '').trim(),
      site: d.site,
      departemen: d.departemen || null,
      nomorPO: String(d.nomorPO || '').trim(),
      nomorSuratJalan: String(d.nomorSuratJalan || '').trim() || null,
      statusBarang: d.statusBarang,
      tanggalMasuk: d.tanggalMasuk,
      tanggalKirim: d.tanggalKirim || null,
      keterangan: String(d.keterangan || '').trim() || null,
      foto: d.foto || null,
    }),
  },
  printer: {
    apiPath: '/api/printer',
    listPath: '/printer',
    label: 'Printer',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'Brand...' },
      { key: 'jumlah', label: 'Jumlah', type: 'number', required: true, min: 1, placeholder: 'Jumlah...' },
      { key: 'diperuntukan', label: 'PIC', type: 'text', required: true, placeholder: 'PIC...' },
      ...STANDARD_FIELDS_BASE,
    ],
    transformSubmit: (d) => ({
      brand: String(d.brand || '').trim(),
      jumlah: parseInt(String(d.jumlah || '0')),
      diperuntukan: String(d.diperuntukan || '').trim(),
      site: d.site,
      departemen: d.departemen || null,
      nomorPO: String(d.nomorPO || '').trim(),
      nomorSuratJalan: String(d.nomorSuratJalan || '').trim() || null,
      statusBarang: d.statusBarang,
      tanggalMasuk: d.tanggalMasuk,
      tanggalKirim: d.tanggalKirim || null,
      keterangan: String(d.keterangan || '').trim() || null,
      foto: d.foto || null,
    }),
  },
  storage: {
    apiPath: '/api/storage',
    listPath: '/storage',
    label: 'Storage',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'Brand...' },
      { key: 'kapasitas', label: 'Kapasitas', type: 'text', placeholder: 'Kapasitas...' },
      { key: 'jumlahOrderan', label: 'Jumlah Orderan', type: 'number', required: true, min: 1, placeholder: 'Jumlah Orderan...' },
      { key: 'diperuntukan', label: 'PIC', type: 'text', required: true, placeholder: 'PIC...' },
      ...STANDARD_FIELDS_BASE,
    ],
    transformSubmit: (d) => ({
      brand: String(d.brand || '').trim(),
      kapasitas: String(d.kapasitas || '').trim() || null,
      jumlahOrderan: parseInt(String(d.jumlahOrderan || '0')),
      diperuntukan: String(d.diperuntukan || '').trim(),
      site: d.site,
      departemen: d.departemen || null,
      nomorPO: String(d.nomorPO || '').trim(),
      nomorSuratJalan: String(d.nomorSuratJalan || '').trim() || null,
      statusBarang: d.statusBarang,
      tanggalMasuk: d.tanggalMasuk,
      tanggalKirim: d.tanggalKirim || null,
      keterangan: String(d.keterangan || '').trim() || null,
      foto: d.foto || null,
    }),
  },
  tools_jaringan: {
    apiPath: '/api/tools-jaringan',
    listPath: '/tools-jaringan',
    label: 'Tools Jaringan',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'Brand...' },
      { key: 'jumlahOrderan', label: 'Jumlah Orderan', type: 'number', required: true, min: 1, placeholder: 'Jumlah Orderan...' },
      { key: 'diperuntukan', label: 'PIC', type: 'text', required: true, placeholder: 'PIC...' },
      ...STANDARD_FIELDS_BASE,
    ],
    transformSubmit: (d) => ({
      brand: String(d.brand || '').trim(),
      jumlahOrderan: parseInt(String(d.jumlahOrderan || '0')),
      diperuntukan: String(d.diperuntukan || '').trim(),
      site: d.site,
      departemen: d.departemen || null,
      nomorPO: String(d.nomorPO || '').trim(),
      nomorSuratJalan: String(d.nomorSuratJalan || '').trim() || null,
      statusBarang: d.statusBarang,
      tanggalMasuk: d.tanggalMasuk,
      tanggalKirim: d.tanggalKirim || null,
      keterangan: String(d.keterangan || '').trim() || null,
      foto: d.foto || null,
    }),
  },
}
