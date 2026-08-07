import type { YieldDailyRecord, YieldDailyRecordInput } from '../types'

export interface YieldDailyRow extends YieldDailyRecord {
  totalSeed: number
  totalSeedUsd: number
  withdrawalKrw: number
  withdrawalUsd: number
  depositKrw: number
  depositUsd: number
  profit: number | null
  profitUsd: number | null
  yieldRate: number | null
  yieldRateUsd: number | null
}

export interface YieldMonthSummary {
  monthKey: string
  label: string
  profit: number
  profitUsd: number
  yieldRate: number | null
  yieldRateUsd: number | null
  lastTotalSeed: number
}

export const YIELD_EXCHANGES = [
  { id: 'upbit', label: '업비트', currency: 'krw' as const },
  { id: 'binance', label: '바이낸스', currency: 'usd' as const },
] as const

function num(value: number | null | undefined): number {
  return value ?? 0
}

export function calcTotalSeedKrw(
  record: Pick<YieldDailyRecord, 'upbitEnd' | 'binanceEnd' | 'usdKrwRate'>
): number {
  const krw = num(record.upbitEnd)
  const usdTotal = num(record.binanceEnd)
  return Math.round(krw + usdTotal * record.usdKrwRate)
}

export function calcTotalSeedUsd(
  record: Pick<YieldDailyRecord, 'upbitEnd' | 'binanceEnd' | 'usdKrwRate'>
): number {
  const rate = record.usdKrwRate
  if (rate <= 0) return 0
  const krw = num(record.upbitEnd)
  const usd = num(record.binanceEnd)
  return Math.round((krw / rate + usd) * 100) / 100
}

export function calcWithdrawalKrw(
  record: Pick<YieldDailyRecord, 'withdrawalUpbit' | 'withdrawalBinance' | 'usdKrwRate'>
): number {
  const krw = num(record.withdrawalUpbit)
  const usd = num(record.withdrawalBinance)
  return Math.round(krw + usd * record.usdKrwRate)
}

export function calcWithdrawalUsd(
  record: Pick<YieldDailyRecord, 'withdrawalUpbit' | 'withdrawalBinance' | 'usdKrwRate'>
): number {
  const rate = record.usdKrwRate
  if (rate <= 0) return 0
  const krw = num(record.withdrawalUpbit)
  const usd = num(record.withdrawalBinance)
  return Math.round((krw / rate + usd) * 100) / 100
}

export function calcDepositKrw(
  record: Pick<YieldDailyRecord, 'depositUpbit' | 'depositBinance' | 'usdKrwRate'>
): number {
  const krw = num(record.depositUpbit)
  const usd = num(record.depositBinance)
  return Math.round(krw + usd * record.usdKrwRate)
}

export function calcDepositUsd(
  record: Pick<YieldDailyRecord, 'depositUpbit' | 'depositBinance' | 'usdKrwRate'>
): number {
  const rate = record.usdKrwRate
  if (rate <= 0) return 0
  const krw = num(record.depositUpbit)
  const usd = num(record.depositBinance)
  return Math.round((krw / rate + usd) * 100) / 100
}

export function sumWithdrawalsKrw(rows: Pick<YieldDailyRow, 'withdrawalKrw'>[]): number {
  return rows.reduce((sum, row) => sum + row.withdrawalKrw, 0)
}

export function sumDepositsKrw(rows: Pick<YieldDailyRow, 'depositKrw'>[]): number {
  return rows.reduce((sum, row) => sum + row.depositKrw, 0)
}

export function sumWithdrawalsUsd(rows: Pick<YieldDailyRow, 'withdrawalUsd'>[]): number {
  return Math.round(rows.reduce((sum, row) => sum + row.withdrawalUsd, 0) * 100) / 100
}

export function sumDepositsUsd(rows: Pick<YieldDailyRow, 'depositUsd'>[]): number {
  return Math.round(rows.reduce((sum, row) => sum + row.depositUsd, 0) * 100) / 100
}

export function resolveInitialPrincipalUsd(
  initialPrincipal: number | null,
  initialPrincipalUsd: number | null,
  firstRecord: YieldDailyRecord | null
): number | null {
  if (initialPrincipalUsd != null && initialPrincipalUsd > 0) return initialPrincipalUsd
  if (initialPrincipal != null && initialPrincipal > 0 && firstRecord && firstRecord.usdKrwRate > 0) {
    return Math.round((initialPrincipal / firstRecord.usdKrwRate) * 100) / 100
  }
  if (firstRecord) return calcTotalSeedUsd(firstRecord)
  return null
}

export function formatYieldRate(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatYieldProfit(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${Math.round(value).toLocaleString('ko-KR')}원`
}

export function formatYieldProfitUsd(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  const abs = Math.abs(value)
  return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatUsd(amount: number | null): string {
  if (amount == null) return '-'
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatKrwCell(amount: number | null): string {
  if (amount == null) return '-'
  return `${Math.round(amount).toLocaleString('ko-KR')}`
}

export function parseUsdInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const num = parseFloat(trimmed.replace(/[^\d.]/g, ''))
  return Number.isFinite(num) ? num : null
}

export function parseOptionalWonInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const num = parseInt(trimmed.replace(/[^\d]/g, ''), 10)
  return Number.isFinite(num) ? num : 0
}

export function sortRecordsAsc(records: YieldDailyRecord[]): YieldDailyRecord[] {
  return [...records].sort((a, b) => a.recordDate.localeCompare(b.recordDate))
}

export function sortRecordsDesc(records: YieldDailyRecord[]): YieldDailyRecord[] {
  return [...records].sort((a, b) => b.recordDate.localeCompare(a.recordDate))
}

export function buildDailyRows(
  records: YieldDailyRecord[],
  initialPrincipal: number | null = null,
  initialPrincipalUsd: number | null = null
): YieldDailyRow[] {
  const ordered = sortRecordsAsc(records)
  const resolvedPrincipalUsd = resolveInitialPrincipalUsd(
    initialPrincipal,
    initialPrincipalUsd,
    ordered[0] ?? null
  )
  let previousTotalSeed: number | null = null
  let previousTotalSeedUsd: number | null = null

  return ordered.map((record, index) => {
    const totalSeed = calcTotalSeedKrw(record)
    const totalSeedUsd = calcTotalSeedUsd(record)
    const withdrawalKrw = calcWithdrawalKrw(record)
    const withdrawalUsd = calcWithdrawalUsd(record)
    const depositKrw = calcDepositKrw(record)
    const depositUsd = calcDepositUsd(record)
    const baseline =
      previousTotalSeed ??
      (index === 0 && initialPrincipal != null && initialPrincipal > 0 ? initialPrincipal : null)
    const baselineUsd =
      previousTotalSeedUsd ??
      (index === 0 && resolvedPrincipalUsd != null && resolvedPrincipalUsd > 0
        ? resolvedPrincipalUsd
        : null)

    const profit =
      baseline == null ? null : totalSeed - baseline + withdrawalKrw - depositKrw
    const profitUsd =
      baselineUsd == null ? null : totalSeedUsd - baselineUsd + withdrawalUsd - depositUsd
    const yieldRate =
      baseline != null && baseline > 0 && profit != null ? (profit / baseline) * 100 : null
    const yieldRateUsd =
      baselineUsd != null && baselineUsd > 0 && profitUsd != null
        ? (profitUsd / baselineUsd) * 100
        : null

    previousTotalSeed = totalSeed
    previousTotalSeedUsd = totalSeedUsd

    return {
      ...record,
      totalSeed,
      totalSeedUsd,
      withdrawalKrw,
      withdrawalUsd,
      depositKrw,
      depositUsd,
      profit,
      profitUsd,
      yieldRate,
      yieldRateUsd,
    }
  })
}

export function getLatestDailyRow(rows: YieldDailyRow[]): YieldDailyRow | null {
  if (rows.length === 0) return null
  return rows[rows.length - 1]
}

export function summarizeOverall(
  rows: YieldDailyRow[],
  initialPrincipal: number | null,
  initialPrincipalUsd: number | null = null
) {
  const latest = rows.length > 0 ? rows[rows.length - 1] : null
  const firstRecord = rows.length > 0 ? rows[0] : null
  const fallbackBase = rows.length > 0 ? rows[0].totalSeed : null
  const base = initialPrincipal ?? fallbackBase
  const baseUsd = resolveInitialPrincipalUsd(initialPrincipal, initialPrincipalUsd, firstRecord)

  if (base == null || base <= 0 || !latest) {
    return {
      latest,
      totalProfit: null,
      totalYieldRate: null,
      totalProfitUsd: null,
      totalYieldRateUsd: null,
      basePrincipal: base,
      basePrincipalUsd: baseUsd,
    }
  }

  const totalWithdrawals = sumWithdrawalsKrw(rows)
  const totalDeposits = sumDepositsKrw(rows)
  const totalProfit = latest.totalSeed + totalWithdrawals - totalDeposits - base
  const totalYieldRate = (totalProfit / base) * 100

  let totalProfitUsd: number | null = null
  let totalYieldRateUsd: number | null = null
  if (baseUsd != null && baseUsd > 0) {
    const totalWithdrawalsUsd = sumWithdrawalsUsd(rows)
    const totalDepositsUsd = sumDepositsUsd(rows)
    totalProfitUsd = latest.totalSeedUsd + totalWithdrawalsUsd - totalDepositsUsd - baseUsd
    totalYieldRateUsd = (totalProfitUsd / baseUsd) * 100
  }

  return {
    latest,
    totalProfit,
    totalYieldRate,
    totalProfitUsd,
    totalYieldRateUsd,
    basePrincipal: base,
    basePrincipalUsd: baseUsd,
  }
}

export function buildMonthSummaries(
  rows: YieldDailyRow[],
  initialPrincipal: number | null = null,
  initialPrincipalUsd: number | null = null
): YieldMonthSummary[] {
  const byMonth = new Map<string, YieldDailyRow[]>()

  for (const row of rows) {
    const monthKey = row.recordDate.slice(0, 7)
    const list = byMonth.get(monthKey) ?? []
    list.push(row)
    byMonth.set(monthKey, list)
  }

  const summaries: YieldMonthSummary[] = []

  for (const [monthKey, monthRows] of byMonth.entries()) {
    const ordered = [...monthRows].sort((a, b) => a.recordDate.localeCompare(b.recordDate))
    const profit = ordered.reduce((sum, row) => sum + (row.profit ?? 0), 0)
    const profitUsd = ordered.reduce((sum, row) => sum + (row.profitUsd ?? 0), 0)
    const firstRow = ordered[0]
    const lastRow = ordered[ordered.length - 1]
    const monthIndex = rows.findIndex((row) => row.id === firstRow.id)
    const baseTotalSeed =
      monthIndex > 0
        ? rows[monthIndex - 1].totalSeed
        : initialPrincipal != null && initialPrincipal > 0
          ? initialPrincipal
          : null
    const baseTotalSeedUsd =
      monthIndex > 0
        ? rows[monthIndex - 1].totalSeedUsd
        : resolveInitialPrincipalUsd(initialPrincipal, initialPrincipalUsd, rows[0] ?? null)
    const yieldRate =
      baseTotalSeed != null && baseTotalSeed > 0 ? (profit / baseTotalSeed) * 100 : null
    const yieldRateUsd =
      baseTotalSeedUsd != null && baseTotalSeedUsd > 0 ? (profitUsd / baseTotalSeedUsd) * 100 : null

    summaries.push({
      monthKey,
      label: `${monthKey.slice(0, 4)}년 ${Number(monthKey.slice(5))}월`,
      profit,
      profitUsd,
      yieldRate,
      yieldRateUsd,
      lastTotalSeed: lastRow.totalSeed,
    })
  }

  return summaries.sort((a, b) => b.monthKey.localeCompare(a.monthKey))
}

export function suggestNextDayStarts(previous: YieldDailyRecord | null): Partial<YieldDailyRecordInput> {
  if (!previous) return {}
  return {
    upbitStart: previous.upbitEnd,
    binanceStart: previous.binanceEnd,
    usdKrwRate: previous.usdKrwRate,
  }
}
