import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'
import { handleDbError } from '@/lib/security/security'
import { cache, invalidateDashboardCache, dashboardCacheMultiLayer } from '@/lib/cache'

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic'

// Standard models (tanggalMasuk / tanggalKirim)
async function getStandardStats(model: any, startDate: Date, endDate: Date) {
  const [masuk, keluar, stok] = await Promise.all([
    model.count({ where: { tanggalMasuk: { gte: startDate, lte: endDate } } }),
    model.count({ where: { tanggalKirim: { gte: startDate, lte: endDate, not: null } } }),
    model.count({ where: { tanggalKirim: null } }),
  ])
  return { masuk, keluar, stok }
}

// PC models (masuk / kirim)
async function getPCStats(model: any, startDate: Date, endDate: Date) {
  const [masuk, keluar, stok] = await Promise.all([
    model.count({ where: { masuk: { gte: startDate, lte: endDate } } }),
    model.count({ where: { kirim: { gte: startDate, lte: endDate, not: null } } }),
    model.count({ where: { kirim: null } }),
  ])
  return { masuk, keluar, stok }
}

async function getMonthlyComparison(period: string, month: string | null, year: string | null, now: Date) {
  const months: { month: string; masuk: number; keluar: number }[] = []

  if (period === 'yearly') {
    const currentYear = now.getFullYear()
    for (let i = 4; i >= 0; i--) {
      const targetYear = currentYear - i
      const yearStart = new Date(targetYear, 0, 1)
      const yearEnd = new Date(targetYear, 11, 31, 23, 59, 59)

      const counts = await Promise.all([
        prisma.mouse.count({ where: { tanggalMasuk: { gte: yearStart, lte: yearEnd } } }),
        prisma.mouse.count({ where: { tanggalKirim: { gte: yearStart, lte: yearEnd, not: null } } }),
        prisma.monitor.count({ where: { tanggalMasuk: { gte: yearStart, lte: yearEnd } } }),
        prisma.monitor.count({ where: { tanggalKirim: { gte: yearStart, lte: yearEnd, not: null } } }),
        prisma.ups.count({ where: { tanggalMasuk: { gte: yearStart, lte: yearEnd } } }),
        prisma.ups.count({ where: { tanggalKirim: { gte: yearStart, lte: yearEnd, not: null } } }),
        prisma.printer.count({ where: { tanggalMasuk: { gte: yearStart, lte: yearEnd } } }),
        prisma.printer.count({ where: { tanggalKirim: { gte: yearStart, lte: yearEnd, not: null } } }),
        prisma.toolsJaringan.count({ where: { tanggalMasuk: { gte: yearStart, lte: yearEnd } } }),
        prisma.toolsJaringan.count({ where: { tanggalKirim: { gte: yearStart, lte: yearEnd, not: null } } }),
        prisma.cctv.count({ where: { tanggalMasuk: { gte: yearStart, lte: yearEnd } } }),
        prisma.cctv.count({ where: { tanggalKirim: { gte: yearStart, lte: yearEnd, not: null } } }),
        prisma.storage.count({ where: { tanggalMasuk: { gte: yearStart, lte: yearEnd } } }),
        prisma.storage.count({ where: { tanggalKirim: { gte: yearStart, lte: yearEnd, not: null } } }),
        prisma.pcs.count({ where: { masuk: { gte: yearStart, lte: yearEnd } } }),
        prisma.pcs.count({ where: { kirim: { gte: yearStart, lte: yearEnd, not: null } } }),
        prisma.laptops.count({ where: { masuk: { gte: yearStart, lte: yearEnd } } }),
        prisma.laptops.count({ where: { kirim: { gte: yearStart, lte: yearEnd, not: null } } }),
      ])

      months.push({
        month: targetYear.toString(),
        masuk: counts[0] + counts[2] + counts[4] + counts[6] + counts[8] + counts[10] + counts[12] + counts[14] + counts[16],
        keluar: counts[1] + counts[3] + counts[5] + counts[7] + counts[9] + counts[11] + counts[13] + counts[15] + counts[17],
      })
    }
    return months
  }

  // Monthly: last 12 months
  let baseYear = now.getFullYear()
  let baseMonth = now.getMonth()
  if (period === 'monthly' && month) {
    const [ys, ms] = month.split('-')
    baseYear = parseInt(ys)
    baseMonth = parseInt(ms) - 1
  }

  for (let i = 11; i >= 0; i--) {
    let targetMonth = baseMonth - i
    let targetYear = baseYear
    if (targetMonth < 0) { targetYear -= 1; targetMonth += 12 }
    const monthStart = new Date(targetYear, targetMonth, 1)
    const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59)

    const counts = await Promise.all([
      prisma.mouse.count({ where: { tanggalMasuk: { gte: monthStart, lte: monthEnd } } }),
      prisma.mouse.count({ where: { tanggalKirim: { gte: monthStart, lte: monthEnd, not: null } } }),
      prisma.monitor.count({ where: { tanggalMasuk: { gte: monthStart, lte: monthEnd } } }),
      prisma.monitor.count({ where: { tanggalKirim: { gte: monthStart, lte: monthEnd, not: null } } }),
      prisma.ups.count({ where: { tanggalMasuk: { gte: monthStart, lte: monthEnd } } }),
      prisma.ups.count({ where: { tanggalKirim: { gte: monthStart, lte: monthEnd, not: null } } }),
      prisma.printer.count({ where: { tanggalMasuk: { gte: monthStart, lte: monthEnd } } }),
      prisma.printer.count({ where: { tanggalKirim: { gte: monthStart, lte: monthEnd, not: null } } }),
      prisma.toolsJaringan.count({ where: { tanggalMasuk: { gte: monthStart, lte: monthEnd } } }),
      prisma.toolsJaringan.count({ where: { tanggalKirim: { gte: monthStart, lte: monthEnd, not: null } } }),
      prisma.cctv.count({ where: { tanggalMasuk: { gte: monthStart, lte: monthEnd } } }),
      prisma.cctv.count({ where: { tanggalKirim: { gte: monthStart, lte: monthEnd, not: null } } }),
      prisma.storage.count({ where: { tanggalMasuk: { gte: monthStart, lte: monthEnd } } }),
      prisma.storage.count({ where: { tanggalKirim: { gte: monthStart, lte: monthEnd, not: null } } }),
      prisma.pcs.count({ where: { masuk: { gte: monthStart, lte: monthEnd } } }),
      prisma.pcs.count({ where: { kirim: { gte: monthStart, lte: monthEnd, not: null } } }),
      prisma.laptops.count({ where: { masuk: { gte: monthStart, lte: monthEnd } } }),
      prisma.laptops.count({ where: { kirim: { gte: monthStart, lte: monthEnd, not: null } } }),
    ])

    months.push({
      month: monthStart.toLocaleDateString('id-ID', { month: 'short' }),
      masuk: counts[0] + counts[2] + counts[4] + counts[6] + counts[8] + counts[10] + counts[12] + counts[14] + counts[16],
      keluar: counts[1] + counts[3] + counts[5] + counts[7] + counts[9] + counts[11] + counts[13] + counts[15] + counts[17],
    })
  }
  return months
}

async function getCategoryDistribution() {
  const [mouse, monitor, ups, printer, toolsJaringan, cctv, storage, pcs, laptops] = await Promise.all([
    prisma.mouse.count(),
    prisma.monitor.count(),
    prisma.ups.count(),
    prisma.printer.count(),
    prisma.toolsJaringan.count(),
    prisma.cctv.count(),
    prisma.storage.count(),
    prisma.pcs.count(),
    prisma.laptops.count(),
  ])
  const total = mouse + monitor + ups + printer + toolsJaringan + cctv + storage + pcs + laptops
  return [
    { name: 'Mouse', value: mouse, percentage: total > 0 ? Math.round((mouse / total) * 100) : 0 },
    { name: 'Monitor', value: monitor, percentage: total > 0 ? Math.round((monitor / total) * 100) : 0 },
    { name: 'UPS', value: ups, percentage: total > 0 ? Math.round((ups / total) * 100) : 0 },
    { name: 'Printer', value: printer, percentage: total > 0 ? Math.round((printer / total) * 100) : 0 },
    { name: 'Tools Jaringan', value: toolsJaringan, percentage: total > 0 ? Math.round((toolsJaringan / total) * 100) : 0 },
    { name: 'CCTV', value: cctv, percentage: total > 0 ? Math.round((cctv / total) * 100) : 0 },
    { name: 'Storage', value: storage, percentage: total > 0 ? Math.round((storage / total) * 100) : 0 },
    { name: 'PCs', value: pcs, percentage: total > 0 ? Math.round((pcs / total) * 100) : 0 },
    { name: 'Laptops', value: laptops, percentage: total > 0 ? Math.round((laptops / total) * 100) : 0 },
  ].filter(item => item.value > 0)
}

async function getRecentActivity() {
  const limit = 20
  const activities: any[] = []

  const processStandard = async (model: any, menuName: string, quantityField: string) => {
    const [masukItems, keluarItems] = await Promise.all([
      model.findMany({
        select: { id: true, brand: true, [quantityField]: true, tanggalMasuk: true, site: true, diperuntukan: true, updatedAt: true },
        orderBy: { tanggalMasuk: 'desc' },
        take: limit,
      }),
      model.findMany({
        select: { id: true, brand: true, [quantityField]: true, tanggalKirim: true, site: true, diperuntukan: true, updatedAt: true },
        where: { tanggalKirim: { not: null } },
        orderBy: { tanggalKirim: 'desc' },
        take: limit,
      }),
    ])
    masukItems.forEach((item: any) => {
      if (item.tanggalMasuk) activities.push({ menu: menuName, item: item.brand, action: 'masuk', quantity: item[quantityField], site: item.site || '', pic: item.diperuntukan || '', timestamp: item.updatedAt.toISOString(), updatedAt: item.updatedAt.toISOString() })
    })
    keluarItems.forEach((item: any) => {
      if (item.tanggalKirim) activities.push({ menu: menuName, item: item.brand, action: 'keluar', quantity: item[quantityField], site: item.site || '', pic: item.diperuntukan || '', timestamp: item.updatedAt.toISOString(), updatedAt: item.updatedAt.toISOString() })
    })
  }

  const processPC = async (model: any, menuName: string) => {
    const [masukItems, keluarItems] = await Promise.all([
      model.findMany({ select: { id: true, merk: true, unit: true, masuk: true, site: true, untuk: true, updatedAt: true }, orderBy: { masuk: 'desc' }, take: limit }),
      model.findMany({ select: { id: true, merk: true, unit: true, kirim: true, site: true, untuk: true, updatedAt: true }, where: { kirim: { not: null } }, orderBy: { kirim: 'desc' }, take: limit }),
    ])
    masukItems.forEach((item: any) => {
      if (item.masuk) activities.push({ menu: menuName, item: item.merk, action: 'masuk', quantity: parseInt(item.unit) || 1, site: item.site || '', pic: item.untuk || '', timestamp: item.updatedAt.toISOString(), updatedAt: item.updatedAt.toISOString() })
    })
    keluarItems.forEach((item: any) => {
      if (item.kirim) activities.push({ menu: menuName, item: item.merk, action: 'keluar', quantity: parseInt(item.unit) || 1, site: item.site || '', pic: item.untuk || '', timestamp: item.updatedAt.toISOString(), updatedAt: item.updatedAt.toISOString() })
    })
  }

  await Promise.all([
    processStandard(prisma.mouse, 'Mouse', 'jumlahOrderan'),
    processStandard(prisma.monitor, 'Monitor', 'jumlahOrderan'),
    processStandard(prisma.ups, 'UPS', 'jumlahOrderan'),
    processStandard(prisma.printer, 'Printer', 'jumlah'),
    processStandard(prisma.toolsJaringan, 'Tools Jaringan', 'jumlahOrderan'),
    processStandard(prisma.cctv, 'CCTV', 'jumlahOrderan'),
    processStandard(prisma.storage, 'Storage', 'jumlahOrderan'),
    processPC(prisma.pcs, 'PCs'),
    processPC(prisma.laptops, 'Laptops'),
  ])

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return activities.slice(0, 10)
}

async function getSiteComparison(startDate: Date, endDate: Date) {
  const siteMap = new Map<string, { masuk: number; keluar: number }>()

  const processStandard = async (model: any) => {
    const [masukData, keluarData] = await Promise.all([
      model.groupBy({ by: ['site'], where: { tanggalMasuk: { gte: startDate, lte: endDate } }, _count: { id: true } }),
      model.groupBy({ by: ['site'], where: { tanggalKirim: { gte: startDate, lte: endDate, not: null } }, _count: { id: true } }),
    ])
    masukData.forEach((item: any) => {
      const cur = siteMap.get(item.site) || { masuk: 0, keluar: 0 }
      siteMap.set(item.site, { ...cur, masuk: cur.masuk + item._count.id })
    })
    keluarData.forEach((item: any) => {
      const cur = siteMap.get(item.site) || { masuk: 0, keluar: 0 }
      siteMap.set(item.site, { ...cur, keluar: cur.keluar + item._count.id })
    })
  }

  const processPC = async (model: any) => {
    const [masukData, keluarData] = await Promise.all([
      model.groupBy({ by: ['site'], where: { masuk: { gte: startDate, lte: endDate } }, _count: { id: true } }),
      model.groupBy({ by: ['site'], where: { kirim: { gte: startDate, lte: endDate, not: null } }, _count: { id: true } }),
    ])
    masukData.forEach((item: any) => {
      const cur = siteMap.get(item.site) || { masuk: 0, keluar: 0 }
      siteMap.set(item.site, { ...cur, masuk: cur.masuk + item._count.id })
    })
    keluarData.forEach((item: any) => {
      const cur = siteMap.get(item.site) || { masuk: 0, keluar: 0 }
      siteMap.set(item.site, { ...cur, keluar: cur.keluar + item._count.id })
    })
  }

  await Promise.all([
    processStandard(prisma.mouse),
    processStandard(prisma.monitor),
    processStandard(prisma.ups),
    processStandard(prisma.printer),
    processStandard(prisma.toolsJaringan),
    processStandard(prisma.cctv),
    processStandard(prisma.storage),
    processPC(prisma.pcs),
    processPC(prisma.laptops),
  ])

  return Array.from(siteMap.entries())
    .map(([site, data]) => ({ site, masuk: data.masuk, keluar: data.keluar }))
    .sort((a, b) => (b.masuk + b.keluar) - (a.masuk + a.keluar))
}

async function getSiteDistribution() {
  const [mouseData, monitorData, upsData, printerData, toolsData, cctvData, storageData, pcsData, laptopsData] = await Promise.all([
    prisma.mouse.groupBy({ by: ['site'], _count: { id: true } }),
    prisma.monitor.groupBy({ by: ['site'], _count: { id: true } }),
    prisma.ups.groupBy({ by: ['site'], _count: { id: true } }),
    prisma.printer.groupBy({ by: ['site'], _count: { id: true } }),
    prisma.toolsJaringan.groupBy({ by: ['site'], _count: { id: true } }),
    prisma.cctv.groupBy({ by: ['site'], _count: { id: true } }),
    prisma.storage.groupBy({ by: ['site'], _count: { id: true } }),
    prisma.pcs.groupBy({ by: ['site'], _count: { id: true } }),
    prisma.laptops.groupBy({ by: ['site'], _count: { id: true } }),
  ])

  const siteMap = new Map<string, number>()
  ;[mouseData, monitorData, upsData, printerData, toolsData, cctvData, storageData, pcsData, laptopsData].forEach(data => {
    data.forEach((item: any) => siteMap.set(item.site, (siteMap.get(item.site) || 0) + item._count.id))
  })

  const total = Array.from(siteMap.values()).reduce((s, v) => s + v, 0)
  return Array.from(siteMap.entries())
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, percentage: total > 0 ? Math.round((value / total) * 100) : 0 }))
    .sort((a, b) => b.value - a.value)
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'monthly'
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const cacheKey = cache.generateKey('/api/dashboard', {
      period, month: month || null, year: year || null,
    })

    const cachedResponse = await dashboardCacheMultiLayer.get(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: { 'Cache-Control': 'private, no-store', 'X-Cache': 'HIT' },
      })
    }

    const now = new Date()
    let startDate: Date
    let endDate: Date

    if (period === 'monthly' && month) {
      const [yearStr, monthStr] = month.split('-')
      const sy = parseInt(yearStr), sm = parseInt(monthStr) - 1
      startDate = new Date(sy, sm, 1)
      endDate = new Date(sy, sm + 1, 0, 23, 59, 59)
    } else if (period === 'yearly' && year) {
      const sy = parseInt(year)
      startDate = new Date(sy, 0, 1)
      endDate = new Date(sy, 11, 31, 23, 59, 59)
    } else {
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
    }

    // All top-level queries run in parallel
    const [
      mouseStats, monitorStats, upsStats, printerStats,
      toolsJaringanStats, cctvStats, storageStats, pcsStats, laptopsStats,
      monthlyComparison, categoryDistribution,
      recentActivity, siteComparison, siteDistribution,
    ] = await Promise.all([
      getStandardStats(prisma.mouse, startDate, endDate),
      getStandardStats(prisma.monitor, startDate, endDate),
      getStandardStats(prisma.ups, startDate, endDate),
      getStandardStats(prisma.printer, startDate, endDate),
      getStandardStats(prisma.toolsJaringan, startDate, endDate),
      getStandardStats(prisma.cctv, startDate, endDate),
      getStandardStats(prisma.storage, startDate, endDate),
      getPCStats(prisma.pcs, startDate, endDate),
      getPCStats(prisma.laptops, startDate, endDate),
      getMonthlyComparison(period, month, year, now),
      getCategoryDistribution(),
      getRecentActivity(),
      getSiteComparison(startDate, endDate),
      getSiteDistribution(),
    ])

    const [totalStockMove, totalSerahTerima] = await Promise.all([
      prisma.stockTransaction.count(),
      prisma.handover.count(),
    ])

    const summary = {
      totalMasuk: mouseStats.masuk + monitorStats.masuk + upsStats.masuk + printerStats.masuk + toolsJaringanStats.masuk + cctvStats.masuk + storageStats.masuk + pcsStats.masuk + laptopsStats.masuk,
      totalKeluar: mouseStats.keluar + monitorStats.keluar + upsStats.keluar + printerStats.keluar + toolsJaringanStats.keluar + cctvStats.keluar + storageStats.keluar + pcsStats.keluar + laptopsStats.keluar,
      stokSaatIni: mouseStats.stok + monitorStats.stok + upsStats.stok + printerStats.stok + toolsJaringanStats.stok + cctvStats.stok + storageStats.stok + pcsStats.stok + laptopsStats.stok,
      totalStockMove,
      totalSerahTerima,
    }

    const perMenu = {
      mouse: mouseStats, monitor: monitorStats, ups: upsStats,
      printer: printerStats, toolsJaringan: toolsJaringanStats,
      cctv: cctvStats, storage: storageStats,
      pcs: pcsStats, laptops: laptopsStats,
    }

    const responseData = {
      summary, perMenu, monthlyComparison, categoryDistribution,
      recentActivity, siteComparison, siteDistribution,
    }

    // Cache 5 menit
    await dashboardCacheMultiLayer.set(cacheKey, responseData, 300_000)

    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'private, no-store', 'X-Cache': 'MISS' },
    })
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error)
    return handleDbError(error, 'mengambil data dashboard')
  }
}
