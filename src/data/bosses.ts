import type { BossDefinition, BossResetCycle } from '../types'

export const BOSS_TABS = [
  { id: 'grandis' as const, label: '그란디스', desc: '세렌부터 유피테르까지 그란디스 레이드 보스' },
  { id: 'belowSword' as const, label: '검밑솔', desc: '스우부터 검은 마법사까지 검밑솔 구간' },
  { id: 'normal' as const, label: '일반 보스', desc: '자쿰·루타비스·반레온 등 기본 주간 보스' },
]

const M = 1_000_000

export const BOSSES: BossDefinition[] = [
  // 그란디스
  { id: 'seren', name: '세렌', shortName: '세렌', tab: 'grandis', group: '그란디스', maxParty: 6,
    difficulties: [
      { difficulty: 'NORMAL', meso: 239 * M },
      { difficulty: 'HARD', meso: 356 * M },
      { difficulty: 'EXTREME', meso: 2835 * M },
    ] },
  { id: 'kalos', name: '칼로스', shortName: '칼로', tab: 'grandis', group: '그란디스', maxParty: 6,
    difficulties: [
      { difficulty: 'EASY', meso: 280 * M },
      { difficulty: 'NORMAL', meso: 505 * M },
      { difficulty: 'CHAOS', meso: 1273 * M },
      { difficulty: 'EXTREME', meso: 4104 * M },
    ] },
  { id: 'first-adversary', name: '최초의 대적자', shortName: '최초', tab: 'grandis', group: '그란디스', maxParty: 3,
    difficulties: [
      { difficulty: 'EASY', meso: 308 * M },
      { difficulty: 'NORMAL', meso: 560 * M },
      { difficulty: 'HARD', meso: 1435 * M },
      { difficulty: 'EXTREME', meso: 4712 * M },
    ] },
  { id: 'karing', name: '카링', shortName: '카링', tab: 'grandis', group: '그란디스', maxParty: 6,
    difficulties: [
      { difficulty: 'EASY', meso: 377 * M },
      { difficulty: 'NORMAL', meso: 678 * M },
      { difficulty: 'HARD', meso: 1739 * M },
      { difficulty: 'EXTREME', meso: 5387 * M },
    ] },
  { id: 'brilliant-void', name: '찬란한 흉성', shortName: '찬란', tab: 'grandis', group: '그란디스', maxParty: 3,
    difficulties: [
      { difficulty: 'NORMAL', meso: 625 * M },
      { difficulty: 'HARD', meso: 2678 * M },
    ] },
  { id: 'limbo', name: '림보', shortName: '림보', tab: 'grandis', group: '그란디스', maxParty: 3,
    difficulties: [
      { difficulty: 'NORMAL', meso: 1026 * M },
      { difficulty: 'HARD', meso: 2385 * M },
    ] },
  { id: 'baldrix', name: '발드릭스', shortName: '발드', tab: 'grandis', group: '그란디스', maxParty: 3,
    difficulties: [
      { difficulty: 'NORMAL', meso: 1368 * M },
      { difficulty: 'HARD', meso: 3078 * M },
    ] },
  { id: 'jupiter', name: '유피테르', shortName: '유피', tab: 'grandis', group: '그란디스', maxParty: 3,
    difficulties: [
      { difficulty: 'NORMAL', meso: 1615 * M },
      { difficulty: 'HARD', meso: 4845 * M },
    ] },

  // 검밑솔
  { id: 'suu', name: '스우', shortName: '스우', tab: 'belowSword', group: '검밑솔', maxParty: 6,
    difficulties: [
      { difficulty: 'NORMAL', meso: 16.7 * M },
      { difficulty: 'HARD', meso: 51.5 * M },
      { difficulty: 'EXTREME', meso: 574 * M },
    ] },
  { id: 'damien', name: '데미안', shortName: '데미', tab: 'belowSword', group: '검밑솔', maxParty: 6,
    difficulties: [
      { difficulty: 'NORMAL', meso: 17.5 * M },
      { difficulty: 'HARD', meso: 48.9 * M },
    ] },
  { id: 'g-slime', name: '가디언 엔젤 슬라임', shortName: '가엔', tab: 'belowSword', group: '검밑솔', maxParty: 6,
    difficulties: [
      { difficulty: 'NORMAL', meso: 25.5 * M },
      { difficulty: 'CHAOS', meso: 75.1 * M },
    ] },
  { id: 'gloom', name: '더스크', shortName: '더스', tab: 'belowSword', group: '검밑솔', maxParty: 6,
    difficulties: [
      { difficulty: 'NORMAL', meso: 44 * M },
      { difficulty: 'CHAOS', meso: 69.8 * M },
    ] },
  { id: 'will', name: '윌', shortName: '윌', tab: 'belowSword', group: '검밑솔', maxParty: 6,
    difficulties: [
      { difficulty: 'EASY', meso: 32.3 * M },
      { difficulty: 'NORMAL', meso: 41.1 * M },
      { difficulty: 'HARD', meso: 77.1 * M },
    ] },
  { id: 'lucid', name: '루시드', shortName: '루시', tab: 'belowSword', group: '검밑솔', maxParty: 6,
    difficulties: [
      { difficulty: 'EASY', meso: 29.8 * M },
      { difficulty: 'NORMAL', meso: 35.6 * M },
      { difficulty: 'HARD', meso: 62.9 * M },
    ] },
  { id: 'darknell', name: '듄켈', shortName: '듄켈', tab: 'belowSword', group: '검밑솔', maxParty: 6,
    difficulties: [
      { difficulty: 'NORMAL', meso: 47.5 * M },
      { difficulty: 'HARD', meso: 94.4 * M },
    ] },
  { id: 'true-hilla', name: '진 힐라', shortName: '진힐', tab: 'belowSword', group: '검밑솔', maxParty: 6,
    difficulties: [
      { difficulty: 'NORMAL', meso: 71.2 * M },
      { difficulty: 'HARD', meso: 106 * M },
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
      { difficulty: 'CHAOS', meso: 15 * M },
    ] },
  { id: 'magnus', name: '매그너스', shortName: '매그', tab: 'normal', group: '일반', maxParty: 6,
    difficulties: [
      { difficulty: 'HARD', meso: 35 * M },
    ] },
  { id: 'papulatus', name: '파풀라투스', shortName: '파풀', tab: 'normal', group: '일반', maxParty: 6,
    difficulties: [
      { difficulty: 'CHAOS', meso: 13.1 * M },
    ] },
  { id: 'pierre', name: '피에르', shortName: '피에', tab: 'normal', group: '루타비스', maxParty: 6,
    difficulties: [
      { difficulty: 'CHAOS', meso: 8.17 * M },
    ] },
  { id: 'von-bon', name: '반반', shortName: '반반', tab: 'normal', group: '루타비스', maxParty: 6,
    difficulties: [
      { difficulty: 'CHAOS', meso: 8.15 * M },
    ] },
  { id: 'bloody-queen', name: '블러디퀸', shortName: '블퀸', tab: 'normal', group: '루타비스', maxParty: 6,
    difficulties: [
      { difficulty: 'CHAOS', meso: 8.14 * M },
    ] },
  { id: 'vellum', name: '벨룸', shortName: '벨룸', tab: 'normal', group: '루타비스', maxParty: 6,
    difficulties: [
      { difficulty: 'CHAOS', meso: 9.28 * M },
    ] },
  { id: 'von-leon', name: '반레온', shortName: '반레', tab: 'normal', group: '일반', maxParty: 6,
    difficulties: [
      { difficulty: 'HARD', meso: 1.07 * M },
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
