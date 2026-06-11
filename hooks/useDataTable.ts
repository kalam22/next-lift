import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import { logger } from '@/lib/logger'
import { extractErrorMessage } from '@/lib/inventory/utils'
import { 
  DEBOUNCE_DELAY_MS,
  SWAL_CONFIRM_DELETE_CONFIG,
  SWAL_SUCCESS_CONFIG,
  SWAL_ERROR_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from '@/lib/inventory/constants'

export interface UseDataTableConfig<T> {
  apiEndpoint: string
  entityName: string
  entityNamePlural: string
  colorTheme?: 'blue' | 'purple' | 'indigo' | 'green' | 'orange' | 'cyan' | 'yellow' | 'pink' | 'emerald'
}

export interface DataTableState<T> {
  data: T[]
  loading: boolean
  error: string | null
  searchTerm: string
  debouncedSearchTerm: string
  currentPage: number
  itemsPerPage: number
  totalItems: number
  sortConfig: { key: string; direction: 'asc' | 'desc' }
  selectedItems: Set<number>
}

export function useDataTable<T extends { id: number; createdAt?: Date | string }>(config: UseDataTableConfig<T>) {
  const { apiEndpoint, entityName, entityNamePlural, colorTheme = 'blue' } = config

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc'
  })
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, DEBOUNCE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sort_by: sortConfig.key,
        sort_order: sortConfig.direction
      })
      
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        params.append('search', debouncedSearchTerm.trim())
      }
      
      const response = await axios.get(`${apiEndpoint}?${params.toString()}`)
      setData(Array.isArray(response.data.data) ? response.data.data : [])
      setTotalItems(response.data.pagination?.total || 0)
      setError(null)
    } catch (error: unknown) {
      logger.error(`Error fetching ${entityNamePlural}:`, error)
      setData([])
      
      const axiosError = error && typeof error === 'object' && 'response' in error
        ? error as { response?: { status?: number; data?: { error?: string } } }
        : null
      
      if (axiosError?.response?.status === 503 || axiosError?.response?.data?.error === 'Database connection failed') {
        setError('Tidak dapat terhubung ke database. Pastikan PostgreSQL server berjalan di localhost:5432')
      } else {
        setError(extractErrorMessage(error) || ERROR_MESSAGES.fetchFailed)
      }
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, sortConfig, apiEndpoint, entityNamePlural])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Clear selection when data changes
  useEffect(() => {
    setSelectedItems(new Set())
  }, [currentPage, itemsPerPage, debouncedSearchTerm])

  // Delete handler
  const handleDelete = useCallback(async (id: number) => {
    const { default: Swal } = await import('sweetalert2')
    
    const result = await Swal.fire({
      ...SWAL_CONFIRM_DELETE_CONFIG,
      title: 'Apakah Anda yakin?',
      text: 'Data yang dihapus tidak dapat dikembalikan!',
    })

    if (result.isConfirmed) {
      try {
        // Panggil API dulu, baru update UI — mencegah data muncul lagi saat refresh
        await axios.delete(`${apiEndpoint}/${id}`)

        const updatedData = data.filter(item => item.id !== id)
        setData(updatedData)
        setTotalItems(prev => Math.max(prev - 1, 0))
        
        setSelectedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
        
        const isLastItemOnPage = updatedData.length === 0 && currentPage > 1
        if (isLastItemOnPage) {
          setCurrentPage(Math.max(currentPage - 1, 1))
        }
        
        await Swal.fire({
          ...SWAL_SUCCESS_CONFIG,
          title: 'Terhapus!',
          text: SUCCESS_MESSAGES.deleted,
          timer: 1500,
        })
      } catch (error) {
        logger.error(`Error deleting ${entityName}:`, error)
        await Swal.fire({
          ...SWAL_ERROR_CONFIG,
          title: 'Gagal!',
          text: extractErrorMessage(error) || ERROR_MESSAGES.deleteFailed,
        })
      }
    }
  }, [data, currentPage, sortConfig, apiEndpoint, entityName])

  // Sort handler
  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
    setCurrentPage(1)
  }, [])

  // Selection handlers
  const currentItems = useMemo(() => data, [data])
  const isAllSelected = useMemo(() => 
    currentItems.length > 0 && currentItems.every(item => selectedItems.has(item.id)), 
    [currentItems, selectedItems]
  )
  const isIndeterminate = useMemo(() => 
    selectedItems.size > 0 && selectedItems.size < currentItems.length, 
    [selectedItems.size, currentItems.length]
  )

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = new Set(currentItems.map(item => item.id))
      setSelectedItems(allIds)
    } else {
      setSelectedItems(new Set())
    }
  }, [currentItems])

  const handleSelectItem = useCallback((id: number, checked: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedItems(new Set())
  }, [])

  // Bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.size === 0) return

    const { default: Swal } = await import('sweetalert2')
    const result = await Swal.fire({
      ...SWAL_CONFIRM_DELETE_CONFIG,
      title: 'Apakah Anda yakin?',
      text: `Anda akan menghapus ${selectedItems.size} data ${entityNamePlural}. Tindakan ini tidak dapat dibatalkan!`,
      confirmButtonText: `Ya, Hapus ${selectedItems.size} Data!`,
    })

    if (result.isConfirmed) {
      try {
        const idsToDelete = Array.from(selectedItems)
        let successCount = 0
        let errorCount = 0

        // Parallel delete — jauh lebih cepat dari sequential
        const results = await Promise.allSettled(
          idsToDelete.map(id => axios.delete(`${apiEndpoint}/${id}`))
        )
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') successCount++
          else {
            errorCount++
            logger.error(`Error deleting ${entityName} ${idsToDelete[i]}:`, r.reason)
          }
        })

        setSelectedItems(new Set())
        await fetchData()

        if (errorCount === 0) {
          await Swal.fire({
            ...SWAL_SUCCESS_CONFIG,
            title: 'Berhasil!',
            text: `Berhasil menghapus ${successCount} data ${entityNamePlural}`,
          })
        } else {
          await Swal.fire({
            title: 'Sebagian Berhasil',
            text: `Berhasil menghapus ${successCount} data, gagal ${errorCount} data`,
            icon: 'warning',
            timer: 2000,
            showConfirmButton: false,
            buttonsStyling: false,
            customClass: {
              popup: '!rounded-2xl',
              title: '!font-bold',
            },
          })
        }
      } catch (error) {
        logger.error('Error in bulk delete:', error)
        const { default: Swal } = await import('sweetalert2')
        await Swal.fire({
          ...SWAL_ERROR_CONFIG,
          title: 'Gagal!',
          text: extractErrorMessage(error) || ERROR_MESSAGES.deleteFailed,
        })
      }
    }
  }, [selectedItems, fetchData, apiEndpoint, entityName, entityNamePlural])

  const totalPages = useMemo(() => Math.ceil(totalItems / itemsPerPage), [totalItems, itemsPerPage])

  return {
    // State
    data,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
    sortConfig,
    selectedItems,
    currentItems,
    totalPages,
    
    // Handlers
    fetchData,
    handleDelete,
    handleSort,
    handleSelectAll,
    handleSelectItem,
    handleClearSelection,
    handleBulkDelete,
    
    // Computed
    isAllSelected,
    isIndeterminate,
    
    // Config
    colorTheme,
    entityName,
    entityNamePlural,
  }
}

