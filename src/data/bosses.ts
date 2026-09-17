import type { BossDefinition, BossDifficulty, BossResetCycle, BossRunnerPreset, BossTab } from '../types'

export const BOSS_TABS = [
  { id: 'grandis' as const, label: '그란디스', desc: '세렌부터 유피테르까지 그란디스 레이드 보스' },
  { id: 'belowSword' as const, label: '검밑솔', desc: '스우부터 검은 마법사까지 검밑솔 구간' },
  { id: 'normal' as const, label: '일반 보스', desc: '자쿰·루타비스 등 기본 주간 보스' },
]

const M = 1_000_000

export const BOSSES: BossDefinition[] = [
  // 그란디스
  { id: 'seren', name: '세렌', shortName: '세렌', tab: 'grandis', group: '그란디스', maxParty: 6,
    difficulties: [
      { difficulty: 'NORMAL', meso: 167 * M },
      { difficulty: 'HARD', meso: 302 * M },
      { difficulty: 'EXTREME', meso: 1840 * M },
    ] },
  { id: 'kalos', name: '칼로스', shortName: '칼로', tab: 'grandis', group: '그란디스', maxParty: 6,
    difficulties: [
      { difficulty: 'EASY', meso: 238 * M },
      { difficulty: 'NORMAL', meso: 479 * M },
      { difficulty: 'CHAOS', meso: 1230 * M },
      { difficulty: 'EXTREME', meso: 4104 * M },
    ] },
  { id: 'first-adversary', name: '최초의 대적자', shortName: '최초', tab: 'grandis', group: '그란디스', maxParty: 3,
    difficulties: [
      { difficulty: 'EASY', meso: 261 * M },
      { difficulty: 'NORMAL', meso: 532 * M },
      { difficulty: 'HARD', meso: 1390 * M },
      { difficulty: 'EXTREME', meso: 4712 * M },
    ] },
  { id: 'karing', name: '카링', shortName: '카링', tab: 'grandis', group: '그란디스', maxParty: 6,
    difficulties: [
      { difficulty: 'EASY', meso: 320 * M },
      { difficulty: 'NORMAL', meso: 576 * M },
      { difficulty: 'HARD', meso: 1560 * M },
      { difficulty: 'EXTREME', meso: 5387 * M },
    ] },
  { id: 'brilliant-void', name: '찬란한 흉성', shortName: '찬란', tab: 'grandis', group: '그란디스', maxParty: 3,
    difficulties: [
      { difficulty: 'NORMAL', meso: 593 * M },
      { difficulty: 'HARD', meso: 2678 * M },
    ] },
  { id: 'bellona', name: '벨로나', shortName: '벨로', tab: 'grandis', group: '그란디스', maxParty: 3,
    difficulties: [
      { difficulty: 'EASY', meso: 396 * M },
      { difficulty: 'NORMAL', meso: 824 * M },
      { difficulty: 'HARD', meso: 2950 * M },
    ] },
  { id: 'limbo', name: '림보', shortName: '림보', tab: 'grandis', group: '그란디스', maxParty: 3,
    difficulties: [
      { difficulty: 'NORMAL', meso: 995 * M },
      { difficulty: 'HARD', meso: 2385 * M },
    ] },
  { id: 'baldrix', name: '발드릭스', shortName: '발드', tab: 'grandis', group: '그란디스', maxParty: 3,
    difficulties: [
      { difficulty: 'NORMAL', meso: 1320 * M },
      { difficulty: 'HARD', meso: 3078 * M },
    ] },
  { id: 'jupiter', name: '유피테르', shortName: '유피', tab: 'grandis', group: '그란디스', maxParty: 3,
    difficulties: [
      { difficulty: 'NORMAL', meso: 1560 * M },
      { difficulty: 'HARD', meso: 4845 * M },
    ] },

  // 검밑솔
  { id: 'suu', name: '스우', shortName: '스우', tab: 'belowSword', group: '검밑솔', maxParty: 6,
    difficulties: [
      { difficulty: 'NORMAL', meso: 8.35 * M },
      { difficulty: 'HARD', meso: 48.9 * M },
      { difficulty: 'EXTREME', meso: 545 * M },
    ] },
  { id: 'damien', name: '데미안', shortName: '데미', tab: 'belowSword', group: '검밑솔', maxParty: 6,
    difficulties: [
      { difficulty: 'NORMAL', meso: 8.75 * M },
      { difficulty: 'HARD', meso: 46.4 * M },
    ] },
  { id: 'g-slime', name: '가디언 엔젤 슬라임', shortName: '가엔', tab: 'belowSword', group: '검밑솔', maxParty: 6,
    difficulties: [
      { difficulty: 'NORMAL', meso: 12.7 * M },
      { difficulty: 'CHAOS', meso: 71.3 * M },
    ] },
  { id: 'lucid', name: '루시드', shortName: '루시', tab: 'belowSword', group: '검밑솔', maxParty: 6,
    difficulties: [
      { difficulty: 'EASY', meso: 14.9 * M },
      { difficulty: 'NORMAL', meso: 17.8 * M },
      { difficulty: 'HARD', meso: 59.7 * M },
    ] },
  { id: 'will', name: '윌', shortName: '윌', tab: 'belowSword', group: '검밑솔', maxParty: 6,
    difficulties: [
      { difficulty: 'EASY', meso: 16.1 * M },
      { difficulty: 'NORMAL', meso: 20.5 * M },
      { difficulty: 'HARD', meso: 73.2 * M },
    ] },
  { id: 'gloom', name: '더스크', shortName: '더스', tab: 'belowSword', group: '검밑솔', maxParty: 6,
    difficulties: [
      { difficulty: 'NORMAL', meso: 22 * M },
      { difficulty: 'CHAOS', meso: 66.3 * M },
    ] },
  { id: 'true-hilla', name: '진 힐라', shortName: '진힐', tab: 'belowSword', group: '검밑솔', maxParty: 6,
    difficulties: [
      { difficulty: 'NORMAL', meso: 67.6 * M },
      { difficulty: 'HARD', meso: 100 * M },
    ] },
  { id: 'darknell', name: '듄켈', shortName: '듄켈', tab: 'belowSword', group: '검밑솔', maxParty: 6,
    difficulties: [
      { difficulty: 'NORMAL', meso: 23.7 * M },
      { difficulty: 'HARD', meso: 89.6 * M },
    ] },
  { id: 'black-mage', name: '검은 마법사', shortName: '검마', tab: 'belowSword', group: '검밑솔', maxParty: 6,
    resetCycle: 'monthly',
    difficulties: [
      { difficulty: 'HARD', meso: 665 * M },
      { difficulty: 'EXTREME', meso: 8740 * M },
    ] },

  // 일반 보스
  { id: 'zakum', name: '자쿰', shortName: '자쿰', tab: 'normal', group: '일반', maxParty: 6,
    difficulties: [
      { difficulty: 'CHAOS', meso: 404 * 10_000 },
    ] },
  { id: 'magnus', name: '매그너스', shortName: '매그', tab: 'normal', group: '일반', maxParty: 6,
    difficulties: [
      { difficulty: 'HARD', meso: 428 * 10_000 },
    ] },
  { id: 'papulatus', name: '파풀라투스', shortName: '파풀', tab: 'normal', group: '일반', maxParty: 6,
    difficulties: [
      { difficulty: 'CHAOS', meso: 6.55 * M },
    ] },
  { id: 'pierre', name: '피에르', shortName: '피에', tab: 'normal', group: '루타비스', maxParty: 6,
    difficulties: [
      { difficulty: 'CHAOS', meso: 4.08 * M },
    ] },
  { id: 'von-bon', name: '반반', shortName: '반반', tab: 'normal', group: '루타비스', maxParty: 6,
    difficulties: [
      { difficulty: 'CHAOS', meso: 4.07 * M },
    ] },
  { id: 'bloody-queen', name: '블러디퀸', shortName: '블퀸', tab: 'normal', group: '루타비스', maxParty: 6,
    difficulties: [
      { difficulty: 'CHAOS', meso: 4.07 * M },
    ] },
  { id: 'vellum', name: '벨룸', shortName: '벨룸', tab: 'normal', group: '루타비스', maxParty: 6,
    difficulties: [
      { difficulty: 'CHAOS', meso: 4.64 * M },
    ] },
]

export function getBossById(id: string) {
  return BOSSES.find((b) => b.id === id)
}

export function getBossesByTab(tab: BossDefinition['tab']) {
  return BOSSES.filter((b) => b.tab === tab)
}

export function getBossResetCycle(boss: BossDefinition): BossResetCycle {
  return boss.resetCycle ?? 'weekly'
}

export const RESET_CYCLE_INFO = {
  weekly: { label: '주간', desc: '매주 목요일 초기화' },
  monthly: { label: '월간', desc: '매월 1일 초기화' },
} as const

export type BossRunnerPresetPick = {
  bossId: string
  difficulty: BossDifficulty
  partySize?: number
}

const BELOW_SWORD_CORE: BossRunnerPresetPick[] = [
  { bossId: 'suu', difficulty: 'HARD' },
  { bossId: 'damien', difficulty: 'HARD' },
  { bossId: 'g-slime', difficulty: 'CHAOS' },
  { bossId: 'lucid', difficulty: 'HARD' },
  { bossId: 'will', difficulty: 'HARD' },
  { bossId: 'gloom', difficulty: 'CHAOS' },
  { bossId: 'true-hilla', difficulty: 'HARD' },
  { bossId: 'darknell', difficulty: 'HARD' },
]

const BELOW_SWORD_CORE_NO_SLIME = BELOW_SWORD_CORE.filter((boss) => boss.bossId !== 'g-slime')

const BLACK_MAGE_HARD: BossRunnerPresetPick = { bossId: 'black-mage', difficulty: 'HARD' }

/** 돌이 프리셋별 보스 루트. 하세는 주간 12마리 1인 + 월간 검마 1인 */
export const BOSS_RUNNER_PRESETS: Record<BossRunnerPreset, BossRunnerPresetPick[]> = {
  belowSword: [
    { bossId: 'magnus', difficulty: 'HARD' },
    { bossId: 'papulatus', difficulty: 'CHAOS' },
    { bossId: 'bloody-queen', difficulty: 'CHAOS' },
    { bossId: 'vellum', difficulty: 'CHAOS' },
    ...BELOW_SWORD_CORE,
    BLACK_MAGE_HARD,
  ],
  hardSeren: [
    { bossId: 'papulatus', difficulty: 'CHAOS', partySize: 1 },
    { bossId: 'suu', difficulty: 'HARD', partySize: 1 },
    { bossId: 'damien', difficulty: 'HARD', partySize: 1 },
    { bossId: 'g-slime', difficulty: 'CHAOS', partySize: 1 },
    { bossId: 'lucid', difficulty: 'HARD', partySize: 1 },
    { bossId: 'will', difficulty: 'HARD', partySize: 1 },
    { bossId: 'gloom', difficulty: 'CHAOS', partySize: 1 },
    { bossId: 'true-hilla', difficulty: 'HARD', partySize: 1 },
    { bossId: 'darknell', difficulty: 'HARD', partySize: 1 },
    { bossId: 'seren', difficulty: 'HARD', partySize: 1 },
    { bossId: 'kalos', difficulty: 'EASY', partySize: 1 },
    { bossId: 'first-adversary', difficulty: 'EASY', partySize: 1 },
    { bossId: 'black-mage', difficulty: 'HARD', partySize: 1 },
  ],
  transcendent: [
    { bossId: 'papulatus', difficulty: 'CHAOS' },
    ...BELOW_SWORD_CORE,
    { bossId: 'seren', difficulty: 'NORMAL' },
    { bossId: 'kalos', difficulty: 'EASY' },
    { bossId: 'first-adversary', difficulty: 'EASY' },
    BLACK_MAGE_HARD,
  ],
  easyKaring: [
    ...BELOW_SWORD_CORE,
    { bossId: 'seren', difficulty: 'HARD' },
    { bossId: 'kalos', difficulty: 'EASY' },
    { bossId: 'first-adversary', difficulty: 'EASY' },
    { bossId: 'karing', difficulty: 'EASY' },
    BLACK_MAGE_HARD,
  ],
  easyBellona: [
    ...BELOW_SWORD_CORE_NO_SLIME,
    { bossId: 'seren', difficulty: 'HARD' },
    { bossId: 'kalos', difficulty: 'EASY' },
    { bossId: 'first-adversary', difficulty: 'EASY' },
    { bossId: 'karing', difficulty: 'EASY' },
    { bossId: 'bellona', difficulty: 'EASY' },
    BLACK_MAGE_HARD,
  ],
  normalVoidDuo: [
    { bossId: 'suu', difficulty: 'EXTREME', partySize: 2 },
    { bossId: 'lucid', difficulty: 'HARD', partySize: 1 },
    { bossId: 'will', difficulty: 'HARD', partySize: 1 },
    { bossId: 'gloom', difficulty: 'CHAOS', partySize: 1 },
    { bossId: 'true-hilla', difficulty: 'HARD', partySize: 1 },
    { bossId: 'darknell', difficulty: 'HARD', partySize: 1 },
    { bossId: 'seren', difficulty: 'HARD', partySize: 1 },
    { bossId: 'kalos', difficulty: 'NORMAL', partySize: 1 },
    { bossId: 'first-adversary', difficulty: 'NORMAL', partySize: 1 },
    { bossId: 'karing', difficulty: 'EASY', partySize: 1 },
    { bossId: 'brilliant-void', difficulty: 'NORMAL', partySize: 2 },
    { bossId: 'bellona', difficulty: 'EASY', partySize: 1 },
    { bossId: 'black-mage', difficulty: 'HARD', partySize: 1 },
  ],
}

export const BOSS_RUNNER_PRESET_OPTIONS: Array<{
  id: BossRunnerPreset
  label: string
  tab: BossTab
  buttonClass: string
}> = [
  {
    id: 'belowSword',
    label: '검밑솔 돌이',
    tab: 'normal',
    buttonClass:
      'bg-maple-600/20 text-maple-300 border border-maple-500/40 hover:bg-maple-600/30 hover:border-maple-400/50',
  },
  {
    id: 'transcendent',
    label: '이적자 돌이',
    tab: 'grandis',
    buttonClass:
      'bg-cyber-600/20 text-cyber-300 border border-cyber-500/40 hover:bg-cyber-600/30 hover:border-cyber-400/50',
  },
  {
    id: 'hardSeren',
    label: '하세 돌이',
    tab: 'grandis',
    buttonClass:
      'bg-amber-600/20 text-amber-300 border border-amber-500/40 hover:bg-amber-600/30 hover:border-amber-400/50',
  },
  {
    id: 'easyKaring',
    label: '이카돌이',
    tab: 'grandis',
    buttonClass:
      'bg-violet-600/20 text-violet-300 border border-violet-500/40 hover:bg-violet-600/30 hover:border-violet-400/50',
  },
  {
    id: 'easyBellona',
    label: '이지벨로나돌이',
    tab: 'grandis',
    buttonClass:
      'bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30 hover:border-rose-400/50',
  },
  {
    id: 'normalVoidDuo',
    label: '노말흉성2인돌이',
    tab: 'grandis',
    buttonClass:
      'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/30 hover:border-indigo-400/50',
  },
]
