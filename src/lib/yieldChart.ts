import type { YieldDailyRow } from './yieldCalc'
import { getToday } from '../utils'

export type YieldChartMode = 'seed' | 'return'
export type YieldChartPeriod = '1w' | '1m' | '3m' | 'all'

export const YIELD_CHART_PERIODS: { id: YieldChartPeriod; label: string }[] = [
  { id: '1w', label: '1주' },
  { id: '1m', label: '1달' },
  { id: '3m', label: '3달' },
  { id: 'all', label: '전체' },
]

export interface YieldChartPoint {
  date: string
  label: string
  value: number
  change: number
  totalSeed: number
  hasRecord: boolean
}

function periodStartDate(period: YieldChartPeriod, today = getToday()): string | null {
  const days: Record<YieldChartPeriod, number | null> = {
    '1w': 7,
    '1m': 30,
    '3m': 90,
    all: null,
  }
  const offset = days[period]
  if (offset == null) return null

  const date = new Date(`${today}T12:00:00`)
  date.setDate(date.getDate() - offset)
  return date.toISOString().slice(0, 10)
}

function enumerateDates(start: string, end: string): string[] {
  const dates: string[] = []
  const cursor = new Date(`${start}T12:00:00`)
  const endDate = new Date(`${end}T12:00:00`)

  while (cursor <= endDate) {
    dates.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

export function formatChartDateLabel(date: string): string {
  const [, month, day] = date.split('-')
  return `${month}-${day}`
}

export function formatChartWon(value: number): string {
  if (value === 0) return '0'
  const abs = Math.abs(value)
  if (abs >= 100_000_000) return `${(value / 100_000_000).toFixed(2)}억`
  if (abs >= 10_000) return `${(value / 10_000).toFixed(2)}만`
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 0 })
}

export function buildYieldChartSeries(
  rows: YieldDailyRow[],
  initialPrincipal: number | null,
  investmentStartDate: string | null,
  mode: YieldChartMode,
  period: YieldChartPeriod
): {
  points: YieldChartPoint[]
  currentValue: number
  periodChange: number
  activeDate: string
} {
  if (rows.length === 0) {
    return { points: [], currentValue: 0, periodChange: 0, activeDate: getToday() }
  }

  const ordered = [...rows].sort((a, b) => a.recordDate.localeCompare(b.recordDate))
  const recordByDate = new Map(ordered.map((row) => [row.recordDate, row]))
  const firstRecordDate = ordered[0].recordDate
  const lastRecordDate = ordered[ordered.length - 1].recordDate
  const today = getToday()

  const periodStart = periodStartDate(period, today)
  const rangeStart = periodStart ?? investmentStartDate ?? firstRecordDate
  const rangeEnd = today >= lastRecordDate ? today : lastRecordDate

  const basePrincipal = initialPrincipal ?? ordered[0].totalSeed
  const dates = enumerateDates(
    rangeStart <= rangeEnd ? rangeStart : firstRecordDate,
    rangeEnd
  )

  let lastSeed = 0
  let cumulativeWithdrawals = 0
  let cumulativeDeposits = 0
  let previousValue = 0
  const points: YieldChartPoint[] = []

  for (const date of dates) {
    const row = recordByDate.get(date)
    if (row) {
      lastSeed = row.totalSeed
      cumulativeWithdrawals += row.withdrawalKrw
      cumulativeDeposits += row.depositKrw
    }

    const started = date >= firstRecordDate
    const totalSeed = started ? lastSeed : 0

    const value =
      mode === 'seed'
        ? started
          ? totalSeed
          : 0
        : started && basePrincipal > 0
          ? ((totalSeed + cumulativeWithdrawals - cumulativeDeposits - basePrincipal) / basePrincipal) *
            100
          : 0

    points.push({
      date,
      label: formatChartDateLabel(date),
      value,
      change: value - previousValue,
      totalSeed: started ? totalSeed : 0,
      hasRecord: row != null,
    })
    previousValue = value
  }

  const firstValue = points[0]?.value ?? 0
  const lastPoint = points[points.length - 1]
  const lastValue = lastPoint?.value ?? 0

  return {
    points,
    currentValue: lastValue,
    periodChange: lastValue - firstValue,
    activeDate: lastPoint?.date ?? today,
  }
}
