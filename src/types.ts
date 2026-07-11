export type Page = 'dashboard' | 'diary' | 'hunt' | 'expense' | 'boss' | 'drop' | 'gather' | 'analytics' | 'goals'

export type BossTab = 'grandis' | 'belowSword' | 'normal'

export type BossResetCycle = 'weekly' | 'monthly'

export type BossDifficulty = 'EASY' | 'NORMAL' | 'HARD' | 'EXTREME' | 'CHAOS'

export interface Character {
  id: string
  name: string
  sortOrder: number
  createdAt: string
}

export interface BossDifficultyReward {
  difficulty: BossDifficulty
  meso: number
}

export interface BossDefinition {
  id: string
  name: string
  shortName: string
  tab: BossTab
  group: string
  maxParty: number
  resetCycle?: BossResetCycle
  difficulties: BossDifficultyReward[]
}

export interface BossSelection {
  bossId: string
  difficulty: BossDifficulty
  partySize: number
  /** 선택된 난이도 (계획) */
  checked: boolean
}

export interface DropItem {
  id: string
  name: string
  meso: number
  checked: boolean
}

export interface CharacterBossData {
  selections: BossSelection[]
  dropItems: DropItem[]
  /** @deprecated weeklyClearedPeriodStart 사용 */
  bossesCleared?: boolean
  bossesClearedAt?: string | null
  /** 이번 주(목~수) 잡음 체크 여부 — 매주 목요일 초기화 */
  weeklyClearedPeriodStart?: string | null
  /** 이번 달 잡음 체크 여부 — 매월 1일 초기화 */
  monthlyClearedPeriodStart?: string | null
}

export type ExpenseCategory = 'purchase' | 'enhancement' | 'consumable' | 'other'

export interface Expense {
  id: string
  characterId: string
  category: ExpenseCategory
  amount: number
  memo: string | null
  recordDate: string
  createdAt: string
}

export interface HuntRecord {
  id: string
  characterId: string
  meso: number
  solErdaFragments: number
  recordDate: string
  createdAt: string
}

export interface GatherRecord {
  id: string
  characterId: string
  itemName: string
  meso: number
  memo: string | null
  recordDate: string
  createdAt: string
}

export interface DropRecord {
  id: string
  characterId: string
  itemName: string
  meso: number
  memo: string | null
  recordDate: string
  createdAt: string
}

export interface Goal {
  id: string
  characterId: string | null
  title: string
  targetMeso: number
  startDate: string
  endDate: string
  createdAt: string
}

export interface BossSnapshot {
  id: string
  characterId: string
  cycle: BossResetCycle
  periodStart: string
  periodEnd: string
  bossData: CharacterBossData
  totalMeso: number
  createdAt: string
}

export interface DiaryNote {
  id: string
  characterId: string | null
  recordDate: string
  memo: string
  createdAt: string
  updatedAt: string
}
