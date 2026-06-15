import { useSession } from 'next-auth/react'
import { hasPermission, isSuperAdminRole, type PermissionType } from '@/lib/security/permissions'

/**
 * Hook untuk mengecek permission user dari session.
 * Digunakan di semua halaman data untuk show/hide tombol aksi.
 */
export function usePermissions(menuKey: string) {
  const { data: session } = useSession()

  const can = (action: PermissionType): boolean => {
    return hasPermission(session, menuKey, action)
  }

  const isSuperAdmin = isSuperAdminRole(session?.user?.role)

  return {
    canView: can('view'),
    canCreate: can('create'),
    canEdit: can('edit'),
    canDelete: can('delete'),
    canExport: can('export'),
    canImport: can('import'),
    canSerahTerima: can('serah_terima'),
    isSuperAdmin,
    can,
  }
}
