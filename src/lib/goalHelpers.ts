import type { GoalProgress } from './ledgerAnalytics'
import { addDaysYMD, formatMesoKorean, getToday } from '../utils'

export function getDaysUntil(endDate: string, today = getToday()): number {
  const start = new Date(`${today}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}

export function isGoalEnded(endDate: string, today = getToday()): boolean {
  return today > endDate
}

export function isGoalNotStarted(startDate: string, today = getToday()): boolean {
  return today < startDate
}

export function isGoalActive(startDate: string, endDate: string, today = getToday()): boolean {
  return today >= startDate && today <= endDate
}

export function formatShortDate(ymd: string): string {
  const [, month, day] = ymd.split('-').map(Number)
  return `${month}/${day}`
}

export function formatGoalDeadline(endDate: string, today = getToday()): string {
  const days = getDaysUntil(endDate, today)
  if (days < 0) return `마감 ${formatShortDate(endDate)}`
  if (days === 0) return 'D-day'
  return `D-${days}`
}

export function formatGoalPeriod(startDate: string, endDate: string): string {
  return `${formatShortDate(startDate)} ~ ${formatShortDate(endDate)}`
}

export function getEndOfMonthYMD(today = getToday()): string {
  const [y, m] = today.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}

export function deadlineFromDays(days: number, today = getToday()): string {
  return addDaysYMD(today, days)
}

export function formatGoalPace(progress: GoalProgress, startDate: string, endDate: string): string {
  const { remaining, daysLeft, dailyNeeded, netProfit } = progress
  const today = getToday()
  const ended = isGoalEnded(endDate, today)
  const notStarted = isGoalNotStarted(startDate, today)

  if (notStarted) {
    return `${formatShortDate(startDate)} 시작 · ${formatGoalDeadline(endDate, today)}`
  }

  if (remaining <= 0) {
    const over = Math.abs(remaining)
    if (ended) return over > 0 ? `달성 · ${formatMesoKorean(over)} 초과` : '달성'
    return over > 0 ? `${formatMesoKorean(over)} 초과 달성` : '목표 달성'
  }

  if (ended) {
    return `미달성 · ${formatMesoKorean(remaining)} 부족`
  }

  if (netProfit < 0) {
    const parts = [`적자 ${formatMesoKorean(Math.abs(netProfit))}`, `${formatMesoKorean(remaining)} 남음`]
    if (daysLeft > 0 && dailyNeeded != null) {
      parts.push(formatGoalDeadline(endDate, today), `하루 약 ${formatMesoKorean(dailyNeeded)}`)
    } else if (daysLeft === 0) {
      parts.push('D-day')
    }
    return parts.join(' · ')
  }

  const parts = [`${formatMesoKorean(remaining)} 남음`]
  if (daysLeft > 0 && dailyNeeded != null) {
    parts.push(formatGoalDeadline(endDate, today), `하루 약 ${formatMesoKorean(dailyNeeded)}`)
  } else if (daysLeft === 0) {
    parts.push('D-day')
  }
  return parts.join(' · ')
}

export function goalPercentTone(percent: number): string {
  if (percent >= 100) return 'text-emerald-400'
  if (percent < 0) return 'text-red-400'
  return 'text-cyber-400'
}

export function goalBarClass(percent: number): string {
  if (percent >= 100) return 'bg-gradient-to-r from-emerald-600 to-emerald-400'
  if (percent < 0) return 'bg-gradient-to-r from-red-700 to-red-500'
  return 'bg-gradient-to-r from-cyber-600 to-maple-500'
}

export function goalOverlapsMonth(startDate: string, endDate: string, monthKey: string): boolean {
  const monthStart = `${monthKey}-01`
  const [y, m] = monthKey.split('-').map(Number)
  const monthEnd = `${monthKey}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
  return startDate <= monthEnd && endDate >= monthStart
}
