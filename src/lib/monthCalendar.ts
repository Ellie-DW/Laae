import type { HuntRecord, GatherRecord, Expense, DropRecord } from '../types'
import { buildBossDiaryEntries } from './diaryEntries'
import type { CharacterBossData } from '../types'

export interface CalendarCell {
  date: string
  day: number
  inMonth: boolean
  isSunday: boolean
  isSaturday: boolean
  isToday: boolean
  income: number
  expense: number
  net: number
  entryCount: number
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

export function getWeekdayLabels() {
  return WEEKDAYS
}

function formatDate(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function dayStats(
  date: string,
  hunts: HuntRecord[],
  gathers: GatherRecord[],
  expenses: Expense[],
  drops: DropRecord[],
  characterId?: string,
  bossIncome = 0,
  bossCount = 0
) {
  const huntIncome = hunts
    .filter((h) => h.recordDate === date && (!characterId || h.characterId === characterId))
    .reduce((s, h) => s + h.meso, 0)
  const gatherIncome = gathers
    .filter((g) => g.recordDate === date && (!characterId || g.characterId === characterId))
    .reduce((s, g) => s + g.meso, 0)
  const dropIncome = drops
    .filter((d) => d.recordDate === date && (!characterId || d.characterId === characterId))
    .reduce((s, d) => s + d.meso, 0)
  const expense = expenses
    .filter((e) => e.recordDate === date && (!characterId || e.characterId === characterId))
    .reduce((s, e) => s + e.amount, 0)
  const income = huntIncome + gatherIncome + dropIncome + bossIncome
  const entryCount =
    hunts.filter((h) => h.recordDate === date && (!characterId || h.characterId === characterId)).length +
    gathers.filter((g) => g.recordDate === date && (!characterId || g.characterId === characterId)).length +
    drops.filter((d) => d.recordDate === date && (!characterId || d.characterId === characterId)).length +
    expenses.filter((e) => e.recordDate === date && (!characterId || e.characterId === characterId)).length +
    bossCount

  return { income, expense, net: income - expense, entryCount }
}

function bossStatsByDate(
  characters: { id: string; name: string }[],
  bossDataMap: Record<string, CharacterBossData>,
  characterId?: string
) {
  const map = new Map<string, { income: number; count: number }>()
  for (const entry of buildBossDiaryEntries(characters, bossDataMap, characterId)) {
    const prev = map.get(entry.recordDate) ?? { income: 0, count: 0 }
    map.set(entry.recordDate, { income: prev.income + entry.amount, count: prev.count + 1 })
  }
  return map
}

export function buildMonthCalendar(
  year: number,
  month: number,
  hunts: HuntRecord[],
  gathers: GatherRecord[],
  expenses: Expense[],
  drops: DropRecord[] = [],
  characterId?: string,
  bossDataMap?: Record<string, CharacterBossData>,
  characters: { id: string; name: string }[] = []
): { weeks: CalendarCell[][]; monthTotal: { income: number; expense: number; net: number } } {
  const bossByDate = bossDataMap
    ? bossStatsByDate(characters, bossDataMap, characterId)
    : new Map<string, { income: number; count: number }>()

  const statsFor = (date: string) => {
    const boss = bossByDate.get(date)
    return dayStats(date, hunts, gathers, expenses, drops, characterId, boss?.income ?? 0, boss?.count ?? 0)
  }

  const today = formatDate(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate()
  )

  const firstDay = new Date(year, month - 1, 1)
  const startWeekday = firstDay.getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const prevMonthDays = new Date(year, month - 1, 0).getDate()

  const cells: CalendarCell[] = []

  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const m = month === 1 ? 12 : month - 1
    const y = month === 1 ? year - 1 : year
    const date = formatDate(y, m, day)
    const stats = statsFor(date)
    const d = new Date(y, m - 1, day)
    cells.push({
      date,
      day,
      inMonth: false,
      isSunday: d.getDay() === 0,
      isSaturday: d.getDay() === 6,
      isToday: date === today,
      ...stats,
    })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = formatDate(year, month, day)
    const stats = statsFor(date)
    const d = new Date(year, month - 1, day)
    cells.push({
      date,
      day,
      inMonth: true,
      isSunday: d.getDay() === 0,
      isSaturday: d.getDay() === 6,
      isToday: date === today,
      ...stats,
    })
  }

  let nextDay = 1
  while (cells.length % 7 !== 0) {
    const m = month === 12 ? 1 : month + 1
    const y = month === 12 ? year + 1 : year
    const date = formatDate(y, m, nextDay)
    const stats = statsFor(date)
    const d = new Date(y, m - 1, nextDay)
    cells.push({
      date,
      day: nextDay,
      inMonth: false,
      isSunday: d.getDay() === 0,
      isSaturday: d.getDay() === 6,
      isToday: date === today,
      ...stats,
    })
    nextDay++
  }

  const weeks: CalendarCell[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  let monthTotal = { income: 0, expense: 0, net: 0 }
  for (const cell of cells) {
    if (!cell.inMonth) continue
    monthTotal.income += cell.income
    monthTotal.expense += cell.expense
    monthTotal.net += cell.net
  }

  return { weeks, monthTotal }
}

export function getCurrentYearMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function shiftMonth(year: number, month: number, delta: number) {
  let m = month + delta
  let y = year
  while (m < 1) { m += 12; y -= 1 }
  while (m > 12) { m -= 12; y += 1 }
  return { year: y, month: m }
}
