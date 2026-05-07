'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import ExcelJS from 'exceljs'
import { logger } from '@/lib/logger'
import type { StockTransaction } from '@/types/entities'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockSummaryItem { typeBarang: string; total: number }
interface PaginationMeta { page: number; limit: number; total: number; totalPages: number }
interface ApiResponse { transactions: StockTransaction[]; stockSummary: StockSummaryItem[]; pagination: PaginationMeta }
interface FormState {
  partType: 'MASUK' | 'KELUAR'
  tanggal: string
  typeBarang: string
  namaBarang: string
  quality: number | ''
  vendorTujuan: string
  keterangan: string
}

const EMPTY_FORM: FormState = {
  partType: 'MASUK',
  tanggal: new Date().toISOString().split('T')[0],
  typeBarang: '',
  namaBarang: '',
  quality: '',
  vendorTujuan: '',
  keterangan: '',
}

// ─── DynamicSelect ────────────────────────────────────────────────────────────

function DynamicSelect({ value, onChange, apiEndpoint, placeholder = 'Pilih...', disabled = false }: {
  value: string; onChange: (v: string) => void; apiEndpoint: string; placeholder?: string; disabled?: boolean
}) {
  const [items, setItems] = useState<{ id: number; nama: string }[]>([])
  const [open, setOpen] = useState(false)
  const [showManage, setShowManage] = useState(false)
  const [addingNew, setAddingNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchItems = useCallback(async () => {
    try { const r = await axios.get<{ id: number; nama: string }[]>(apiEndpoint); setItems(Array.isArray(r.data) ? r.data : []) } catch {}
  }, [apiEndpoint])

  useEffect(() => { fetchItems() }, [fetchItems])
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setShowManage(false); setAddingNew(false); setNewName('') } }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleAdd = async () => {
    const t = newName.trim(); if (!t) return; setSaving(true)
    try { await axios.post(apiEndpoint, { nama: t }); await fetchItems(); onChange(t); setAddingNew(false); setNewName(''); setOpen(false) } catch {} finally { setSaving(false) }
  }

  const handleDelete = async (id: number, nama: string) => {
    const r = await Swal.fire({ title: 'Apakah Anda yakin?', text: `"${nama}" akan dihapus dan tidak dapat dikembalikan!`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal', reverseButtons: true, buttonsStyling: false, customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm', cancelButton: 'swal2-cancel' } })
    if (!r.isConfirmed) return
    try { await axios.delete(`${apiEndpoint}/${id}`); await fetchItems(); if (value === nama) onChange('') } catch {}
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} onClick={() => { setOpen(o => !o); setShowManage(false) }}
        className="input-premium w-full text-left flex items-center justify-between gap-2 disabled:opacity-50">
        <span className={value ? 'text-slate-900 dark:text-slate-50' : 'text-gray-400 dark:text-gray-500'}>{value || placeholder}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[180px] bg-white dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#1e293b] rounded-2xl shadow-xl shadow-black/10 overflow-hidden">
          {showManage ? (
            <div className="p-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Kelola Item</span>
                <button type="button" onClick={() => setShowManage(false)} className="text-xs text-primary font-bold hover:underline">← Kembali</button>
              </div>
              {items.length === 0 && <p className="text-xs text-gray-400 text-center py-2">Belum ada item</p>}
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 group">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.nama}</span>
                  <button type="button" onClick={() => handleDelete(item.id, item.nama)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {items.map(item => (
                <button key={item.id} type="button" onClick={() => { onChange(item.nama); setOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-primary/5 transition-colors ${value === item.nama ? 'text-primary bg-primary/5' : 'text-slate-800 dark:text-slate-200'}`}>
                  {item.nama}
                </button>
              ))}
              {addingNew ? (
                <div className="px-3 py-2 border-t border-[#f1f5f9] dark:border-[#1e293b] flex gap-2">
                  <input autoFocus type="text" value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } if (e.key === 'Escape') { setAddingNew(false); setNewName('') } }}
                    placeholder="Nama baru..." className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-white/5 border border-[#e2e8f0] dark:border-[#334155] rounded-xl outline-none focus:border-primary/50 text-slate-900 dark:text-slate-50" />
                  <button type="button" onClick={handleAdd} disabled={saving || !newName.trim()} className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-black disabled:opacity-50">{saving ? '...' : 'OK'}</button>
                  <button type="button" onClick={() => { setAddingNew(false); setNewName('') }} className="px-3 py-1.5 bg-gray-100 dark:bg-white/10 text-gray-500 rounded-xl text-xs font-black">✕</button>
                </div>
              ) : (
                <div className="border-t border-[#f1f5f9] dark:border-[#1e293b]">
                  <button type="button" onClick={() => setAddingNew(true)} className="w-full text-left px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/5 transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    Tambah baru...
                  </button>
                  <button type="button" onClick={() => setShowManage(true)} className="w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Kelola
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Nama Barang Autocomplete ─────────────────────────────────────────────────

function NamaBarangInput({ value, onChange, typeBarang }: { value: string; onChange: (v: string) => void; typeBarang: string }) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setShowSuggestions(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleChange = (v: string) => {
    onChange(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!v.trim() || !typeBarang) { setSuggestions([]); setShowSuggestions(false); return }
    timerRef.current = setTimeout(async () => {
      try {
        const r = await axios.get<string[]>(`/api/stock-move/nama-suggestions?q=${encodeURIComponent(v)}&typeBarang=${encodeURIComponent(typeBarang)}`)
        setSuggestions(r.data || [])
        setShowSuggestions((r.data || []).length > 0)
      } catch { setSuggestions([]); setShowSuggestions(false) }
    }, 300)
  }

  return (
    <div ref={ref} className="relative">
      <input type="text" value={value} onChange={e => handleChange(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
        placeholder="Nama barang..." className="input-premium w-full" />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#1e293b] rounded-2xl shadow-xl shadow-black/10 overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
          {suggestions.map(s => (
            <button key={s} type="button" onClick={() => { onChange(s); setShowSuggestions(false) }}
              className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-primary/5 transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Add Transaction Form ─────────────────────────────────────────────────────

function AddTransactionForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const set = (field: keyof FormState, val: string | number) => setForm(prev => ({ ...prev, [field]: val }))

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!form.tanggal) e.tanggal = 'Tanggal wajib diisi'
    if (!form.typeBarang.trim()) e.typeBarang = 'Type barang wajib diisi'
    if (!form.namaBarang.trim()) e.namaBarang = 'Nama barang wajib diisi'
    if (!form.quality || Number(form.quality) < 1) e.quality = 'Quality minimal 1'
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!validate()) return; setSubmitting(true)
    try {
      await axios.post('/api/stock-move', { partType: form.partType, tanggal: form.tanggal, namaBarang: form.namaBarang.trim(), typeBarang: form.typeBarang.trim(), quality: Number(form.quality), vendorTujuan: form.vendorTujuan.trim() || null, keterangan: form.keterangan.trim() || null })
      setForm(EMPTY_FORM); setErrors({}); onSuccess()
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined
      Swal.fire({ title: 'Gagal!', text: msg || 'Gagal menyimpan transaksi.', icon: 'error', confirmButtonText: 'OK', buttonsStyling: false, customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' } })
    } finally { setSubmitting(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Row 1: Part Type + Tanggal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Part Type</label>
          <select value={form.partType} onChange={e => set('partType', e.target.value as 'MASUK' | 'KELUAR')} className="input-premium w-full appearance-none cursor-pointer">
            <option value="MASUK">MASUK</option>
            <option value="KELUAR">KELUAR</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tanggal</label>
          <input type="date" value={form.tanggal} onChange={e => set('tanggal', e.target.value)} className={`input-premium w-full ${errors.tanggal ? 'border-red-400/50' : ''}`} />
          {errors.tanggal && <p className="text-[10px] text-red-500 font-bold">{errors.tanggal}</p>}
        </div>
      </div>

      {/* Row 2: Type Barang + Nama Barang (Type first!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Type Barang</label>
          <DynamicSelect value={form.typeBarang} onChange={val => set('typeBarang', val)} apiEndpoint="/api/stock-move/item-types" placeholder="Pilih type barang..." />
          {errors.typeBarang && <p className="text-[10px] text-red-500 font-bold">{errors.typeBarang}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nama Barang</label>
          <NamaBarangInput value={form.namaBarang} onChange={v => set('namaBarang', v)} typeBarang={form.typeBarang} />
          {errors.namaBarang && <p className="text-[10px] text-red-500 font-bold">{errors.namaBarang}</p>}
        </div>
      </div>

      {/* Row 3: Quality + Vendor/Tujuan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Quality</label>
          <input type="number" min={1} value={form.quality} onChange={e => set('quality', e.target.value === '' ? '' : Number(e.target.value))} placeholder="Jumlah..." className={`input-premium w-full ${errors.quality ? 'border-red-400/50' : ''}`} />
          {errors.quality && <p className="text-[10px] text-red-500 font-bold">{errors.quality}</p>}
        </div>
        <div className="space-y-1.5">
          {form.partType === 'MASUK' ? (
            <><label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vendor</label>
            <DynamicSelect value={form.vendorTujuan} onChange={val => set('vendorTujuan', val)} apiEndpoint="/api/stock-move/vendors" placeholder="Pilih vendor..." /></>
          ) : (
            <><label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tujuan</label>
            <input type="text" value={form.vendorTujuan} onChange={e => set('vendorTujuan', e.target.value)} placeholder="Tujuan pengiriman..." className="input-premium w-full" /></>
          )}
        </div>
      </div>

      {/* Row 4: Keterangan */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Keterangan <span className="text-gray-300">(opsional)</span></label>
        <input type="text" value={form.keterangan} onChange={e => set('keterangan', e.target.value)} placeholder="Keterangan tambahan..." className="input-premium w-full" />
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={submitting} className="btn-premium flex items-center gap-2 px-6 py-3 text-[11px] disabled:opacity-60">
          {submitting ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan...</>) : (<><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Simpan</>)}
        </button>
      </div>
    </form>
  )
}

// ─── Edit Row (Quality is READ-ONLY) ─────────────────────────────────────────

function EditRow({ transaction, onSave, onCancel }: { transaction: StockTransaction; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<FormState>({
    partType: transaction.partType,
    tanggal: typeof transaction.tanggal === 'string' ? transaction.tanggal.split('T')[0] : new Date(transaction.tanggal).toISOString().split('T')[0],
    typeBarang: transaction.typeBarang,
    namaBarang: transaction.namaBarang,
    quality: transaction.quality,
    vendorTujuan: transaction.vendorTujuan || '',
    keterangan: transaction.keterangan || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (field: keyof FormState, val: string | number) => setForm(prev => ({ ...prev, [field]: val }))

  const handleSave = async () => {
    if (!form.namaBarang.trim() || !form.typeBarang.trim()) return
    setSaving(true)
    try {
      await axios.put(`/api/stock-move/${transaction.id}`, { partType: form.partType, tanggal: form.tanggal, namaBarang: form.namaBarang.trim(), typeBarang: form.typeBarang.trim(), quality: Number(form.quality), vendorTujuan: form.vendorTujuan.trim() || null, keterangan: form.keterangan.trim() || null })
      onSave()
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined
      Swal.fire({ title: 'Gagal!', text: msg || 'Gagal memperbarui transaksi.', icon: 'error', confirmButtonText: 'OK', buttonsStyling: false, customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' } })
    } finally { setSaving(false) }
  }

  const ic = 'w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-white/5 border border-[#e2e8f0] dark:border-[#334155] rounded-xl outline-none focus:border-primary/50 text-slate-900 dark:text-slate-50 font-semibold'

  return (
    <tr className="bg-amber-50/30 dark:bg-amber-500/5 border-l-2 border-amber-400">
      <td className="px-4 py-3 text-xs font-black text-gray-400">#{transaction.id}</td>
      <td className="px-3 py-3"><select value={form.partType} onChange={e => set('partType', e.target.value as 'MASUK' | 'KELUAR')} className={ic}><option value="MASUK">MASUK</option><option value="KELUAR">KELUAR</option></select></td>
      <td className="px-3 py-3"><input type="date" value={form.tanggal} onChange={e => set('tanggal', e.target.value)} className={ic} /></td>
      <td className="px-3 py-3 min-w-[160px]"><DynamicSelect value={form.typeBarang} onChange={val => set('typeBarang', val)} apiEndpoint="/api/stock-move/item-types" placeholder="Type..." /></td>
      <td className="px-3 py-3"><input type="text" value={form.namaBarang} onChange={e => set('namaBarang', e.target.value)} className={ic} /></td>
      {/* Quality: READ-ONLY */}
      <td className="px-3 py-3"><span className="text-sm font-black text-gray-500 dark:text-gray-400 px-2">{transaction.quality}</span></td>
      <td className="px-3 py-3 min-w-[160px]">
        {form.partType === 'MASUK'
          ? <DynamicSelect value={form.vendorTujuan} onChange={val => set('vendorTujuan', val)} apiEndpoint="/api/stock-move/vendors" placeholder="Vendor..." />
          : <input type="text" value={form.vendorTujuan} onChange={e => set('vendorTujuan', e.target.value)} placeholder="Tujuan..." className={ic} />}
      </td>
      <td className="px-3 py-3"><input type="text" value={form.keterangan} onChange={e => set('keterangan', e.target.value)} placeholder="Keterangan..." className={ic} /></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleSave} disabled={saving} title="Simpan" className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all hover:scale-110 disabled:opacity-50">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
          </button>
          <button type="button" onClick={onCancel} title="Batal" className="p-2 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 rounded-xl transition-all hover:scale-110">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Export Modal ─────────────────────────────────────────────────────────────

const ALL_COLUMNS = [
  { key: 'partType', label: 'Part Type' },
  { key: 'tanggal', label: 'Tanggal' },
  { key: 'typeBarang', label: 'Type Barang' },
  { key: 'namaBarang', label: 'Nama Barang' },
  { key: 'quality', label: 'Quality' },
  { key: 'vendorTujuan', label: 'Vendor/Tujuan' },
  { key: 'keterangan', label: 'Keterangan' },
] as const

type ColKey = typeof ALL_COLUMNS[number]['key']

function ExportModal({ onClose, search, typeFilter }: { onClose: () => void; search: string; typeFilter: string }) {
  const [selectedCols, setSelectedCols] = useState<Set<ColKey>>(new Set(ALL_COLUMNS.map(c => c.key)))
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [exporting, setExporting] = useState(false)

  const toggleCol = (k: ColKey) => setSelectedCols(prev => { const s = new Set(prev); s.has(k) ? s.delete(k) : s.add(k); return s })

  const handleExport = async () => {
    setExporting(true)
    try {
      // Fetch all data with current filters
      const params = new URLSearchParams({ page: '1', limit: '9999' })
      if (search) params.set('search', search)
      if (typeFilter) params.set('typeBarang', typeFilter)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      const res = await axios.get<ApiResponse>(`/api/stock-move?${params}`)
      const rows = res.data.transactions

      // Filter by date range client-side if needed
      const filtered = rows.filter(tx => {
        const d = new Date(tx.tanggal)
        if (dateFrom && d < new Date(dateFrom)) return false
        if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false
        return true
      })

      // Build Excel
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Stock Move')

      const cols = ALL_COLUMNS.filter(c => selectedCols.has(c.key))
      ws.columns = cols.map(c => ({ header: c.label, key: c.key, width: 20 }))

      // Header style
      ws.getRow(1).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      })

      filtered.forEach(tx => {
        const row: Record<string, string | number> = {}
        if (selectedCols.has('partType')) row.partType = tx.partType
        if (selectedCols.has('tanggal')) row.tanggal = new Date(tx.tanggal).toLocaleDateString('id-ID')
        if (selectedCols.has('typeBarang')) row.typeBarang = tx.typeBarang
        if (selectedCols.has('namaBarang')) row.namaBarang = tx.namaBarang
        if (selectedCols.has('quality')) row.quality = tx.quality
        if (selectedCols.has('vendorTujuan')) row.vendorTujuan = tx.vendorTujuan || ''
        if (selectedCols.has('keterangan')) row.keterangan = tx.keterangan || ''
        ws.addRow(row)
      })

      // Alternate row colors
      ws.eachRow((row, i) => {
        if (i > 1) row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF' } } })
      })

      const buf = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `stock-move-${new Date().toISOString().split('T')[0]}.xlsx`; a.click()
      URL.revokeObjectURL(url)
      onClose()
    } catch (err) { logger.error('Export error:', err) } finally { setExporting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-[#f1f5f9] dark:border-[#1e293b] shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-200">Export Excel</h3>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Column selection */}
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pilih Kolom</p>
          <div className="grid grid-cols-2 gap-2">
            {ALL_COLUMNS.map(col => (
              <label key={col.key} className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={selectedCols.has(col.key)} onChange={() => toggleCol(col.key)}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer" />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors">{col.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Filter Tanggal <span className="text-gray-300">(opsional)</span></p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold">Dari</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-premium w-full text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold">Sampai</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-premium w-full text-xs" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-2xl border border-[#f1f5f9] dark:border-[#1e293b] text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Batal</button>
          <button onClick={handleExport} disabled={exporting || selectedCols.size === 0}
            className="flex-1 btn-premium py-2.5 text-xs disabled:opacity-50 flex items-center justify-center gap-2">
            {exporting ? (<><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Mengekspor...</>) : (<><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Export Excel</>)}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Stock Summary Cards (clickable filter) ───────────────────────────────────

function StockSummaryCards({ summary, activeFilter, onFilter }: { summary: StockSummaryItem[]; activeFilter: string; onFilter: (t: string) => void }) {
  if (summary.length === 0) return null
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 bg-primary rounded-full" />
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Ringkasan Stok per Type Barang</h2>
        {activeFilter && (
          <button onClick={() => onFilter('')} className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            Hapus filter: {activeFilter}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {summary.map(item => {
          const isActive = activeFilter === item.typeBarang
          const isLow = item.total === 1
          const isZero = item.total === 0
          const isNeg = item.total < 0
          const isGreen = item.total > 1

          const colorCls = isGreen
            ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20'
            : isLow
            ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
            : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
          const totalCls = isGreen
            ? 'text-green-600 dark:text-green-400'
            : isLow
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-red-600 dark:text-red-400'
          const dotCls = isGreen ? 'bg-green-500' : isLow ? 'bg-amber-500' : 'bg-red-500'
          return (
            <button key={item.typeBarang} type="button" onClick={() => onFilter(isActive ? '' : item.typeBarang)}
              className={`relative p-4 rounded-2xl border text-left transition-all hover:scale-[1.03] active:scale-[0.98] ${colorCls} ${isActive ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-[#0a0a0a]' : ''}`}>
              {isActive && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />}
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest leading-tight line-clamp-2">{item.typeBarang}</span>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${dotCls} ${!isGreen ? 'animate-pulse' : ''}`} />
              </div>
              <div className={`text-2xl font-black ${totalCls}`}>{item.total.toLocaleString('id-ID')}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-0.5">unit</div>
              {isLow && (
                <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  ⚠ Stok hampir habis
                </div>
              )}
              {(isZero || isNeg) && (
                <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">
                  ⛔ Stok habis
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StockMovePage() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [stockSummary, setStockSummary] = useState<StockSummaryItem[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [limit, setLimit] = useState(10)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchData = useCallback(async (page = 1, s = search, tf = typeFilter, lim = limit) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page), limit: String(lim) })
      if (s) params.set('search', s)
      if (tf) params.set('typeBarang', tf)
      const res = await axios.get<ApiResponse>(`/api/stock-move?${params}`)
      setTransactions(res.data.transactions)
      setStockSummary(res.data.stockSummary)
      setPagination(res.data.pagination)
      setError(null)
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined
      setError(msg || 'Gagal memuat data')
    } finally { setLoading(false) }
  }, [search, typeFilter, limit])

  useEffect(() => { fetchData(1) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (v: string) => {
    setSearch(v)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchData(1, v, typeFilter), 400)
  }

  const handleTypeFilter = (t: string) => {
    setTypeFilter(t)
    fetchData(1, search, t)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    fetchData(1, search, typeFilter, newLimit)
  }

  const handleDelete = async (id: number) => {
    const r = await Swal.fire({ title: 'Hapus transaksi?', text: 'Data yang dihapus tidak dapat dikembalikan!', icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal', reverseButtons: true, buttonsStyling: false, customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm', cancelButton: 'swal2-cancel' } })
    if (!r.isConfirmed) return
    try { await axios.delete(`/api/stock-move/${id}`); fetchData(pagination.page) } catch { Swal.fire({ title: 'Gagal!', text: 'Gagal menghapus transaksi.', icon: 'error', confirmButtonText: 'OK', buttonsStyling: false, customClass: { popup: '!rounded-2xl', title: '!font-bold', confirmButton: 'swal2-confirm' } }) }
  }

  const fmt = (d: Date | string) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen mesh-gradient dark:mesh-gradient-dark p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black text-[#020617] dark:text-white tracking-tighter uppercase">Stock <span className="text-primary">Move</span></h1>
          <p className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-[0.2em] opacity-60">Inventory / Pergerakan Stok</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button onClick={() => setShowExport(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#1e293b] rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/5 whitespace-nowrap">
            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export
          </button>
          <button onClick={() => setShowForm(f => !f)} className="btn-premium flex items-center gap-2 px-5 py-3 text-[11px]">
            <svg className={`w-4 h-4 transition-transform ${showForm ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            <span className="uppercase tracking-widest">{showForm ? 'Tutup Form' : 'Tambah Transaksi'}</span>
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="premium-card p-6 sm:p-8 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 mb-6"><div className="w-1 h-6 bg-primary rounded-full" /><h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Tambah Transaksi Baru</h2></div>
          <AddTransactionForm onSuccess={() => { setShowForm(false); fetchData(1) }} />
        </div>
      )}

      {/* Transaction Table */}
      <div className="premium-card overflow-hidden">
        {/* Table header */}
        <div className="p-4 sm:p-6 border-b border-[#f1f5f9]/50 dark:border-[#1e293b]/50 bg-white/50 dark:bg-black/20 backdrop-blur-3xl space-y-3">
          {/* Single row: Title + Search + Export + Count */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Riwayat Transaksi</h2>
            </div>
            {/* Search — max width, grows but capped */}
            <div className="relative lg:flex-1 lg:max-w-sm group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input type="text" value={search} onChange={e => handleSearchChange(e.target.value)}
                placeholder="Cari part type, nama barang, type barang, vendor/tujuan..."
                className="input-premium pl-10 pr-8 w-full" />
              {search && (
                <button onClick={() => handleSearchChange('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 lg:ml-auto">
              {!loading && <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">{pagination.total} data</span>}
            </div>
          </div>
          {/* Active filter badge */}
          {typeFilter && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Filter aktif:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                {typeFilter}
                <button onClick={() => handleTypeFilter('')} className="hover:text-primary/70 transition-colors"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/30 dark:bg-black/10 uppercase font-black text-[10px] tracking-[0.2em] text-gray-400/80">
                <th className="px-4 sm:px-6 py-4 sm:py-5 min-w-[60px]">No</th>
                <th className="px-3 sm:px-4 py-4 sm:py-5 min-w-[90px]">Part Type</th>
                <th className="px-3 sm:px-4 py-4 sm:py-5 min-w-[110px]">Tanggal</th>
                <th className="px-3 sm:px-4 py-4 sm:py-5 min-w-[130px]">Type Barang</th>
                <th className="px-3 sm:px-4 py-4 sm:py-5 min-w-[160px]">Nama Barang</th>
                <th className="px-3 sm:px-4 py-4 sm:py-5 min-w-[80px]">Quality</th>
                <th className="px-3 sm:px-4 py-4 sm:py-5 min-w-[140px]">Vendor / Tujuan</th>
                <th className="px-3 sm:px-4 py-4 sm:py-5 min-w-[160px]">Keterangan</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 min-w-[100px] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50 dark:divide-white/[0.02]">
              {loading ? (
                <tr><td colSpan={9} className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-12 h-12"><div className="absolute inset-0 border-4 border-primary/10 rounded-full" /><div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Loading Data...</span>
                  </div>
                </td></tr>
              ) : error ? (
                <tr><td colSpan={9} className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{error}</span>
                    <button onClick={() => fetchData(1)} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-colors">Coba Lagi</button>
                  </div>
                </td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={9} className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-50">
                    <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-300"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{search || typeFilter ? 'Tidak ada hasil' : 'Belum ada transaksi'}</span>
                  </div>
                </td></tr>
              ) : (
                transactions.map((tx, index) => {
                  const rowNum = (pagination.page - 1) * pagination.limit + index + 1
                  if (editingId === tx.id) return <EditRow key={tx.id} transaction={tx} onSave={() => { setEditingId(null); fetchData(pagination.page) }} onCancel={() => setEditingId(null)} />
                  return (
                    <tr key={tx.id} className="group hover:bg-primary/[0.02] dark:hover:bg-primary/[0.03] transition-all duration-300">
                      <td className="px-4 sm:px-6 py-4 sm:py-5"><span className="text-xs font-black text-gray-400">{rowNum}</span></td>
                      <td className="px-3 sm:px-4 py-4 sm:py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${tx.partType === 'MASUK' ? 'bg-green-500/5 text-green-600 dark:text-green-400 ring-green-500/20' : 'bg-red-500/5 text-red-600 dark:text-red-400 ring-red-500/20'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${tx.partType === 'MASUK' ? 'bg-green-500' : 'bg-red-500'}`} />{tx.partType}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-4 sm:py-5"><span className="text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">{fmt(tx.tanggal)}</span></td>
                      <td className="px-3 sm:px-4 py-4 sm:py-5">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-white/50 dark:border-white/5 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest shadow-sm whitespace-nowrap">{tx.typeBarang}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-4 sm:py-5"><span className="text-sm font-black text-[#020617] dark:text-white uppercase tracking-tight group-hover:text-primary transition-colors">{tx.namaBarang}</span></td>
                      <td className="px-3 sm:px-4 py-4 sm:py-5"><span className={`text-sm font-black ${tx.partType === 'MASUK' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{tx.partType === 'MASUK' ? '+' : '-'}{tx.quality.toLocaleString('id-ID')}</span></td>
                      <td className="px-3 sm:px-4 py-4 sm:py-5">{tx.vendorTujuan ? <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{tx.vendorTujuan}</span> : <span className="text-[10px] text-gray-300 dark:text-gray-600">—</span>}</td>
                      <td className="px-3 sm:px-4 py-4 sm:py-5">{tx.keterangan ? <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{tx.keterangan}</span> : <span className="text-[10px] text-gray-300 dark:text-gray-600">—</span>}</td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditingId(tx.id)} title="Edit" className="p-2 bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-white/5 rounded-xl text-gray-400 hover:text-amber-500 hover:scale-110 hover:shadow-xl hover:shadow-amber-500/10 transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(tx.id)} title="Hapus" className="p-2 bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-white/5 rounded-xl text-gray-400 hover:text-red-500 hover:scale-110 hover:shadow-xl hover:shadow-red-500/10 transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && !error && (
          <div className="p-4 sm:p-6 bg-gray-50/50 dark:bg-black/20 border-t border-[#f1f5f9]/50 dark:border-[#1e293b]/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Rows per page */}
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">Rows per page:</span>
              <select
                value={limit}
                onChange={e => handleLimitChange(Number(e.target.value))}
                className="bg-transparent border-none text-[10px] sm:text-[11px] font-black uppercase focus:ring-0 cursor-pointer text-gray-950 dark:text-white"
              >
                {[10, 25, 50, 100].map(size => (
                  <option key={size} value={size}>{size} Unit/Page</option>
                ))}
              </select>
            </div>
            {/* Page navigation */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => fetchData(pagination.page - 1)} disabled={pagination.page === 1} className="p-2 sm:p-3 bg-white dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#1e293b] rounded-xl sm:rounded-2xl text-gray-400 hover:text-primary disabled:opacity-20 transition-all shadow-lg shadow-black/5 active:scale-90">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let p = i + 1; if (pagination.totalPages > 5 && pagination.page > 3) p = pagination.page - 3 + i + 1
                  if (p > pagination.totalPages) return null
                  return <button key={p} onClick={() => fetchData(p)} className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black transition-all shadow-lg shadow-black/5 ${p === pagination.page ? 'bg-primary text-white shadow-primary/20' : 'bg-white dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#1e293b] text-gray-400 hover:text-primary active:scale-90'}`}>{p}</button>
                })}
                <button onClick={() => fetchData(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="p-2 sm:p-3 bg-white dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#1e293b] rounded-xl sm:rounded-2xl text-gray-400 hover:text-primary disabled:opacity-20 transition-all shadow-lg shadow-black/5 active:scale-90">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stock Summary Cards */}
      <StockSummaryCards summary={stockSummary} activeFilter={typeFilter} onFilter={handleTypeFilter} />

      {/* Export Modal */}
      {showExport && <ExportModal onClose={() => setShowExport(false)} search={search} typeFilter={typeFilter} />}
    </div>
  )
}
