import type { LedgerSummary } from './ledgerAnalytics'
import type { PremiumCharacterSection } from './premiumGroups'
import { addDaysYMD, getToday } from '../utils'

export const PREMIUM_GROUP_CHART_COLORS = [
  '#8b5cf6',
  '#22d3ee',
  '#f59e0b',
  '#10b981',
  '#f43f5e',
  '#3b82f6',
  '#eab308',
  '#64748b',
] as const

export type PremiumChartPeriod = '1d' | '1w' | '1m' | '3m' | '6m' | '1y' | 'all'

export const PREMIUM_CHART_PERIODS: { id: PremiumChartPeriod; label: string }[] = [
  { id: '1d', label: '1일' },
  { id: '1w', label: '1주' },
  { id: '1m', label: '1개월' },
  { id: '3m', label: '3개월' },
  { id: '6m', label: '6개월' },
  { id: '1y', label: '1년' },
  { id: 'all', label: '전체' },
]

export interface PremiumGroupMesoEntry {
  groupId: string | null
  groupName: string
  characterCount: number
  meso: number
  percentage: number
  change: number
  color: string
}

export interface PremiumChartPoint {
  date: string
  value: number
  change: number
  label: string
}

export type GetCharacterSummary = (characterId: string) => LedgerSummary
export type GetCharacterPeriodSummary = (
  characterId: string,
  startDate: string,
  endDate: string
) => LedgerSummary

const EPOCH_START = '2000-01-01'

function periodStartDate(period: PremiumChartPeriod, today = getToday()): string | null {
  const days: Record<PremiumChartPeriod, number | null> = {
    '1d': 1,
    '1w': 7,
    '1m': 30,
    '3m': 90,
    '6m': 180,
    '1y': 365,
    all: null,
  }
  const offset = days[period]
  if (offset == null) return null
  return addDaysYMD(today, -(offset - 1))
}

function characterIdsFromSection(
  section: PremiumCharacterSection | null,
  sections: PremiumCharacterSection[]
): Set<string> {
  if (!section) {
    return new Set(sections.flatMap((item) => item.characters.map((character) => character.id)))
  }
  return new Set(section.characters.map((character) => character.id))
}

function sumCharacterNet(
  characterIds: Set<string>,
  getCharacterSummary: GetCharacterSummary
): number {
  let total = 0
  for (const characterId of characterIds) {
    total += getCharacterSummary(characterId).netProfit
  }
  return total
}

function sumCharacterPeriodNet(
  characterIds: Set<string>,
  getCharacterPeriodSummary: GetCharacterPeriodSummary,
  startDate: string,
  endDate: string
): number {
  let total = 0
  for (const characterId of characterIds) {
    total += getCharacterPeriodSummary(characterId, startDate, endDate).netProfit
  }
  return total
}

function formatChartLabel(date: string, period: PremiumChartPeriod): string {
  const [, month, day] = date.split('-')
  if (period === '1y' || period === 'all') return `${Number(month)}월`
  return `${Number(month)}/${Number(day)}`
}

function buildDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  for (let cursor = startDate; cursor <= endDate; cursor = addDaysYMD(cursor, 1)) {
    dates.push(cursor)
  }
  return dates
}

export function buildPremiumMesoChartSeries(
  sections: PremiumCharacterSection[],
  getCharacterSummary: GetCharacterSummary,
  getCharacterPeriodSummary: GetCharacterPeriodSummary,
  period: PremiumChartPeriod,
  selectedGroupId: string | null | undefined
): { points: PremiumChartPoint[]; currentTotal: number; periodChange: number } {
  const selectedSection =
    selectedGroupId === undefined
      ? null
      : sections.find((section) => (section.group?.id ?? null) === selectedGroupId) ?? null

  const characterIds = characterIdsFromSection(selectedSection, sections)
  if (characterIds.size === 0) {
    return { points: [], currentTotal: 0, periodChange: 0 }
  }

  const today = getToday()
  const viewStart = periodStartDate(period, today) ?? EPOCH_START
  const currentTotal = sumCharacterNet(characterIds, getCharacterSummary)
  const periodChange = sumCharacterPeriodNet(
    characterIds,
    getCharacterPeriodSummary,
    viewStart,
    today
  )

  const dates = buildDateRange(viewStart, today)
  let previousValue = sumCharacterPeriodNet(
    characterIds,
    getCharacterPeriodSummary,
    EPOCH_START,
    addDaysYMD(viewStart, -1)
  )

  const points = dates.map((date) => {
    const value = sumCharacterPeriodNet(characterIds, getCharacterPeriodSummary, EPOCH_START, date)
    const change = value - previousValue
    previousValue = value
    return {
      date,
      value,
      change,
      label: formatChartLabel(date, period),
    }
  })

  if (points.length > 0) {
    points[points.length - 1].value = currentTotal
    points[points.length - 1].change =
      points.length > 1 ? currentTotal - points[points.length - 2].value : periodChange
  }

  return { points, currentTotal, periodChange }
}

export function buildPremiumMesoPortfolio(
  sections: PremiumCharacterSection[],
  getCharacterSummary: GetCharacterSummary,
  getCharacterPeriodSummary: GetCharacterPeriodSummary,
  period: PremiumChartPeriod
): {
  totalMeso: number
  characterCount: number
  entries: PremiumGroupMesoEntry[]
  periodChange: number
} {
  const today = getToday()
  const viewStart = periodStartDate(period, today) ?? EPOCH_START

  const rawEntries = sections
    .map((section, index) => {
      const characterIds = new Set(section.characters.map((character) => character.id))
      const meso = sumCharacterNet(characterIds, getCharacterSummary)
      const change = sumCharacterPeriodNet(characterIds, getCharacterPeriodSummary, viewStart, today)

      return {
        groupId: section.group?.id ?? null,
        groupName: section.group?.name ?? '미분류',
        characterCount: section.characters.length,
        meso,
        change,
        color: PREMIUM_GROUP_CHART_COLORS[index % PREMIUM_GROUP_CHART_COLORS.length],
      }
    })
    .filter((entry) => entry.characterCount > 0)

  const totalMeso = rawEntries.reduce((sum, entry) => sum + entry.meso, 0)
  const characterCount = rawEntries.reduce((sum, entry) => sum + entry.characterCount, 0)
  const chartBase = rawEntries.reduce((sum, entry) => sum + Math.abs(entry.meso), 0)
  const periodChange = rawEntries.reduce((sum, entry) => sum + entry.change, 0)

  const entries = rawEntries
    .map((entry) => ({
      ...entry,
      percentage: chartBase > 0 ? (Math.abs(entry.meso) / chartBase) * 100 : 0,
    }))
    .sort((a, b) => Math.abs(b.meso) - Math.abs(a.meso))

  return { totalMeso, characterCount, entries, periodChange }
}
