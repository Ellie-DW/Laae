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
  first: number
  min: number
  max: number
  average: number
  totalDelta: number
  latestDelta: number | null
  count: number
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
  const first = points[0]
  const weighted = points.filter((p) => p.mesoSold != null && p.mesoSold > 0)
  const average =
    weighted.length > 0
      ? Math.round(
          weighted.reduce((sum, p) => sum + p.wonPerEok * p.mesoSold!, 0) /
            weighted.reduce((sum, p) => sum + p.mesoSold!, 0)
        )
      : Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length)

  return {
    latest: latest.wonPerEok,
    first: first.wonPerEok,
    min: Math.min(...rates),
    max: Math.max(...rates),
    average,
    totalDelta: latest.wonPerEok - first.wonPerEok,
    latestDelta: latest.delta,
    count: points.length,
  }
}

export function formatRiceRateDelta(delta: number): string {
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toLocaleString('ko-KR')}원`
}
