'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import axios from 'axios'
import Swal from 'sweetalert2'

interface Laptop {
    id: number
    merk: string
    prosesor: string
    sn?: string | null
    ssdHdd: string
    ram: string
    monitor?: string | null
    printer?: string | null
    keyboard?: string | null
    masuk: string
    kirim?: string | null
    unit?: string | null
    untuk: string
    site: string
    po: number
    status: string
    kerusakan?: string | null
    suratJalan?: string | null
    catatan?: string | null
    gambar?: string | null
    createdAt: string
    updatedAt: string
}

export default function LaptopDetail() {
    const router = useRouter()
    const params = useParams()
    const [laptop, setLaptop] = useState<Laptop | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLaptop()
    }, [])

    const fetchLaptop = async () => {
        try {
            const response = await axios.get(`/api/laptops/${params.id}`)
            setLaptop(response.data)
        } catch (error) {
            console.error('Error fetching laptop:', error)
            Swal.fire({
                title: 'Gagal!',
                text: 'Gagal memuat data',
                icon: 'error',
                confirmButtonText: 'OK',
                buttonsStyling: false,
                customClass: {
                    popup: '!rounded-2xl',
                    title: '!font-bold',
                    confirmButton: 'swal2-confirm',
                },
            }).then(() => {
                router.push('/laptops')
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Apakah Anda yakin?',
            text: 'Data yang dihapus tidak dapat dikembalikan!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal',
            reverseButtons: true,
            buttonsStyling: false,
            customClass: {
                popup: '!rounded-2xl',
                title: '!font-bold',
                confirmButton: 'swal2-confirm',
                cancelButton: 'swal2-cancel',
            },
        })

        if (result.isConfirmed) {
            try {
                // Optimistic update: langsung redirect tanpa menunggu response (webhook-like behavior)
                // Redirect immediately for real-time sync
                router.push('/laptops')
                
                // Show success notification (non-blocking)
                Swal.fire({
                    title: 'Terhapus!',
                    text: 'Data berhasil dihapus.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    buttonsStyling: false,
                    customClass: {
                        popup: '!rounded-2xl',
                        title: '!font-bold',
                    },
                })
                
                // Execute delete request in background (webhook-like behavior)
                axios.delete(`/api/laptops/${params.id}`).catch(error => {
                    console.error('Error deleting laptop:', error)
                    // Show error notification if delete fails
                    Swal.fire({
                        title: 'Gagal!',
                        text: 'Gagal menghapus data. Silakan coba lagi.',
                        icon: 'error',
                        confirmButtonText: 'OK',
                        buttonsStyling: false,
                        customClass: {
                            popup: '!rounded-2xl',
                            title: '!font-bold',
                            confirmButton: 'swal2-confirm',
                        },
                    })
                })
            } catch (error) {
                console.error('Error deleting laptop:', error)
                Swal.fire({
                    title: 'Gagal!',
                    text: 'Gagal menghapus data. Silakan coba lagi.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    buttonsStyling: false,
                    customClass: {
                        popup: '!rounded-2xl',
                        title: '!font-bold',
                        confirmButton: 'swal2-confirm',
                    },
                })
            }
        }
    }

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    if (loading) {
        return (
            <div className="px-4 py-6 sm:px-0">
                <div className="text-center py-8 text-[#706f6c] dark:text-[#A1A09A]">Loading...</div>
            </div>
        )
    }

    if (!laptop) {
        return (
            <div className="px-4 py-6 sm:px-0">
                <div className="text-center py-8 text-[#706f6c] dark:text-[#A1A09A]">Data tidak ditemukan</div>
            </div>
        )
    }

    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-[#1b1b18] dark:text-[#EDEDEC]">Detail Laptop</h1>
                    <div className="flex gap-3">
                        <Link
                            href={`/laptops/${laptop.id}/edit`}
                            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
                        >
                            Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                        >
                            Hapus
                        </button>
                        <Link
                            href="/laptops"
                            className="px-4 py-2 bg-[#e3e3e0] dark:bg-[#3E3E3A] text-[#1b1b18] dark:text-[#EDEDEC] rounded-md hover:bg-[#dbdbd7] dark:hover:bg-[#2a2a28] transition-colors font-medium"
                        >
                            Kembali
                        </Link>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#161615] shadow-sm border border-[#e3e3e0] dark:border-[#3E3E3A] rounded-lg overflow-hidden">
                    {/* Image Section */}
                    {laptop.gambar && (
                        <div className="border-b border-[#e3e3e0] dark:border-[#3E3E3A] bg-[#f5f5f3] dark:bg-[#1f1f1e] p-6">
                            <div className="relative w-full max-w-md mx-auto h-64 rounded-lg overflow-hidden border border-[#e3e3e0] dark:border-[#3E3E3A]">
                                <Image
                                    src={laptop.gambar}
                                    alt={laptop.merk}
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 768px) 100vw, 448px"
                                />
                            </div>
                        </div>
                    )}

                    {/* Details Section */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Spesifikasi Hardware */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-[#1b1b18] dark:text-[#EDEDEC] border-b border-[#e3e3e0] dark:border-[#3E3E3A] pb-2">
                                    Spesifikasi Hardware
                                </h2>

                                <DetailItem label="Merk" value={laptop.merk} />
                                <DetailItem label="Prosesor" value={laptop.prosesor} />
                                <DetailItem label="SN" value={laptop.sn || '-'} />
                                <DetailItem label="SSD/HDD" value={laptop.ssdHdd} />
                                <DetailItem label="RAM" value={laptop.ram} />
                                <DetailItem label="Monitor" value={laptop.monitor || '-'} />
                                <DetailItem label="Printer" value={laptop.printer || '-'} />
                                <DetailItem label="Keyboard" value={laptop.keyboard || '-'} />
                            </div>

                            {/* Informasi Umum */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-[#1b1b18] dark:text-[#EDEDEC] border-b border-[#e3e3e0] dark:border-[#3E3E3A] pb-2">
                                    Informasi Umum
                                </h2>

                                <DetailItem label="Untuk" value={laptop.untuk} />
                                <DetailItem label="Site" value={laptop.site} />
                                <DetailItem label="Unit" value={laptop.unit || '-'} />
                                <DetailItem label="PO" value={laptop.po.toString()} />
                                <DetailItem label="Status" value={laptop.status} />
                                <DetailItem label="Surat Jalan" value={laptop.suratJalan || '-'} />
                            </div>

                            {/* Tanggal */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-[#1b1b18] dark:text-[#EDEDEC] border-b border-[#e3e3e0] dark:border-[#3E3E3A] pb-2">
                                    Tanggal
                                </h2>

                                <DetailItem label="Tanggal Masuk" value={formatDate(laptop.masuk)} />
                                <DetailItem label="Tanggal Kirim" value={formatDate(laptop.kirim)} />
                            </div>

                            {/* Catatan */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-[#1b1b18] dark:text-[#EDEDEC] border-b border-[#e3e3e0] dark:border-[#3E3E3A] pb-2">
                                    Catatan
                                </h2>

                                <DetailItem
                                    label="Kerusakan"
                                    value={laptop.kerusakan || '-'}
                                    multiline
                                />
                                <DetailItem
                                    label="Catatan"
                                    value={laptop.catatan || '-'}
                                    multiline
                                />
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="mt-6 pt-6 border-t border-[#e3e3e0] dark:border-[#3E3E3A] text-xs text-[#706f6c] dark:text-[#A1A09A]">
                            <div className="flex justify-between">
                                <span>Dibuat: {formatDate(laptop.createdAt)}</span>
                                <span>Diperbarui: {formatDate(laptop.updatedAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function DetailItem({
    label,
    value,
    multiline = false
}: {
    label: string
    value: string
    multiline?: boolean
}) {
    return (
        <div>
            <dt className="text-sm font-medium text-[#706f6c] dark:text-[#A1A09A] mb-1">
                {label}
            </dt>
            <dd className={`text-sm text-[#1b1b18] dark:text-[#EDEDEC] ${multiline ? 'whitespace-pre-wrap' : ''}`}>
                {value}
            </dd>
        </div>
    )
}
