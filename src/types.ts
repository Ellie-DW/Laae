export type Page = 'dashboard' | 'diary' | 'hunt' | 'expense' | 'boss' | 'drop' | 'gather' | 'goals' | 'rice'

export type BossTab = 'grandis' | 'belowSword' | 'normal'

/** 검밑솔 돌이 / 이적자 돌이 주간 루트 프리셋 */
export type BossRunnerPreset = 'belowSword' | 'transcendent'

export type BossResetCycle = 'weekly' | 'monthly'

export type BossDifficulty = 'EASY' | 'NORMAL' | 'HARD' | 'EXTREME' | 'CHAOS'

export interface Character {
  id: string
  name: string
  sortOrder: number
  createdAt: string
  nexonOcid?: string | null
  nexonProfile?: NexonCharacterProfile | null
  nexonSyncedAt?: string | null
}

/** Nexon Open API 캐릭터 기본 정보 (maplestory/v1/character/basic) */
export interface NexonCharacterProfile {
  character_name: string
  world_name: string
  character_gender: string
  character_class: string
  character_class_level: string
  character_level: number
  character_exp: number
  character_exp_rate: string
  character_guild_name: string | null
  character_image: string
  character_date_create: string
  access_flag: string
  liberation_quest_clear: string
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

/** 쌀먹(현금 거래) 수익 기록 */
export interface RiceRecord {
  id: string
  characterId: string | null
  amount: number
  mesoSold: number | null
  wonPerEok: number | null
  description: string
  memo: string | null
  recordDate: string
  createdAt: string
}
