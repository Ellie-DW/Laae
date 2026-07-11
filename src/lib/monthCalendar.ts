import type { DiaryDay } from './diaryEntries'

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

function emptyStats() {
  return { income: 0, expense: 0, net: 0, entryCount: 0 }
}

export function buildMonthCalendar(
  year: number,
  month: number,
  diaryDays: DiaryDay[]
): { weeks: CalendarCell[][]; monthTotal: { income: number; expense: number; net: number } } {
  const dayMap = new Map(diaryDays.map((d) => [d.date, d]))

  const statsFor = (date: string) => {
    const day = dayMap.get(date)
    if (!day) return emptyStats()
    return {
      income: day.income,
      expense: day.expense,
      net: day.net,
      entryCount: day.entries.length,
    }
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

export function yearMonthToPeriodMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function periodMonthToYearMonth(periodMonth: string): { year: number; month: number } {
  const [year, month] = periodMonth.split('-').map(Number)
  return { year, month }
}
