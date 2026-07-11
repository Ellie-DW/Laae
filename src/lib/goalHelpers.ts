import type { GoalProgress } from './ledgerAnalytics'
import { formatMesoKorean } from '../utils'

export function formatGoalPace(progress: GoalProgress): string {
  const { remaining, daysLeft, dailyNeeded, netProfit } = progress

  if (remaining <= 0) {
    const over = Math.abs(remaining)
    return over > 0 ? `${formatMesoKorean(over)} 초과 달성` : '목표 달성'
  }

  if (netProfit < 0) {
    const parts = [`적자 ${formatMesoKorean(Math.abs(netProfit))}`, `${formatMesoKorean(remaining)} 남음`]
    if (daysLeft > 0 && dailyNeeded != null) {
      parts.push(`D-${daysLeft}`, `하루 약 ${formatMesoKorean(dailyNeeded)}`)
    } else if (daysLeft === 0) {
      parts.push('오늘 마감')
    }
    return parts.join(' · ')
  }

  const parts = [`${formatMesoKorean(remaining)} 남음`]
  if (daysLeft > 0 && dailyNeeded != null) {
    parts.push(`D-${daysLeft}`, `하루 약 ${formatMesoKorean(dailyNeeded)}`)
  } else if (daysLeft === 0) {
    parts.push('오늘 마감')
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
