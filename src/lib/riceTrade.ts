import type { RiceRecord } from '../types'

const EOK = 100_000_000

export function calcRiceTradeAmount(mesoSold: number, wonPerEok: number): number {
  if (mesoSold <= 0 || wonPerEok <= 0) return 0
  return Math.round((mesoSold / EOK) * wonPerEok)
}

export function formatWonPerEok(wonPerEok: number): string {
  return `1억당 ${Math.round(wonPerEok).toLocaleString('ko-KR')}원`
}

export function buildRiceTradeDescription(_mesoSold: number, wonPerEok: number): string {
  return `메소 거래 · ${formatWonPerEok(wonPerEok)}`
}

export function parseWonPerEokInput(value: string): number {
  const num = parseInt(value.replace(/[^\d]/g, ''), 10)
  return Number.isFinite(num) ? num : 0
}

export function sumRiceMesoSold(records: RiceRecord[]): number {
  return records.reduce((sum, record) => sum + (record.mesoSold ?? 0), 0)
}

/** 가계부 순수익에서 쌀곳간 판매 메소를 뺀 남은 메소 */
export function calcRiceHeldMeso(netProfit: number, records: RiceRecord[]): number {
  return netProfit - sumRiceMesoSold(records)
}

export interface RiceRatePoint {
  recordId: string
  recordDate: string
  wonPerEok: number
  mesoSold: number | null
  delta: number | null
}

export interface RiceRateSummary {
  latest: number
  min: number
  max: number
  average: number
  count: number
}

export interface RiceMonthlyRate {
  monthKey: string
  label: string
  average: number
  tradeCount: number
}

function calcWeightedWonPerEok(points: RiceRatePoint[]): number {
  const weighted = points.filter((p) => p.mesoSold != null && p.mesoSold > 0)
  if (weighted.length > 0) {
    return Math.round(
      weighted.reduce((sum, p) => sum + p.wonPerEok * p.mesoSold!, 0) /
        weighted.reduce((sum, p) => sum + p.mesoSold!, 0)
    )
  }
  return Math.round(points.reduce((sum, p) => sum + p.wonPerEok, 0) / points.length)
}

function formatRiceMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  return `${year}년 ${Number(month)}월`
}

export function buildRiceRateHistory(records: RiceRecord[]): RiceRatePoint[] {
  const rated = records
    .filter((r) => r.wonPerEok != null && r.wonPerEok > 0)
    .sort((a, b) => {
      const dateCmp = a.recordDate.localeCompare(b.recordDate)
      if (dateCmp !== 0) return dateCmp
      return a.createdAt.localeCompare(b.createdAt)
    })

  return rated.map((record, index) => {
    const prev = index > 0 ? rated[index - 1] : null
    const wonPerEok = record.wonPerEok!
    return {
      recordId: record.id,
      recordDate: record.recordDate,
      wonPerEok,
      mesoSold: record.mesoSold,
      delta: prev ? wonPerEok - prev.wonPerEok! : null,
    }
  })
}

export function summarizeRiceRateHistory(points: RiceRatePoint[]): RiceRateSummary | null {
  if (points.length === 0) return null

  const rates = points.map((p) => p.wonPerEok)
  const latest = points[points.length - 1]

  return {
    latest: latest.wonPerEok,
    min: Math.min(...rates),
    max: Math.max(...rates),
    average: calcWeightedWonPerEok(points),
    count: points.length,
  }
}

export function buildRiceMonthlyRateAverages(points: RiceRatePoint[]): RiceMonthlyRate[] {
  const byMonth = new Map<string, RiceRatePoint[]>()

  for (const point of points) {
    const monthKey = point.recordDate.slice(0, 7)
    const monthPoints = byMonth.get(monthKey) ?? []
    monthPoints.push(point)
    byMonth.set(monthKey, monthPoints)
  }

  return [...byMonth.entries()]
    .map(([monthKey, monthPoints]) => ({
      monthKey,
      label: formatRiceMonthLabel(monthKey),
      average: calcWeightedWonPerEok(monthPoints),
      tradeCount: monthPoints.length,
    }))
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
}

export function formatRiceRateDelta(delta: number): string {
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toLocaleString('ko-KR')}원`
}
