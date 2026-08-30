import type { Page } from '../../types'

export const NAV_ITEMS: { id: Page; label: string }[] = [
  { id: 'dashboard', label: '대시보드' },
  { id: 'diary', label: '다이어리' },
  { id: 'hunt', label: '사냥' },
  { id: 'alert', label: '알리미' },
  { id: 'expense', label: '장부' },
  { id: 'boss', label: '보스' },
  { id: 'drop', label: '드랍' },
  { id: 'gather', label: '채집' },
  { id: 'goals', label: '목표' },
  { id: 'rice', label: '쌀곳간' },
  { id: 'premium', label: '프리미엄' },
  { id: 'yield', label: '수익률' },
]

export function getNavItems(access: {
  hasRiceAccess?: boolean
  hasPremiumAccess?: boolean
  hasYieldAccess?: boolean
} = {}) {
  const {
    hasRiceAccess = false,
    hasPremiumAccess = false,
    hasYieldAccess = false,
  } = access
  return NAV_ITEMS.filter((item) => {
    if (item.id === 'rice') return hasRiceAccess
    if (item.id === 'premium') return hasPremiumAccess
    if (item.id === 'yield') return hasYieldAccess
    return true
  })
}
