/**
 * Permission utilities for GPE Management IT
 * Defines menu keys, permission types, and helper functions for access control.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type PermissionType = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'import' | 'serah_terima'
export type PermissionsMap = Record<string, PermissionType[]>

// ─── Constants ────────────────────────────────────────────────────────────────

export const MENU_KEYS = {
  DASHBOARD:      'dashboard',
  LIFTS:          'lifts',
  LAPTOPS:        'laptops',
  PCS:            'pcs',
  MOUSE:          'mouse',
  MONITOR:        'monitor',
  UPS:            'ups',
  PRINTER:        'printer',
  TOOLS_JARINGAN: 'tools_jaringan',
  CCTV:           'cctv',
  STORAGE:        'storage',
  STOCK_MOVE:     'stock_move',
} as const

/** Available permissions per menu — defines the permission matrix. */
export const MENU_PERMISSIONS: Record<string, PermissionType[]> = {
  dashboard:      ['view'],
  lifts:          ['view', 'create', 'edit', 'delete', 'export'],
  laptops:        ['view', 'create', 'edit', 'delete', 'export', 'import', 'serah_terima'],
  pcs:            ['view', 'create', 'edit', 'delete', 'export', 'import'],
  mouse:          ['view', 'create', 'edit', 'delete', 'export'],
  monitor:        ['view', 'create', 'edit', 'delete', 'export'],
  ups:            ['view', 'create', 'edit', 'delete', 'export'],
  printer:        ['view', 'create', 'edit', 'delete', 'export'],
  tools_jaringan: ['view', 'create', 'edit', 'delete', 'export'],
  cctv:           ['view', 'create', 'edit', 'delete', 'export'],
  storage:        ['view', 'create', 'edit', 'delete', 'export'],
  stock_move:     ['view', 'create', 'edit', 'delete', 'export'],
}

/** Maps URL pathnames to their corresponding menu key. */
export const PATH_TO_MENU: Record<string, string> = {
  '/dashboard':      'dashboard',
  '/lifts':          'lifts',
  '/laptops':        'laptops',
  '/pcs':            'pcs',
  '/mouse':          'mouse',
  '/monitor':        'monitor',
  '/ups':            'ups',
  '/printer':        'printer',
  '/tools-jaringan': 'tools_jaringan',
  '/cctv':           'cctv',
  '/storage':        'storage',
  '/stock-move':     'stock_move',
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Returns true if the role string represents a super admin.
 * Accepts both 'super_admin' and 'superadmin' to handle DB variants.
 */
export function isSuperAdminRole(role?: string | null): boolean {
  if (!role) return false
  const normalized = role.toLowerCase().replace(/[_\s-]/g, '')
  return normalized === 'superadmin'
}

/**
 * Checks whether a session has a specific permission for a given menu.
 *
 * - Returns `true` unconditionally for super admin role (any variant).
 * - Returns `true` if the session's permissions map contains the action for the menu.
 * - Returns `false` for null/unauthenticated sessions or missing permissions.
 *
 * Requirements: 4.6, 4.8, 4.9, 4.10, 4.11, 4.12, 5.1, 5.2
 */
export function hasPermission(
  session: { user?: { role?: string; permissions?: Record<string, string[]> } } | null,
  menuKey: string,
  action: PermissionType
): boolean {
  if (!session?.user) return false
  if (isSuperAdminRole(session.user.role)) return true
  return session.user.permissions?.[menuKey]?.includes(action) ?? false
}

/**
 * Converts a flat array of `{ menu, permission }` rows (from the database)
 * into a `PermissionsMap` grouped by menu.
 *
 * Duplicate (menu, permission) pairs are deduplicated automatically.
 *
 * Requirements: 4.5, 4.14
 */
export function buildPermissionsMap(
  rows: { menu: string; permission: string }[]
): PermissionsMap {
  const map: PermissionsMap = {}
  for (const row of rows) {
    if (!map[row.menu]) {
      map[row.menu] = []
    }
    if (!map[row.menu].includes(row.permission as PermissionType)) {
      map[row.menu].push(row.permission as PermissionType)
    }
  }
  return map
}

/**
 * Returns the list of menu keys that are visible to the given session.
 *
 * - Super admin sees all menus (any role variant).
 * - Other users see only menus for which they have `view` permission.
 * - Returns an empty array for null/unauthenticated sessions.
 *
 * Requirements: 4.7, 5.3
 */
export function getVisibleMenus(
  session: { user?: { role?: string; permissions?: Record<string, string[]> } } | null
): string[] {
  if (!session?.user) return []
  if (isSuperAdminRole(session.user.role)) {
    return Object.values(MENU_KEYS)
  }
  return Object.keys(MENU_PERMISSIONS).filter((menuKey) =>
    hasPermission(session, menuKey, 'view')
  )
}

/**
 * Normalizes a username to lowercase and trims surrounding whitespace.
 * Used to ensure case-insensitive username lookups.
 *
 * Requirements: 1.7, 1.8
 */
export function normalizeUsername(username: string): string {
  return username.toLowerCase().trim()
}
