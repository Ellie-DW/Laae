import type { Page } from '../../types'

export const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: '대시보드', icon: '📊' },
  { id: 'diary', label: '다이어리', icon: '📔' },
  { id: 'hunt', label: '사냥', icon: '⚔️' },
  { id: 'expense', label: '지출', icon: '💸' },
  { id: 'boss', label: '보스', icon: '👹' },
  { id: 'drop', label: '드랍', icon: '💎' },
  { id: 'gather', label: '채집', icon: '🌿' },
  { id: 'analytics', label: '분석', icon: '📈' },
  { id: 'goals', label: '목표', icon: '🎯' },
]
