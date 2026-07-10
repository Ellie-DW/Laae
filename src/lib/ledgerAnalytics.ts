import type { Expense, HuntRecord, GatherRecord, DropRecord, Goal, ExpenseCategory } from '../types'
import { EXPENSE_CATEGORY_LABEL } from './ledgerApi'
import { splitHuntIncome } from './huntStats'

export interface LedgerSummary {
  huntIncome: number
  huntMesoIncome: number
  solErdaSaleIncome: number
  gatherIncome: number
  dropIncome: number
  bossIncome: number
  recordedIncome: number
  expenseTotal: number
  netProfit: number
  huntCount: number
  gatherCount: number
  dropCount: number
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

export interface CharacterLedgerSummary {
  characterId: string
  huntIncome: number
  huntMesoIncome: number
  solErdaSaleIncome: number
  gatherIncome: number
  dropIncome: number
  bossIncome: number
  expenseTotal: number
  netProfit: number
  huntCount: number
  gatherCount: number
  dropCount: number
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

export function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export function enrichLedgerWithBoss(
  summary: Omit<LedgerSummary, 'bossIncome' | 'recordedIncome' | 'netProfit'> & Partial<Pick<LedgerSummary, 'bossIncome'>>,
  bossIncome: number
): LedgerSummary {
  return {
    ...summary,
    bossIncome,
    recordedIncome: summary.huntIncome + summary.gatherIncome + summary.dropIncome + bossIncome,
    netProfit: summary.huntIncome + summary.gatherIncome + summary.dropIncome + bossIncome - summary.expenseTotal,
  }
}

export function computeLedgerSummary(
  hunts: HuntRecord[],
  gathers: GatherRecord[],
  expenses: Expense[],
  drops: DropRecord[] = [],
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

  const { huntMesoIncome, solErdaSaleIncome } = splitHuntIncome(filteredHunts)
  const huntIncome = huntMesoIncome + solErdaSaleIncome
  const gatherIncome = filteredGathers.reduce((s, g) => s + g.meso, 0)
  const dropIncome = filteredDrops.reduce((s, d) => s + d.meso, 0)
  const expenseTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0)

  return enrichLedgerWithBoss({
    huntIncome,
    huntMesoIncome,
    solErdaSaleIncome,
    gatherIncome,
    dropIncome,
    expenseTotal,
    huntCount: filteredHunts.length,
    gatherCount: filteredGathers.length,
    dropCount: filteredDrops.length,
    expenseCount: filteredExpenses.length,
  }, 0)
}

export function computeDailyNet(
  hunts: HuntRecord[],
  gathers: GatherRecord[],
  expenses: Expense[],
  drops: DropRecord[] = [],
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
    const expenseTotal = expenses
      .filter((e) => e.recordDate === date && (!characterId || e.characterId === characterId))
      .reduce((s, e) => s + e.amount, 0)

    const income = huntIncome + gatherIncome + dropIncome
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

export function computeCharacterSummaries(
  characterIds: { id: string; name: string }[],
  hunts: HuntRecord[],
  gathers: GatherRecord[],
  expenses: Expense[],
  drops: DropRecord[],
  month?: string,
  bossIncomeByCharacter: Record<string, number> = {}
): (CharacterLedgerSummary & { name: string })[] {
  return characterIds.map((char) => {
    const filter = month ? { characterId: char.id, startDate: `${month}-01`, endDate: `${month}-31` } : { characterId: char.id }
    const summary = computeLedgerSummary(hunts, gathers, expenses, drops, filter)
    const enriched = enrichLedgerWithBoss(summary, bossIncomeByCharacter[char.id] ?? 0)
    return {
      characterId: char.id,
      name: char.name,
      ...enriched,
    }
  }).sort((a, b) => b.netProfit - a.netProfit)
}

export interface GoalProgress {
  current: number
  percent: number
  summary: LedgerSummary
}

export function computeGoalProgress(
  goal: Goal,
  hunts: HuntRecord[],
  gathers: GatherRecord[],
  expenses: Expense[],
  drops: DropRecord[],
  bossIncome = 0
) {
  const month = goal.periodMonth
  const charId = goal.characterId
  const summary = enrichLedgerWithBoss(
    computeLedgerSummary(hunts, gathers, expenses, drops, {
      characterId: charId ?? undefined,
      startDate: `${month}-01`,
      endDate: `${month}-31`,
    }),
    bossIncome
  )

  const current = Math.max(0, summary.netProfit)
  const percent = goal.targetMeso > 0 ? Math.min(100, Math.round((current / goal.targetMeso) * 100)) : 0

  return { current, percent, summary } satisfies GoalProgress
}
