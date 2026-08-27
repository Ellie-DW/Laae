import type { BossDifficulty, BossSnapshot, CharacterBossData, DropRecord } from '../types'
import { BOSSES, getBossResetCycle } from '../data/bosses'
import { BOSS_DROP_TABLES, getBossDropTable } from '../data/bossDrops'
import {
  PREDEFINED_DROP_ITEMS,
  RING_MISS_NAME,
  getBoxRewards,
  isOpenedFromBox,
  isOpenableBoxName,
  normalizeDropItemName,
  openedBoxName,
} from '../data/dropItems'
import { getMonthlyPeriod, getWeeklyPeriod } from '../utils'
import { isMonthlyBossCleared, isWeeklyBossCleared } from './bossStats'

export const DIFFICULTY_ORDER: BossDifficulty[] = ['EASY', 'NORMAL', 'HARD', 'CHAOS', 'EXTREME']

export function sortDifficulties(diffs: BossDifficulty[]) {
  return [...new Set(diffs)].sort(
    (a, b) => DIFFICULTY_ORDER.indexOf(a) - DIFFICULTY_ORDER.indexOf(b)
  )
}

export function formatDifficultyList(diffs: BossDifficulty[]) {
  return sortDifficulties(diffs).join(' · ')
}

export function clearCountKey(bossId: string, difficulty: BossDifficulty) {
  return `${bossId}:${difficulty}`
}

export interface DropItemSource {
  bossId: string
  difficulty: BossDifficulty
}

function selectionCycle(sel: CharacterBossData['selections'][0]) {
  const boss = BOSSES.find((b) => b.id === sel.bossId)
  return boss ? getBossResetCycle(boss) : ('weekly' as const)
}

function addClear(counts: Map<string, number>, bossId: string, difficulty: BossDifficulty) {
  const key = clearCountKey(bossId, difficulty)
  counts.set(key, (counts.get(key) ?? 0) + 1)
}

function sumKills(counts: Map<string, number>, sources: DropItemSource[]) {
  return sources.reduce((sum, source) => sum + (counts.get(clearCountKey(source.bossId, source.difficulty)) ?? 0), 0)
}

function compareDifficultyGroups(a: BossDifficulty[], b: BossDifficulty[]) {
  if (a.length !== b.length) return a.length - b.length
  for (let i = 0; i < a.length; i++) {
    const d = DIFFICULTY_ORDER.indexOf(a[i]) - DIFFICULTY_ORDER.indexOf(b[i])
    if (d) return d
  }
  return 0
}

/** 스냅샷은 잡음 체크 시점에 저장되므로, 해당 주기에서 선택된 보스·난이도를 1회로 센다. */
export function getBossClearCounts(
  snapshots: BossSnapshot[],
  characterIds: string[],
  bossDataMap: Record<string, CharacterBossData>
): Map<string, number> {
  const counts = new Map<string, number>()
  const week = getWeeklyPeriod()
  const month = getMonthlyPeriod()

  for (const characterId of characterIds) {
    const charSnaps = snapshots.filter((s) => s.characterId === characterId)

    for (const snapshot of charSnaps) {
      for (const sel of snapshot.bossData.selections) {
        if (!sel.checked) continue
        if (selectionCycle(sel) !== snapshot.cycle) continue
        addClear(counts, sel.bossId, sel.difficulty)
      }
    }

    const live = bossDataMap[characterId]
    if (!live) continue

    const hasWeekSnap = charSnaps.some((s) => s.cycle === 'weekly' && s.periodStart === week.start)
    const hasMonthSnap = charSnaps.some((s) => s.cycle === 'monthly' && s.periodStart === month.start)

    if (isWeeklyBossCleared(live) && !hasWeekSnap) {
      for (const sel of live.selections) {
        if (sel.checked && selectionCycle(sel) === 'weekly') addClear(counts, sel.bossId, sel.difficulty)
      }
    }
    if (isMonthlyBossCleared(live) && !hasMonthSnap) {
      for (const sel of live.selections) {
        if (sel.checked && selectionCycle(sel) === 'monthly') addClear(counts, sel.bossId, sel.difficulty)
      }
    }
  }

  return counts
}

/** 추적 아이템이 실제로 나오는 보스·난이도. 공통 드랍은 그 보스의 모든 난이도에 넣음. */
export function getDropItemSources(): Map<string, DropItemSource[]> {
  const byItem = new Map<string, Map<string, DropItemSource>>()
  const tracked = new Set(PREDEFINED_DROP_ITEMS.map((item) => item.name))

  const add = (itemName: string, bossId: string, difficulty: BossDifficulty) => {
    const name = normalizeDropItemName(itemName)
    if (!tracked.has(name)) return
    const key = clearCountKey(bossId, difficulty)
    const map = byItem.get(name) ?? new Map<string, DropItemSource>()
    map.set(key, { bossId, difficulty })
    byItem.set(name, map)
  }

  for (const table of BOSS_DROP_TABLES) {
    const boss = BOSSES.find((b) => b.id === table.bossId)
    if (!boss) continue
    const allDiffs = boss.difficulties.map((d) => d.difficulty)

    for (const item of table.common) {
      for (const difficulty of allDiffs) add(item.name, table.bossId, difficulty)
    }
    for (const [difficulty, items] of Object.entries(table.byDifficulty)) {
      for (const item of items ?? []) add(item.name, table.bossId, difficulty as BossDifficulty)
    }
  }

  return new Map([...byItem.entries()].map(([name, map]) => [name, [...map.values()]]))
}

export function formatDropSourceLabel(
  sources: DropItemSource[],
  bossNameById: Record<string, string>
) {
  const byBoss = new Map<string, BossDifficulty[]>()
  for (const source of sources) {
    const list = byBoss.get(source.bossId) ?? []
    list.push(source.difficulty)
    byBoss.set(source.bossId, list)
  }

  return [...byBoss.entries()]
    .map(([bossId, diffs]) => `${bossNameById[bossId] ?? bossId} ${formatDifficultyList(diffs)}`)
    .join(' · ')
}

export function formatDropRecordSource(record: {
  bossId?: string | null
  difficulty?: BossDifficulty | null
}) {
  if (!record.bossId || !record.difficulty) return null
  const boss = BOSSES.find((b) => b.id === record.bossId)
  return `${boss?.shortName ?? record.bossId} ${record.difficulty}`
}

export function getTrackedItemsForSource(bossId: string, difficulty: BossDifficulty) {
  const sourcesByItem = getDropItemSources()
  return PREDEFINED_DROP_ITEMS.filter((item) =>
    (sourcesByItem.get(item.name) ?? []).some(
      (source) => source.bossId === bossId && source.difficulty === difficulty
    )
  )
}

export function formatDropRate(drops: number, kills: number) {
  if (kills <= 0) return drops > 0 ? '처치 기록 없음' : '-'
  return `${((drops / kills) * 100).toFixed(3)}%`
}

function isRateDropRecord(drop: DropRecord, itemName: string) {
  const name = normalizeDropItemName(drop.itemName)
  if (isOpenableBoxName(itemName)) {
    return name === itemName || openedBoxName(drop.memo) === itemName
  }
  return name === itemName && !isOpenedFromBox(drop.memo)
}

function isUntaggedDrop(drop: DropRecord) {
  return !drop.bossId || !drop.difficulty
}

function countRateDrops(
  drops: DropRecord[],
  itemName: string,
  source?: DropItemSource | 'untagged'
) {
  const matching = drops.filter((drop) => isRateDropRecord(drop, itemName))
  if (source == null) return matching.length
  if (source === 'untagged') return matching.filter(isUntaggedDrop).length
  return matching.filter((drop) => drop.bossId === source.bossId && drop.difficulty === source.difficulty).length
}

function countDropsForSource(
  drops: DropRecord[],
  itemName: string,
  source: DropItemSource,
  itemSources: DropItemSource[]
) {
  const tagged = countRateDrops(drops, itemName, source)
  if (itemSources.length !== 1) return tagged
  return tagged + countRateDrops(drops, itemName, 'untagged')
}

function uniqueBossIds(sources: DropItemSource[]) {
  return [...new Set(sources.map((source) => source.bossId))]
}

function getOpensForBox(drops: DropRecord[], boxName: string): BoxOpenRewardRow[] {
  const opens = drops.filter(
    (drop) => isOpenedFromBox(drop.memo) && openedBoxName(drop.memo) === boxName
  )
  if (opens.length === 0) return []
  return getBoxRewards(boxName)
    .map((item) => ({
      id: item.id,
      name: item.name,
      count: opens.filter((drop) => normalizeDropItemName(drop.itemName) === item.name).length,
    }))
    .filter((item) => item.count > 0)
}

export interface BossDropRateItem {
  id: string
  name: string
  group: string
  drops: number
  unique: boolean
  difficulties: BossDifficulty[]
  kills: number
  sources: DropItemSource[]
  untagged?: boolean
}

export interface BossDropRateItemGroup {
  difficulties: BossDifficulty[]
  kills: number
  items: BossDropRateItem[]
  untagged?: boolean
}

export interface BossDifficultyKill {
  difficulty: BossDifficulty
  kills: number
}

export interface BossDropRateRow {
  bossId: string
  name: string
  shortName: string
  group: string
  kills: number
  difficultyKills: BossDifficultyKill[]
  itemGroups: BossDropRateItemGroup[]
}

export interface SharedDropSourceRate {
  bossId: string
  difficulty: BossDifficulty
  drops: number
  kills: number
}

export interface SharedDropRateRow {
  id: string
  name: string
  group: string
  drops: number
  kills: number
  sources: DropItemSource[]
  bySource: SharedDropSourceRate[]
  untaggedDrops: number
}

export interface BoxOpenRewardRow {
  id: string
  name: string
  count: number
}

export interface CombinedDropRateRow {
  id: string
  name: string
  group: string
  drops: number
  kills: number
  opened: number
  opens: BoxOpenRewardRow[]
}

export interface DropRateStats {
  totalKills: number
  totalDrops: number
  bosses: BossDropRateRow[]
  shared: SharedDropRateRow[]
  combined: CombinedDropRateRow[]
}

export function getDropRateStats(
  drops: DropRecord[],
  snapshots: BossSnapshot[],
  characterIds: string[],
  bossDataMap: Record<string, CharacterBossData>
): DropRateStats {
  const clearCounts = getBossClearCounts(snapshots, characterIds, bossDataMap)
  const visible = drops.filter((d) => characterIds.includes(d.characterId))
  const sourcesByItem = getDropItemSources()
  const dropCountByName = new Map(
    PREDEFINED_DROP_ITEMS.map((item) => [item.name, countRateDrops(visible, item.name)])
  )

  const rateBosses = [
    ...BOSSES.filter((boss) => boss.tab === 'belowSword'),
    ...BOSSES.filter((boss) => boss.tab === 'grandis'),
    ...BOSSES.filter((boss) => boss.tab !== 'belowSword' && boss.tab !== 'grandis'),
  ]

  const bosses: BossDropRateRow[] = rateBosses.map((boss) => {
    const difficultyKills: BossDifficultyKill[] = boss.difficulties
      .map((diff) => ({
        difficulty: diff.difficulty,
        kills: clearCounts.get(clearCountKey(boss.id, diff.difficulty)) ?? 0,
      }))
      .filter((row) => row.kills > 0)

    const uniqueItems: BossDropRateItem[] = []
    for (const item of PREDEFINED_DROP_ITEMS) {
      const sources = sourcesByItem.get(item.name) ?? []
      const bossSources = sources.filter((source) => source.bossId === boss.id)
      if (bossSources.length === 0) continue
      const isUnique = uniqueBossIds(sources).length === 1

      for (const source of bossSources) {
        const dropsCount = countDropsForSource(visible, item.name, source, sources)
        const kills = clearCounts.get(clearCountKey(source.bossId, source.difficulty)) ?? 0
        if (dropsCount <= 0 && kills <= 0) continue
        uniqueItems.push({
          id: `${item.id}:${source.difficulty}`,
          name: item.name,
          group: item.group,
          drops: dropsCount,
          unique: isUnique,
          difficulties: [source.difficulty],
          kills,
          sources: [source],
        })
      }

      if (isUnique && sources.length > 1) {
        const untaggedDrops = countRateDrops(visible, item.name, 'untagged')
        if (untaggedDrops > 0) {
          uniqueItems.push({
            id: `${item.id}:untagged`,
            name: item.name,
            group: item.group,
            drops: untaggedDrops,
            unique: true,
            difficulties: [],
            kills: 0,
            sources,
            untagged: true,
          })
        }
      }
    }

    const groupMap = new Map<string, BossDropRateItemGroup>()
    for (const item of uniqueItems) {
      const key = item.untagged ? 'untagged' : item.difficulties.join('|')
      const group = groupMap.get(key) ?? {
        difficulties: item.difficulties,
        kills: item.kills,
        items: [],
        untagged: item.untagged,
      }
      group.items.push(item)
      groupMap.set(key, group)
    }

    const itemGroups = [...groupMap.values()].sort((a, b) => {
      if (a.untagged && !b.untagged) return 1
      if (!a.untagged && b.untagged) return -1
      return compareDifficultyGroups(a.difficulties, b.difficulties)
    })

    return {
      bossId: boss.id,
      name: boss.name,
      shortName: boss.shortName,
      group: boss.group,
      kills: difficultyKills.reduce((sum, row) => sum + row.kills, 0),
      difficultyKills,
      itemGroups,
    }
  }).filter((row) => {
    if (!getBossDropTable(row.bossId)) return false
    return row.kills > 0 || row.itemGroups.some((group) => group.items.some((item) => item.drops > 0))
  })

  const shared: SharedDropRateRow[] = PREDEFINED_DROP_ITEMS.flatMap((item) => {
    const sources = sourcesByItem.get(item.name) ?? []
    if (uniqueBossIds(sources).length < 2) return []
    const untaggedDrops = countRateDrops(visible, item.name, 'untagged')
    if (untaggedDrops <= 0) return []
    return [{
      id: item.id,
      name: item.name,
      group: item.group,
      drops: untaggedDrops,
      kills: 0,
      sources,
      bySource: [],
      untaggedDrops,
    }]
  })

  const COMBINED_GROUPS = new Set(['반지 상자', '주문서', '칠흑'])
  const combined: CombinedDropRateRow[] = PREDEFINED_DROP_ITEMS.flatMap((item) => {
    const include =
      item.group === '반지 상자'
        ? item.name !== RING_MISS_NAME
        : item.group === '주문서' || isOpenableBoxName(item.name)
    if (!include || !COMBINED_GROUPS.has(item.group)) return []
    const sources = sourcesByItem.get(item.name) ?? []
    const dropsCount = dropCountByName.get(item.name) ?? 0
    const kills = sumKills(clearCounts, sources)
    if (kills <= 0 && dropsCount <= 0) return []
    const opens = isOpenableBoxName(item.name) ? getOpensForBox(visible, item.name) : []
    return [{
      id: item.id,
      name: item.name,
      group: item.group,
      drops: dropsCount,
      kills,
      opened: opens.reduce((sum, open) => sum + open.count, 0),
      opens,
    }]
  })

  return {
    totalKills: [...clearCounts.values()].reduce((sum, n) => sum + n, 0),
    totalDrops: [...dropCountByName.values()].reduce((sum, n) => sum + n, 0),
    bosses,
    shared,
    combined,
  }
}
