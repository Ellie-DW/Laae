import type { BossDifficulty } from '../types'
import { BOSSES } from './bosses'

export interface BossDropItem {
  name: string
  /** 개수가 정해진 보상 (에리온 조각, 재료 등) */
  qty?: number
}

export interface BossDropTable {
  bossId: string
  /** 해당 보스의 모든 난이도에서 나오는 보상만 */
  common: BossDropItem[]
  byDifficulty: Partial<Record<BossDifficulty, BossDropItem[]>>
}

const SCROLL_COUPON_DROPS: BossDropItem[] = [
  { name: '프리미엄 악세서리 주문서 선택권' },
  { name: '프리미엄 펫장비 주문서 선택권' },
  { name: '매지컬 무기 주문서 교환권' },
]

/** 2026-08-13 기준 보스 주요 보상 (벨로나 포함). 난이도 제한 아이템은 공통이 아니라 해당 난이도에만 넣음. */
export const BOSS_DROP_TABLES: BossDropTable[] = [
  {
    bossId: 'suu',
    common: [{ name: '특수형 에너지 코어(S급)' }],
    byDifficulty: {
      NORMAL: [{ name: '녹옥의 보스 반지 상자' }],
      HARD: [
        { name: '홍옥의 보스 반지 상자' },
        { name: '루즈 컨트롤 머신 마크' },
      ],
      EXTREME: [
        { name: '백옥의 보스 반지 상자' },
        { name: '루즈 컨트롤 머신 마크' },
        { name: '컨플리트 언더컨트롤' },
      ],
    },
  },
  {
    bossId: 'damien',
    common: [
      { name: '뒤틀린 낙인의 영혼석' },
      { name: '루인 포스실드' },
    ],
    byDifficulty: {
      NORMAL: [{ name: '녹옥의 보스 반지 상자' }],
      HARD: [
        { name: '홍옥의 보스 반지 상자' },
        { name: '마력이 깃든 안대' },
      ],
    },
  },
  {
    bossId: 'g-slime',
    common: [{ name: '가디언 엔젤 링' }],
    byDifficulty: {
      NORMAL: [{ name: '녹옥의 보스 반지 상자' }],
      CHAOS: [
        { name: '흑옥의 보스 반지 상자' },
        ...SCROLL_COUPON_DROPS,
      ],
    },
  },
  {
    bossId: 'lucid',
    common: [],
    byDifficulty: {
      EASY: [{ name: '녹옥의 보스 반지 상자' }],
      NORMAL: [
        { name: '나비날개 물방울석' },
        { name: '트와일라이트 마크' },
        { name: '녹옥의 보스 반지 상자' },
      ],
      HARD: [
        { name: '나비날개 물방울석' },
        { name: '트와일라이트 마크' },
        { name: '홍옥의 보스 반지 상자' },
        { name: '몽환의 벨트' },
      ],
    },
  },
  {
    bossId: 'will',
    common: [],
    byDifficulty: {
      EASY: [{ name: '녹옥의 보스 반지 상자' }],
      NORMAL: [
        { name: '코브웹 물방울석' },
        { name: '트와일라이트 마크' },
        { name: '녹옥의 보스 반지 상자' },
      ],
      HARD: [
        { name: '코브웹 물방울석' },
        { name: '트와일라이트 마크' },
        { name: '홍옥의 보스 반지 상자' },
        { name: '저주받은 마도서 선택 상자' },
        { name: '거울세계의 코어 젬스톤' },
      ],
    },
  },
  {
    bossId: 'gloom',
    common: [{ name: '에스텔라 이어링' }],
    byDifficulty: {
      NORMAL: [{ name: '녹옥의 보스 반지 상자' }],
      CHAOS: [
        { name: '흑옥의 보스 반지 상자' },
        { name: '거대한 공포' },
        ...SCROLL_COUPON_DROPS,
      ],
    },
  },
  {
    bossId: 'true-hilla',
    common: [
      { name: '데이브레이크 펜던트' },
    ],
    byDifficulty: {
      NORMAL: [{ name: '홍옥의 보스 반지 상자' }],
      HARD: [
        { name: '흑옥의 보스 반지 상자' },
        { name: '고통의 근원' },
        ...SCROLL_COUPON_DROPS,
      ],
    },
  },
  {
    bossId: 'darknell',
    common: [{ name: '에스텔라 이어링' }],
    byDifficulty: {
      NORMAL: [{ name: '녹옥의 보스 반지 상자' }],
      HARD: [
        { name: '흑옥의 보스 반지 상자' },
        { name: '커맨더 포스 이어링' },
        ...SCROLL_COUPON_DROPS,
      ],
    },
  },
  {
    bossId: 'black-mage',
    common: [
      ...SCROLL_COUPON_DROPS,
      { name: '백옥의 보스 반지 상자' },
      { name: '창세의 뱃지' },
    ],
    byDifficulty: {
      EXTREME: [{ name: '익셉셔널 해머 (벨트)' }],
    },
  },
  {
    bossId: 'seren',
    common: [{ name: '데이브레이크 펜던트' }, ...SCROLL_COUPON_DROPS],
    byDifficulty: {
      NORMAL: [{ name: '흑옥의 보스 반지 상자' }],
      HARD: [
        { name: '미트라의 코어 젬스톤' },
        { name: '백옥의 보스 반지 상자' },
        { name: '미트라의 분노 선택 상자' },
      ],
      EXTREME: [
        { name: '미트라의 코어 젬스톤' },
        { name: '백옥의 보스 반지 상자' },
        { name: '미트라의 분노 선택 상자' },
        { name: '익셉셔널 해머 (얼굴장식)' },
        { name: '에리온의 조각', qty: 30 },
        { name: '영롱한 달빛 포션' },
      ],
    },
  },
  {
    bossId: 'kalos',
    common: [...SCROLL_COUPON_DROPS],
    byDifficulty: {
      EASY: [{ name: '백옥의 보스 반지 상자' }],
      NORMAL: [
        { name: '생명의 연마석' },
        { name: '백옥의 보스 반지 상자' },
        { name: '남겨진 칼로스의 의지 조각', qty: 3 },
      ],
      CHAOS: [
        { name: '생명의 연마석' },
        { name: '생명의 보스 반지 상자' },
        { name: '남겨진 칼로스의 의지', qty: 5 },
        { name: '의지의 에테르넬 방어구 상자' },
      ],
      EXTREME: [
        { name: '생명의 연마석' },
        { name: '생명의 보스 반지 상자' },
        { name: '남겨진 칼로스의 의지', qty: 14 },
        { name: '의지의 에테르넬 방어구 상자' },
        { name: '익셉셔널 해머 (눈장식)' },
        { name: '에리온의 조각', qty: 180 },
        { name: '영롱한 달빛 포션' },
      ],
    },
  },
  {
    bossId: 'karing',
    common: [...SCROLL_COUPON_DROPS],
    byDifficulty: {
      EASY: [
        { name: '백옥의 보스 반지 상자' },
        { name: '뒤엉킨 흉수의 고리 조각', qty: 1 },
      ],
      NORMAL: [
        { name: '백옥의 보스 반지 상자' },
        { name: '뒤엉킨 흉수의 고리 조각', qty: 5 },
        { name: '혼돈의 칠흑 장신구 상자' },
        { name: '생명의 연마석' },
      ],
      HARD: [
        { name: '신념의 연마석' },
        { name: '생명의 보스 반지 상자' },
        { name: '뒤엉킨 흉수의 고리', qty: 7 },
        { name: '흉수의 에테르넬 방어구 상자' },
        { name: '혼돈의 칠흑 장신구 상자' },
        { name: '에리온의 조각', qty: 60 },
      ],
      EXTREME: [
        { name: '신념의 연마석' },
        { name: '생명의 보스 반지 상자' },
        { name: '뒤엉킨 흉수의 고리', qty: 18 },
        { name: '흉수의 에테르넬 방어구 상자' },
        { name: '익셉셔널 해머 (귀고리)' },
        { name: '혼돈의 칠흑 장신구 상자' },
        { name: '에리온의 조각', qty: 400 },
        { name: '영롱한 달빛 포션' },
      ],
    },
  },
  {
    bossId: 'limbo',
    common: [
      ...SCROLL_COUPON_DROPS,
      { name: '생명의 보스 반지 상자' },
      { name: '신념의 연마석' },
      { name: '혼돈의 칠흑 장신구 상자' },
    ],
    byDifficulty: {
      NORMAL: [{ name: '왜곡된 욕망의 결정', qty: 1 }],
      HARD: [
        { name: '왜곡된 욕망의 결정', qty: 2 },
        { name: '근원의 속삭임' },
        { name: '욕망의 에테르넬 방어구 상자' },
        { name: '에리온의 조각', qty: 60 },
      ],
    },
  },
  {
    bossId: 'baldrix',
    common: [
      ...SCROLL_COUPON_DROPS,
      { name: '생명의 보스 반지 상자' },
      { name: '신념의 연마석' },
      { name: '혼돈의 칠흑 장신구 상자' },
    ],
    byDifficulty: {
      NORMAL: [{ name: '영원한 충성의 흔적', qty: 1 }],
      HARD: [
        { name: '영원한 충성의 흔적', qty: 2 },
        { name: '죽음의 맹세' },
        { name: '맹세의 에테르넬 방어구 상자' },
        { name: '에리온의 조각', qty: 120 },
      ],
    },
  },
  {
    bossId: 'first-adversary',
    common: [...SCROLL_COUPON_DROPS],
    byDifficulty: {
      EASY: [{ name: '백옥의 보스 반지 상자' }],
      NORMAL: [
        { name: '생명의 연마석' },
        { name: '백옥의 보스 반지 상자' },
        { name: '이어진 고대의 결의 조각', qty: 4 },
      ],
      HARD: [
        { name: '생명의 연마석' },
        { name: '생명의 보스 반지 상자' },
        { name: '이어진 고대의 결의', qty: 6 },
        { name: '불멸의 유산' },
        { name: '고대의 에테르넬 방어구 상자' },
        { name: '에리온의 조각', qty: 30 },
      ],
      EXTREME: [
        { name: '생명의 연마석' },
        { name: '생명의 보스 반지 상자' },
        { name: '이어진 고대의 결의', qty: 16 },
        { name: '불멸의 유산' },
        { name: '고대의 에테르넬 방어구 상자' },
        { name: '익셉셔널 해머 (훈장)' },
        { name: '에리온의 조각', qty: 240 },
        { name: '영롱한 달빛 포션' },
      ],
    },
  },
  {
    bossId: 'brilliant-void',
    common: [...SCROLL_COUPON_DROPS, { name: '혼돈의 칠흑 장신구 상자' }],
    byDifficulty: {
      NORMAL: [
        { name: '백옥의 보스 반지 상자' },
        { name: '황홀한 환상의 단편 조각', qty: 6 },
        { name: '생명의 연마석' },
      ],
      HARD: [
        { name: '생명의 보스 반지 상자' },
        { name: '황홀한 환상의 단편', qty: 18 },
        { name: '황홀한 악몽' },
        { name: '환상의 에테르넬 방어구 상자' },
        { name: '에리온의 조각', qty: 90 },
        { name: '신념의 연마석' },
      ],
    },
  },
  {
    bossId: 'jupiter',
    common: [
      ...SCROLL_COUPON_DROPS,
      { name: '생명의 보스 반지 상자' },
      { name: '신념의 연마석' },
      { name: '혼돈의 칠흑 장신구 상자' },
    ],
    byDifficulty: {
      NORMAL: [
        { name: '뒤틀린 갈망의 편린', qty: 1 },
        { name: '에리온의 조각', qty: 45 },
      ],
      HARD: [
        { name: '뒤틀린 갈망의 편린', qty: 2 },
        { name: '오만의 원죄' },
        { name: '갈망의 에테르넬 방어구 상자' },
        { name: '에리온의 조각', qty: 360 },
      ],
    },
  },
  {
    bossId: 'bellona',
    common: [...SCROLL_COUPON_DROPS],
    byDifficulty: {
      EASY: [{ name: '백옥의 보스 반지 상자' }],
      NORMAL: [
        { name: '백옥의 보스 반지 상자' },
        { name: '저주받은 원혼의 잔재', qty: 1 },
        { name: '혼돈의 칠흑 장신구 상자' },
        { name: '생명의 연마석' },
      ],
      HARD: [
        { name: '생명의 보스 반지 상자' },
        { name: '저주받은 원혼의 잔재', qty: 2 },
        { name: '굶주리는 빛빈 원혼' },
        { name: '광기의 에테르넬 방어구 상자' },
        { name: '혼돈의 칠흑 장신구 상자' },
        { name: '에리온의 조각', qty: 100 },
        { name: '신념의 연마석' },
      ],
    },
  },
]

const tableByBossId = new Map(BOSS_DROP_TABLES.map((table) => [table.bossId, table]))

export function getBossDropTable(bossId: string) {
  return tableByBossId.get(bossId)
}

export function formatBossDropLabel(item: BossDropItem) {
  return item.qty != null ? `${item.name} ${item.qty}개` : item.name
}

export function getDropsForDifficulty(bossId: string, difficulty?: BossDifficulty | null) {
  const table = getBossDropTable(bossId)
  if (!table) return [] as BossDropItem[]
  const extra = difficulty ? table.byDifficulty[difficulty] ?? [] : []
  return [...table.common, ...extra]
}

export function getBossDropRows(bossId: string) {
  const table = getBossDropTable(bossId)
  if (!table) return [] as Array<{ key: string; label: string; items: BossDropItem[] }>
  const boss = BOSSES.find((b) => b.id === bossId)
  const rows: Array<{ key: string; label: string; items: BossDropItem[] }> = []
  if (table.common.length > 0) {
    rows.push({ key: 'common', label: '공통', items: table.common })
  }
  for (const diff of boss?.difficulties ?? []) {
    const items = table.byDifficulty[diff.difficulty]
    if (!items?.length) continue
    rows.push({ key: diff.difficulty, label: diff.difficulty, items })
  }
  return rows
}
