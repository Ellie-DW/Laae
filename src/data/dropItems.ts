import type { DropItem } from '../types'

export interface PredefinedDropItem {
  id: string
  name: string
  group: string
}

export const PREDEFINED_DROP_ITEMS: PredefinedDropItem[] = [
  { id: 'genesis-badge', name: '창세의 뱃지', group: '장비' },
  { id: 'origin-of-pain', name: '고통의 근원', group: '장비' },
  { id: 'great-terror', name: '거대한 공포', group: '장비' },
  { id: 'cursed-grimoire-box', name: '저주받은 마도서 선택 상자', group: '장비' },
  { id: 'dream-belt', name: '몽환의 벨트', group: '장비' },
  { id: 'magic-blindfold', name: '마력이 깃든 안대', group: '장비' },
  { id: 'loose-control-mark', name: '루즈 컨트롤 머신 마크', group: '장비' },
  { id: 'mitra-rage-box', name: '미트라의 분노 선택 상자', group: '장비' },
  { id: 'daybreak-pendant', name: '데이브레이크 펜던트', group: '악세서리' },
  { id: 'guardian-angel-ring', name: '가디언 엔젤 링', group: '악세서리' },
  { id: 'estella-earring', name: '에스텔라 이어링', group: '악세서리' },
  { id: 'twilight-mark', name: '트와일라이트 마크', group: '악세서리' },
  { id: 'restraint-ring-lv4', name: '리스트레인트 링 Lv4', group: '링' },
  { id: 'continuous-ring-lv4', name: '컨티뉴어스 링 Lv4', group: '링' },
  { id: 'life-polishing-stone', name: '생명의 연마석', group: '연마석' },
  { id: 'faith-polishing-stone', name: '신념의 연마석', group: '연마석' },
  { id: 'premium-accessory-coupon', name: '프리미엄 악세서리 주문서 선택권', group: '주문서' },
  { id: 'premium-pet-coupon', name: '프리미엄 펫장비 주문서 선택권', group: '주문서' },
  { id: 'magical-scroll-coupon', name: '매지컬 무기 주문서 교환권', group: '주문서' },
]

const DROP_NAME_ALIASES: Record<string, string> = {
  '저주받은 마도서 상자': '저주받은 마도서 선택 상자',
  '매지컬 주문서 선택권': '매지컬 무기 주문서 교환권',
}

export function normalizeDropItemName(name: string): string {
  return DROP_NAME_ALIASES[name] ?? name
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
  return groupOrder.map((group) => ({
    group,
    items: PREDEFINED_DROP_ITEMS.filter((i) => i.group === group).map((i) => itemById.get(i.id)!),
  }))
}

export function getAcquisitionCounts(drops: { characterId: string; itemName: string; meso: number }[], characterId: string) {
  const map = new Map<string, number>()
  for (const d of drops) {
    if (d.characterId !== characterId || d.meso > 0) continue
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
