'use client'
import Link from 'next/link'
import StandardEntityForm from '@/components/StandardEntityForm'
import { STANDARD_ENTITY_CONFIGS } from '@/lib/forms/standard-entity-config'
const c = STANDARD_ENTITY_CONFIGS.tools_jaringan
export default function CreateToolsJaringan() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center justify-center sm:justify-start gap-4">
                    <Link href={c.listPath} className="p-2 text-gray-400 hover:text-primary hover:bg-white dark:hover:bg-[#1e293b] rounded-xl border border-transparent hover:border-[#f1f5f9] dark:hover:border-[#334155] transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight">Tambah {c.label}</h1>
                        <p className="text-sm text-gray-400 font-medium">Daftarkan unit {c.label} baru ke dalam inventaris.</p>
                    </div>
                </div>
            </div>
            <StandardEntityForm config={c} isEdit={false} />
        </div>
    )
}
