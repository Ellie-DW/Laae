import type { DropItem } from '../types'

export interface PredefinedDropItem {
  id: string
  name: string
  group: string
}

export const PREDEFINED_DROP_ITEMS: PredefinedDropItem[] = [
  { id: 'origin-whisper', name: '근원의 속삭임', group: '광휘' },
  { id: 'immortal-legacy', name: '불멸의 유산', group: '광휘' },
  { id: 'arrogance-original-sin', name: '오만의 원죄', group: '광휘' },
  { id: 'death-oath', name: '죽음의 맹세', group: '광휘' },
  { id: 'ecstatic-nightmare', name: '황홀한 악몽', group: '광휘' },
  { id: 'starving-hollow-soul', name: '굶주리는 핏빛 원혼', group: '광휘' },
  { id: 'genesis-badge', name: '창세의 뱃지', group: '칠흑' },
  { id: 'origin-of-pain', name: '고통의 근원', group: '칠흑' },
  { id: 'great-terror', name: '거대한 공포', group: '칠흑' },
  { id: 'cursed-grimoire-box', name: '저주받은 마도서 선택 상자', group: '칠흑' },
  { id: 'dream-belt', name: '몽환의 벨트', group: '칠흑' },
  { id: 'magic-blindfold', name: '마력이 깃든 안대', group: '칠흑' },
  { id: 'loose-control-mark', name: '루즈 컨트롤 머신 마크', group: '칠흑' },
  { id: 'mitra-rage-box', name: '미트라의 분노 선택 상자', group: '칠흑' },
  { id: 'commander-force-earring', name: '커맨더 포스 이어링', group: '칠흑' },
  { id: 'complete-undercontrol', name: '컨플리트 언더컨트롤', group: '칠흑' },
  { id: 'chaos-black-accessory-box', name: '혼돈의 칠흑 장신구 상자', group: '칠흑' },
  { id: 'daybreak-pendant', name: '데이브레이크 펜던트', group: '여명' },
  { id: 'guardian-angel-ring', name: '가디언 엔젤 링', group: '여명' },
  { id: 'estella-earring', name: '에스텔라 이어링', group: '여명' },
  { id: 'twilight-mark', name: '트와일라이트 마크', group: '여명' },
  { id: 'willpower-eternelle-box', name: '의지의 에테르넬 방어구 상자', group: '에테르넬' },
  { id: 'omen-eternelle-box', name: '흉수의 에테르넬 방어구 상자', group: '에테르넬' },
  { id: 'desire-eternelle-box', name: '욕망의 에테르넬 방어구 상자', group: '에테르넬' },
  { id: 'oath-eternelle-box', name: '맹세의 에테르넬 방어구 상자', group: '에테르넬' },
  { id: 'ancient-eternelle-box', name: '고대의 에테르넬 방어구 상자', group: '에테르넬' },
  { id: 'illusion-eternelle-box', name: '환상의 에테르넬 방어구 상자', group: '에테르넬' },
  { id: 'longing-eternelle-box', name: '갈망의 에테르넬 방어구 상자', group: '에테르넬' },
  { id: 'madness-eternelle-box', name: '광기의 에테르넬 방어구 상자', group: '에테르넬' },
  { id: 'exceptional-hammer-belt', name: '익셉셔널 해머 (벨트)', group: '익셉셔널' },
  { id: 'exceptional-hammer-face', name: '익셉셔널 해머 (얼굴장식)', group: '익셉셔널' },
  { id: 'exceptional-hammer-eye', name: '익셉셔널 해머 (눈장식)', group: '익셉셔널' },
  { id: 'exceptional-hammer-ear', name: '익셉셔널 해머 (귀고리)', group: '익셉셔널' },
  { id: 'exceptional-hammer-medal', name: '익셉셔널 해머 (훈장)', group: '익셉셔널' },
  { id: 'restraint-ring-lv4', name: '리스트레인트 링 Lv4', group: '링' },
  { id: 'continuous-ring-lv4', name: '컨티뉴어스 링 Lv4', group: '링' },
  { id: 'green-jade-ring-box', name: '녹옥의 보스 반지 상자', group: '반지 상자' },
  { id: 'red-jade-ring-box', name: '홍옥의 보스 반지 상자', group: '반지 상자' },
  { id: 'black-jade-ring-box', name: '흑옥의 보스 반지 상자', group: '반지 상자' },
  { id: 'white-jade-ring-box', name: '백옥의 보스 반지 상자', group: '반지 상자' },
  { id: 'life-ring-box', name: '생명의 보스 반지 상자', group: '반지 상자' },
  { id: 'ring-box-miss', name: '미당첨', group: '반지 상자' },
  { id: 'life-polishing-stone', name: '생명의 연마석', group: '연마석' },
  { id: 'faith-polishing-stone', name: '신념의 연마석', group: '연마석' },
  { id: 'moonlight-potion', name: '영롱한 달빛 포션', group: '포션' },
  { id: 'premium-accessory-coupon', name: '프리미엄 악세서리 주문서 선택권', group: '주문서' },
  { id: 'premium-pet-coupon', name: '프리미엄 펫장비 주문서 선택권', group: '주문서' },
  { id: 'magical-scroll-coupon', name: '매지컬 무기 주문서 교환권', group: '주문서' },
]

const DROP_NAME_ALIASES: Record<string, string> = {
  '저주받은 마도서 상자': '저주받은 마도서 선택 상자',
  '매지컬 주문서 선택권': '매지컬 무기 주문서 교환권',
  '컴플리트 언더컨트롤': '컨플리트 언더컨트롤',
  '굶주리는 빛빈 원혼': '굶주리는 핏빛 원혼',
  '고대의 에테르넬 상자': '고대의 에테르넬 방어구 상자',
  '영롱한 달빛 포션 (익스트림)': '영롱한 달빛 포션',
  '특수형 에너지 코어(S)급': '특수형 에너지 코어(S급)',
  '녹옥 보스 반지 상자': '녹옥의 보스 반지 상자',
}

export function normalizeDropItemName(name: string): string {
  return DROP_NAME_ALIASES[name] ?? name
}

export const CHAOS_BLACK_BOX_NAME = '혼돈의 칠흑 장신구 상자'
export const BOX_OPEN_MEMO = '상자 개봉'
export const RING_MISS_NAME = '미당첨'

export const RING_BOX_NAMES = [
  '녹옥의 보스 반지 상자',
  '홍옥의 보스 반지 상자',
  '흑옥의 보스 반지 상자',
  '백옥의 보스 반지 상자',
  '생명의 보스 반지 상자',
] as const

const KNOWN_BOX_NAMES = new Set<string>([CHAOS_BLACK_BOX_NAME, ...RING_BOX_NAMES])

const CHAOS_BLACK_BOX_EXCLUDED = new Set([
  CHAOS_BLACK_BOX_NAME,
  '창세의 뱃지',
  '미트라의 분노 선택 상자',
  '컨플리트 언더컨트롤',
])

export function isRingBoxName(name: string) {
  return RING_BOX_NAMES.includes(normalizeDropItemName(name) as (typeof RING_BOX_NAMES)[number])
}

export function shortRingBoxName(name: string) {
  return normalizeDropItemName(name).replace('의 보스 반지 상자', '')
}

export function isOpenableBoxName(name: string) {
  const normalized = normalizeDropItemName(name)
  return normalized === CHAOS_BLACK_BOX_NAME || isRingBoxName(normalized)
}

export function isOpenedFromBox(memo: string | null | undefined) {
  return (memo ?? '').startsWith(BOX_OPEN_MEMO)
}

export function getChaosBlackBoxRewards() {
  return PREDEFINED_DROP_ITEMS.filter((item) => item.group === '칠흑' && !CHAOS_BLACK_BOX_EXCLUDED.has(item.name))
}

export function getRingBoxRewards(boxName?: string): PredefinedDropItem[] {
  const rewards = [
    PREDEFINED_DROP_ITEMS.find((item) => item.id === 'restraint-ring-lv4'),
    PREDEFINED_DROP_ITEMS.find((item) => item.id === 'continuous-ring-lv4'),
    normalizeDropItemName(boxName ?? '') === '생명의 보스 반지 상자'
      ? PREDEFINED_DROP_ITEMS.find((item) => item.id === 'life-polishing-stone')
      : undefined,
    PREDEFINED_DROP_ITEMS.find((item) => item.id === 'ring-box-miss'),
  ]
  return rewards.filter((item): item is PredefinedDropItem => item != null)
}

export function getBoxRewards(boxName: string) {
  const normalized = normalizeDropItemName(boxName)
  if (normalized === CHAOS_BLACK_BOX_NAME) return getChaosBlackBoxRewards()
  if (isRingBoxName(normalized)) return getRingBoxRewards(normalized)
  return []
}

export function parseBoxOpenMemo(memo: string | null | undefined) {
  if (!isOpenedFromBox(memo)) return null
  const raw = (memo ?? '').trim()
  if (raw === BOX_OPEN_MEMO) return { boxName: CHAOS_BLACK_BOX_NAME, note: '' }
  const rest = raw.replace(new RegExp(`^${BOX_OPEN_MEMO}\\s*·\\s*`), '')
  const idx = rest.indexOf(' · ')
  const first = idx === -1 ? rest : rest.slice(0, idx)
  const after = idx === -1 ? '' : rest.slice(idx + 3)
  if (KNOWN_BOX_NAMES.has(first)) return { boxName: first, note: after }
  return { boxName: CHAOS_BLACK_BOX_NAME, note: rest }
}

export function openedBoxName(memo: string | null | undefined) {
  return parseBoxOpenMemo(memo)?.boxName ?? null
}

export function withBoxOpenMemo(extra?: string | null, boxName?: string | null) {
  const parsedNote = extra?.trim()
  const note =
    !parsedNote || parsedNote === BOX_OPEN_MEMO
      ? ''
      : parsedNote.startsWith(BOX_OPEN_MEMO)
        ? stripBoxOpenMemo(parsedNote)
        : parsedNote
  const source = boxName && boxName !== CHAOS_BLACK_BOX_NAME ? boxName : null
  if (source && note) return `${BOX_OPEN_MEMO} · ${source} · ${note}`
  if (source) return `${BOX_OPEN_MEMO} · ${source}`
  if (note) return `${BOX_OPEN_MEMO} · ${note}`
  return BOX_OPEN_MEMO
}

export function stripBoxOpenMemo(memo: string | null | undefined) {
  return parseBoxOpenMemo(memo)?.note ?? ''
}

export function createDefaultDropItems(): DropItem[] {
  return PREDEFINED_DROP_ITEMS.map((item) => ({
    id: item.id,
    name: item.name,
    meso: 0,
    checked: false,
  }))
}

export function mergeDropItems(saved: DropItem[] = []): DropItem[] {
  const savedMap = new Map(saved.map((item) => [item.id, item]))
  return PREDEFINED_DROP_ITEMS.map((item) => {
    const existing = savedMap.get(item.id)
    return {
      id: item.id,
      name: item.name,
      meso: existing?.meso ?? 0,
      checked: existing?.checked ?? false,
    }
  })
}

export function getDropItemGroups(items: DropItem[]) {
  const groupOrder = [...new Set(PREDEFINED_DROP_ITEMS.map((i) => i.group))]
  const itemById = new Map(items.map((i) => [i.id, i]))
  return groupOrder
    .map((group) => ({
      group,
      items: PREDEFINED_DROP_ITEMS.filter((i) => i.group === group)
        .map((i) => itemById.get(i.id))
        .filter((i): i is DropItem => i != null),
    }))
    .filter((group) => group.items.length > 0)
}

export function getAcquisitionCounts(
  drops: { characterId: string; itemName: string; meso: number }[],
  characterId?: string
) {
  const map = new Map<string, number>()
  for (const d of drops) {
    if (characterId && d.characterId !== characterId) continue
    if (d.meso > 0) continue
    map.set(normalizeDropItemName(d.itemName), (map.get(normalizeDropItemName(d.itemName)) ?? 0) + 1)
  }
  return map
}

export function isPredefinedDropName(name: string) {
  return PREDEFINED_DROP_ITEMS.some((i) => i.name === name)
}

export interface DropItemStats {
  id: string
  name: string
  group: string
  held: number
  sold: number
  totalAcquired: number
  saleIncome: number
}

export function getDropItemStats(drops: { characterId: string; itemName: string; meso: number }[], characterId?: string) {
  const filtered = characterId ? drops.filter((d) => d.characterId === characterId) : drops

  return PREDEFINED_DROP_ITEMS.map((item) => {
    const itemDrops = filtered.filter((d) => normalizeDropItemName(d.itemName) === item.name)
    const held = itemDrops.filter((d) => d.meso === 0).length
    const sales = itemDrops.filter((d) => d.meso > 0)
    return {
      id: item.id,
      name: item.name,
      group: item.group,
      held,
      sold: sales.length,
      totalAcquired: held + sales.length,
      saleIncome: sales.reduce((s, d) => s + d.meso, 0),
    }
  })
}

export function getDropStatsSummary(stats: DropItemStats[]) {
  const heldKinds = stats.filter((s) => s.held > 0).length
  const heldTotal = stats.reduce((s, i) => s + i.held, 0)
  const acquiredKinds = stats.filter((s) => s.totalAcquired > 0).length
  const acquiredTotal = stats.reduce((s, i) => s + i.totalAcquired, 0)
  const saleIncome = stats.reduce((s, i) => s + i.saleIncome, 0)
  const soldTotal = stats.reduce((s, i) => s + i.sold, 0)
  return { heldKinds, heldTotal, acquiredKinds, acquiredTotal, saleIncome, soldTotal }
}
