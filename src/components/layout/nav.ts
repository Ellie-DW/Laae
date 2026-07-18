import type { Page } from '../../types'

export const NAV_ITEMS: { id: Page; label: string }[] = [
  { id: 'dashboard', label: '대시보드' },
  { id: 'diary', label: '다이어리' },
  { id: 'hunt', label: '사냥' },
  { id: 'expense', label: '장부' },
  { id: 'boss', label: '보스' },
  { id: 'drop', label: '드랍' },
  { id: 'gather', label: '채집' },
  { id: 'goals', label: '목표' },
  { id: 'rice', label: '쌀곳간' },
]

export function getNavItems(hasRiceAccess: boolean) {
  return hasRiceAccess ? NAV_ITEMS : NAV_ITEMS.filter((item) => item.id !== 'rice')
}
