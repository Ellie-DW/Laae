import type { Expense, Income, HuntRecord, GatherRecord, DropRecord, Goal, ExpenseCategory, IncomeCategory, BossSnapshot, Character, CharacterBossData } from '../types'
import { EXPENSE_CATEGORY_LABEL, INCOME_CATEGORY_LABEL } from './ledgerApi'
import { splitHuntIncome, getHuntCumulativeStats } from './huntStats'
import { getDropItemStats, getDropStatsSummary } from '../data/dropItems'
import { calculateBossStats, getAccountBossCumulativeStats, isMonthlyBossCleared, isWeeklyBossCleared } from './bossStats'
import { createDefaultBossData } from './appDataApi'
import { getCurrentMonth, getMonthlyPeriod, getToday, getWeeklyPeriod } from '../utils'

export { getCurrentMonth }

export interface LedgerSummary {
  huntIncome: number
  huntMesoIncome: number
  solErdaSaleIncome: number
  gatherIncome: number
  dropIncome: number
  manualIncome: number
  bossIncome: number
  recordedIncome: number
  expenseTotal: number
  netProfit: number
  huntCount: number
  gatherCount: number
  dropCount: number
  incomeCount: number
  expenseCount: number
}

export interface DailyNetEntry {
  date: string
  income: number
  expense: number
  net: number
}

export interface CategoryBreakdown {
  category: ExpenseCategory
  label: string
  amount: number
}

export interface IncomeCategoryBreakdown {
  category: IncomeCategory
  label: string
  amount: number
}

export interface CharacterLedgerSummary {
  characterId: string
  huntIncome: number
  huntMesoIncome: number
  solErdaSaleIncome: number
  gatherIncome: number
  dropIncome: number
  manualIncome: number
  bossIncome: number
  expenseTotal: number
  netProfit: number
  huntCount: number
  gatherCount: number
  dropCount: number
  incomeCount: number
  expenseCount: number
}

function inDateRange(date: string, start?: string, end?: string) {
  if (start && date < start) return false
  if (end && date > end) return false
  return true
}

function monthPrefix(date: string) {
  return date.slice(0, 7)
}

export function enrichLedgerWithBoss(
  summary: Omit<LedgerSummary, 'bossIncome' | 'recordedIncome' | 'netProfit'> & Partial<Pick<LedgerSummary, 'bossIncome'>>,
  bossIncome: number
): LedgerSummary {
  return {
    ...summary,
    bossIncome,
    recordedIncome: summary.huntIncome + summary.gatherIncome + summary.dropIncome + summary.manualIncome + bossIncome,
    netProfit: summary.huntIncome + summary.gatherIncome + summary.dropIncome + summary.manualIncome + bossIncome - summary.expenseTotal,
  }
}

export function computeLedgerSummary(
  hunts: HuntRecord[],
  gathers: GatherRecord[],
  expenses: Expense[],
  drops: DropRecord[] = [],
  incomes: Income[] = [],
  filter?: { characterId?: string; startDate?: string; endDate?: string }
): LedgerSummary {
  const charId = filter?.characterId
  const filteredHunts = hunts.filter(
    (h) => (!charId || h.characterId === charId) && inDateRange(h.recordDate, filter?.startDate, filter?.endDate)
  )
  const filteredGathers = gathers.filter(
    (g) => (!charId || g.characterId === charId) && inDateRange(g.recordDate, filter?.startDate, filter?.endDate)
  )
  const filteredDrops = drops.filter(
    (d) => (!charId || d.characterId === charId) && inDateRange(d.recordDate, filter?.startDate, filter?.endDate)
  )
  const filteredExpenses = expenses.filter(
    (e) => (!charId || e.characterId === charId) && inDateRange(e.recordDate, filter?.startDate, filter?.endDate)
  )
  const filteredIncomes = incomes.filter(
    (i) => (!charId || i.characterId === charId) && inDateRange(i.recordDate, filter?.startDate, filter?.endDate)
  )

  const { huntMesoIncome, solErdaSaleIncome } = splitHuntIncome(filteredHunts)
  const huntIncome = huntMesoIncome + solErdaSaleIncome
  const gatherIncome = filteredGathers.reduce((s, g) => s + g.meso, 0)
  const dropIncome = filteredDrops.reduce((s, d) => s + d.meso, 0)
  const manualIncome = filteredIncomes.reduce((s, i) => s + i.amount, 0)
  const expenseTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0)

  return enrichLedgerWithBoss({
    huntIncome,
    huntMesoIncome,
    solErdaSaleIncome,
    gatherIncome,
    dropIncome,
    manualIncome,
    expenseTotal,
    huntCount: filteredHunts.length,
    gatherCount: filteredGathers.length,
    dropCount: filteredDrops.length,
    incomeCount: filteredIncomes.length,
    expenseCount: filteredExpenses.length,
  }, 0)
}

export function computeDailyNet(
  hunts: HuntRecord[],
  gathers: GatherRecord[],
  expenses: Expense[],
  drops: DropRecord[] = [],
  incomes: Income[] = [],
  days = 7,
  characterId?: string
): DailyNetEntry[] {
  const result: DailyNetEntry[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)

    const huntIncome = hunts
      .filter((h) => h.recordDate === date && (!characterId || h.characterId === characterId))
      .reduce((s, h) => s + h.meso, 0)
    const gatherIncome = gathers
      .filter((g) => g.recordDate === date && (!characterId || g.characterId === characterId))
      .reduce((s, g) => s + g.meso, 0)
    const dropIncome = drops
      .filter((dr) => dr.recordDate === date && (!characterId || dr.characterId === characterId))
      .reduce((s, dr) => s + dr.meso, 0)
    const manualIncome = incomes
      .filter((i) => i.recordDate === date && (!characterId || i.characterId === characterId))
      .reduce((s, i) => s + i.amount, 0)
    const expenseTotal = expenses
      .filter((e) => e.recordDate === date && (!characterId || e.characterId === characterId))
      .reduce((s, e) => s + e.amount, 0)

    const income = huntIncome + gatherIncome + dropIncome + manualIncome
    result.push({ date, income, expense: expenseTotal, net: income - expenseTotal })
  }

  return result
}

export function computeExpenseByCategory(
  expenses: Expense[],
  filter?: { characterId?: string; month?: string }
): CategoryBreakdown[] {
  const filtered = expenses.filter((e) => {
    if (filter?.characterId && e.characterId !== filter.characterId) return false
    if (filter?.month && monthPrefix(e.recordDate) !== filter.month) return false
    return true
  })

  const totals = new Map<ExpenseCategory, number>()
  for (const e of filtered) {
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount)
  }

  return (Object.keys(EXPENSE_CATEGORY_LABEL) as ExpenseCategory[]).map((category) => ({
    category,
    label: EXPENSE_CATEGORY_LABEL[category],
    amount: totals.get(category) ?? 0,
  }))
}

export function computeExpenseTotal(
  expenses: Expense[],
  filter?: { characterId?: string; month?: string; startDate?: string; endDate?: string }
) {
  const filtered = expenses.filter((e) => {
    if (filter?.characterId && e.characterId !== filter.characterId) return false
    if (filter?.month && monthPrefix(e.recordDate) !== filter.month) return false
    if (filter?.startDate && e.recordDate < filter.startDate) return false
    if (filter?.endDate && e.recordDate > filter.endDate) return false
    return true
  })

  return {
    total: filtered.reduce((s, e) => s + e.amount, 0),
    count: filtered.length,
  }
}

export function computeIncomeByCategory(
  incomes: Income[],
  filter?: { characterId?: string; month?: string }
): IncomeCategoryBreakdown[] {
  const filtered = incomes.filter((i) => {
    if (filter?.characterId && i.characterId !== filter.characterId) return false
    if (filter?.month && monthPrefix(i.recordDate) !== filter.month) return false
    return true
  })

  const totals = new Map<IncomeCategory, number>()
  for (const i of filtered) {
    totals.set(i.category, (totals.get(i.category) ?? 0) + i.amount)
  }

  return (Object.keys(INCOME_CATEGORY_LABEL) as IncomeCategory[]).map((category) => ({
    category,
    label: INCOME_CATEGORY_LABEL[category],
    amount: totals.get(category) ?? 0,
  }))
}

export function computeIncomeTotal(
  incomes: Income[],
  filter?: { characterId?: string; month?: string; startDate?: string; endDate?: string }
) {
  const filtered = incomes.filter((i) => {
    if (filter?.characterId && i.characterId !== filter.characterId) return false
    if (filter?.month && monthPrefix(i.recordDate) !== filter.month) return false
    if (filter?.startDate && i.recordDate < filter.startDate) return false
    if (filter?.endDate && i.recordDate > filter.endDate) return false
    return true
  })

  return {
    total: filtered.reduce((s, i) => s + i.amount, 0),
    count: filtered.length,
  }
}

export function computeCharacterSummaries(
  characterIds: { id: string; name: string }[],
  hunts: HuntRecord[],
  gathers: GatherRecord[],
  expenses: Expense[],
  drops: DropRecord[],
  incomes: Income[] = [],
  month?: string,
  bossIncomeByCharacter: Record<string, number> = {}
): (CharacterLedgerSummary & { name: string })[] {
  return characterIds.map((char) => {
    const filter = month ? { characterId: char.id, startDate: `${month}-01`, endDate: `${month}-31` } : { characterId: char.id }
    const summary = computeLedgerSummary(hunts, gathers, expenses, drops, incomes, filter)
    const enriched = enrichLedgerWithBoss(summary, bossIncomeByCharacter[char.id] ?? 0)
    return {
      characterId: char.id,
      name: char.name,
      ...enriched,
    }
  }).sort((a, b) => b.netProfit - a.netProfit)
}

export interface GoalProgress {
  netProfit: number
  /** 표시용 달성률 (음수·100% 초과 가능) */
  percent: number
  /** 진행 바 너비 (0~100) */
  barPercent: number
  /** 목표까지 남은 금액 (초과 시 음수) */
  remaining: number
  daysLeft: number
  /** 남은 일수로 나눈 하루 필요 순수익 */
  dailyNeeded: number | null
  summary: LedgerSummary
}

export function getDaysLeftUntil(endDate: string, today = getToday()): number {
  const diff = Math.round(
    (new Date(`${endDate}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86_400_000
  )
  return Math.max(0, diff)
}

export function computeBossIncomeForRange(
  snapshots: BossSnapshot[],
  characterId: string | null,
  startDate: string,
  endDate: string
): number {
  return snapshots.reduce((sum, snapshot) => {
    if (characterId != null && snapshot.characterId !== characterId) return sum
    if (snapshot.periodEnd < startDate || snapshot.periodStart > endDate) return sum
    return sum + snapshot.totalMeso
  }, 0)
}

/** 스냅샷에 아직 없는 이번 주·달 보스 잡음 수익 */
export function computeLiveBossIncome(
  bossData: CharacterBossData,
  snapshots: BossSnapshot[],
  characterId: string
): number {
  const stats = calculateBossStats(bossData)
  const weekStart = getWeeklyPeriod().start
  const monthStart = getMonthlyPeriod().start
  const weeklySnapshotted = snapshots.some(
    (s) => s.characterId === characterId && s.cycle === 'weekly' && s.periodStart === weekStart
  )
  const monthlySnapshotted = snapshots.some(
    (s) => s.characterId === characterId && s.cycle === 'monthly' && s.periodStart === monthStart
  )

  let total = 0
  if (isWeeklyBossCleared(bossData) && stats.weeklyBossMeso > 0 && !weeklySnapshotted) {
    total += stats.weeklyBossMeso
  }
  if (isMonthlyBossCleared(bossData) && stats.monthlyBossMeso > 0 && !monthlySnapshotted) {
    total += stats.monthlyBossMeso
  }
  return total
}

/** 이번 달 보스 수익 — 주간 스냅샷 누적 + 미저장 잡음 */
export function computeMonthlyBossIncomeByCharacter(
  snapshots: BossSnapshot[],
  characters: { id: string }[],
  bossDataMap: Record<string, CharacterBossData>,
  month: string,
  defaultBossData: CharacterBossData = createDefaultBossData()
): Record<string, number> {
  const start = `${month}-01`
  const end = `${month}-31`

  return Object.fromEntries(
    characters.map((character) => {
      const bossData = bossDataMap[character.id] ?? defaultBossData
      const fromSnapshots = computeBossIncomeForRange(snapshots, character.id, start, end)
      const live = computeLiveBossIncome(bossData, snapshots, character.id)
      return [character.id, fromSnapshots + live]
    })
  )
}

export function computeGoalProgress(
  goal: Goal,
  hunts: HuntRecord[],
  gathers: GatherRecord[],
  expenses: Expense[],
  drops: DropRecord[],
  snapshots: BossSnapshot[] = [],
  incomes: Income[] = []
) {
  const today = getToday()
  const charId = goal.characterId

  if (today < goal.startDate) {
    const daysLeft = getDaysLeftUntil(goal.endDate, today)
    const dailyNeeded = goal.targetMeso > 0 && daysLeft > 0 ? goal.targetMeso / daysLeft : null
    const empty = computeLedgerSummary(hunts, gathers, expenses, drops, incomes, {
      characterId: charId ?? undefined,
      startDate: goal.startDate,
      endDate: goal.startDate,
    })
    return {
      netProfit: 0,
      percent: 0,
      barPercent: 0,
      remaining: goal.targetMeso,
      daysLeft,
      dailyNeeded,
      summary: empty,
    } satisfies GoalProgress
  }

  const progressEnd = today <= goal.endDate ? today : goal.endDate
  const summary = enrichLedgerWithBoss(
    computeLedgerSummary(hunts, gathers, expenses, drops, incomes, {
      characterId: charId ?? undefined,
      startDate: goal.startDate,
      endDate: progressEnd,
    }),
    computeBossIncomeForRange(snapshots, charId, goal.startDate, progressEnd)
  )

  const netProfit = summary.netProfit
  const percent =
    goal.targetMeso > 0 ? Math.round((netProfit / goal.targetMeso) * 100) : netProfit >= 0 ? 100 : 0
  const barPercent = Math.min(100, Math.max(0, percent))
  const remaining = goal.targetMeso - netProfit
  const daysLeft = today > goal.endDate ? 0 : getDaysLeftUntil(goal.endDate, today)
  const dailyNeeded = remaining > 0 && daysLeft > 0 ? remaining / daysLeft : null

  return { netProfit, percent, barPercent, remaining, daysLeft, dailyNeeded, summary } satisfies GoalProgress
}

/** 계정 전체 누적 순수익 (사냥·드랍·보스·채집·장부 수입 − 지출) */
export function computeAccountCumulativeNetProfit(
  hunts: HuntRecord[],
  gathers: GatherRecord[],
  drops: DropRecord[],
  expenses: Expense[],
  snapshots: BossSnapshot[],
  characters: Character[],
  bossDataMap: Record<string, CharacterBossData>,
  incomes: Income[] = []
): number {
  const huntStats = getHuntCumulativeStats(hunts)
  const dropSummary = getDropStatsSummary(getDropItemStats(drops))
  const bossStats = getAccountBossCumulativeStats(
    snapshots,
    characters,
    bossDataMap,
    createDefaultBossData()
  )
  const gatherTotal = gathers.reduce((sum, g) => sum + g.meso, 0)
  const manualIncomeTotal = incomes.reduce((sum, i) => sum + i.amount, 0)
  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalIncome =
    huntStats.huntMesoTotal +
    huntStats.saleMesoTotal +
    dropSummary.saleIncome +
    bossStats.totalMeso +
    gatherTotal +
    manualIncomeTotal

  return totalIncome - expenseTotal
}
