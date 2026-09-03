import type { CategoryBreakdown } from './ledgerAnalytics'
import type { DiaryMonthSummary } from './diaryEntries'

export interface DiaryStatSlice {
  id: string
  label: string
  amount: number
  color: string
}

export interface DiaryStatSliceView extends DiaryStatSlice {
  percent: number
}

const INCOME_COLORS: Record<string, string> = {
  hunt: 'rgb(var(--diary-hunt))',
  solErda: 'rgb(var(--diary-sol))',
  gather: 'rgb(var(--diary-gather))',
  drop: 'rgb(var(--diary-drop))',
  boss: 'rgb(var(--diary-boss))',
  income: 'rgb(var(--diary-ledger))',
}

const EXPENSE_COLORS: Record<string, string> = {
  purchase: 'rgb(var(--diary-purchase))',
  enhancement: 'rgb(var(--diary-enhance))',
  consumable: 'rgb(var(--diary-consume))',
  other: 'rgb(var(--diary-other))',
}

export function buildDiaryIncomeSlices(summary: DiaryMonthSummary): DiaryStatSlice[] {
  const slices: DiaryStatSlice[] = []

  if (summary.huntMesoIncome > 0) {
    slices.push({ id: 'hunt', label: '사냥', amount: summary.huntMesoIncome, color: INCOME_COLORS.hunt })
  }
  if (summary.solErdaSaleIncome > 0) {
    slices.push({
      id: 'solErda',
      label: '솔 에르다 판매',
      amount: summary.solErdaSaleIncome,
      color: INCOME_COLORS.solErda,
    })
  }

  const typed = [
    { id: 'gather', label: '채집' },
    { id: 'drop', label: '드랍' },
    { id: 'boss', label: '보스' },
    { id: 'income', label: '장부' },
  ] as const

  for (const item of typed) {
    const amount = summary.incomeByType[item.id] ?? 0
    if (amount <= 0) continue
    slices.push({ id: item.id, label: item.label, amount, color: INCOME_COLORS[item.id] })
  }

  return slices
}

export function buildDiaryExpenseSlices(categories: CategoryBreakdown[]): DiaryStatSlice[] {
  return categories
    .filter((item) => item.amount > 0)
    .map((item) => ({
      id: item.category,
      label: item.label,
      amount: item.amount,
      color: EXPENSE_COLORS[item.category] ?? EXPENSE_COLORS.other,
    }))
}

export function withSlicePercents(slices: DiaryStatSlice[]): DiaryStatSliceView[] {
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0)
  return [...slices]
    .sort((a, b) => b.amount - a.amount)
    .map((slice) => ({
      ...slice,
      percent: total > 0 ? (slice.amount / total) * 100 : 0,
    }))
}

export function formatSlicePercent(percent: number) {
  if (percent <= 0) return '0%'
  if (percent < 0.1) return '<0.1%'
  const rounded = Math.round(percent * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`
}

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

export function describeDonutSlice(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
) {
  const sweep = endAngle - startAngle
  if (sweep >= 359.99) {
    return [
      `M ${cx + outerR} ${cy}`,
      `A ${outerR} ${outerR} 0 1 1 ${cx - outerR} ${cy}`,
      `A ${outerR} ${outerR} 0 1 1 ${cx + outerR} ${cy}`,
      `M ${cx + innerR} ${cy}`,
      `A ${innerR} ${innerR} 0 1 0 ${cx - innerR} ${cy}`,
      `A ${innerR} ${innerR} 0 1 0 ${cx + innerR} ${cy}`,
    ].join(' ')
  }

  const large = sweep > 180 ? 1 : 0
  const outerStart = polar(cx, cy, outerR, startAngle)
  const outerEnd = polar(cx, cy, outerR, endAngle)
  const innerEnd = polar(cx, cy, innerR, endAngle)
  const innerStart = polar(cx, cy, innerR, startAngle)

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ')
}
