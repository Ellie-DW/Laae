import type { HuntRecord, GatherRecord, Expense, DropRecord, BossSnapshot, CharacterBossData } from '../types'
import { EXPENSE_CATEGORY_LABEL } from './ledgerApi'
import { calculateBossStats } from './bossStats'
import { getToday, formatMesoKorean } from '../utils'

export type DiaryEntryType = 'hunt' | 'gather' | 'drop' | 'expense' | 'boss'

export interface DiaryEntry {
  id: string
  type: DiaryEntryType
  characterId: string
  characterName: string
  recordDate: string
  createdAt: string
  amount: number
  title: string
  detail?: string
  memo?: string | null
}

export interface DiaryDay {
  date: string
  label: string
  weekday: string
  entries: DiaryEntry[]
  income: number
  expense: number
  net: number
}

const TYPE_META: Record<DiaryEntryType, { icon: string; label: string }> = {
  hunt: { icon: '⚔️', label: '사냥' },
  gather: { icon: '🌿', label: '채집' },
  drop: { icon: '💎', label: '드랍' },
  expense: { icon: '💸', label: '지출' },
  boss: { icon: '👹', label: '보스' },
}

export function getDiaryTypeMeta(type: DiaryEntryType) {
  return TYPE_META[type]
}

function formatDiaryDayLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const weekday = d.toLocaleDateString('ko-KR', { weekday: 'long' })
  const label = d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })
  return { label, weekday }
}

function charName(characters: { id: string; name: string }[], id: string) {
  return characters.find((c) => c.id === id)?.name ?? '알 수 없음'
}

export function buildBossDiaryEntries(
  characters: { id: string; name: string }[],
  bossDataMap: Record<string, CharacterBossData>,
  characterId?: string
): DiaryEntry[] {
  const entries: DiaryEntry[] = []

  for (const character of characters) {
    if (characterId && character.id !== characterId) continue
    const bossData = bossDataMap[character.id]
    const stats = calculateBossStats(bossData)
    if (stats.totalMeso <= 0) continue

    const recordDate = bossData.bossesClearedAt ?? getToday()
    const detailParts = [
      stats.weeklyBossMeso > 0 ? `주간 ${formatMesoKorean(stats.weeklyBossMeso)}` : null,
      stats.monthlyBossMeso > 0 ? `월간 ${formatMesoKorean(stats.monthlyBossMeso)}` : null,
    ].filter(Boolean)

    entries.push({
      id: `boss-live-${character.id}`,
      type: 'boss',
      characterId: character.id,
      characterName: character.name,
      recordDate,
      createdAt: `${recordDate}T12:00:00.000Z`,
      amount: stats.totalMeso,
      title: '보스 잡음',
      detail: detailParts.join(' · '),
    })
  }

  return entries
}

export function buildDiaryDays(
  hunts: HuntRecord[],
  gathers: GatherRecord[],
  expenses: Expense[],
  characters: { id: string; name: string }[],
  options?: {
    characterId?: string
    drops?: DropRecord[]
    snapshots?: BossSnapshot[]
    bossDataMap?: Record<string, CharacterBossData>
    limitDays?: number
  }
): DiaryDay[] {
  const charId = options?.characterId
  const entries: DiaryEntry[] = []

  for (const h of hunts) {
    if (charId && h.characterId !== charId) continue
    const isSolErdaSale = h.solErdaFragments < 0
    const detailParts: string[] = []
    if (isSolErdaSale) {
      detailParts.push(`솔 에르다 ${Math.abs(h.solErdaFragments).toLocaleString()}개 판매`)
    } else if (h.solErdaFragments > 0) {
      detailParts.push(`솔 에르다 조각 ${h.solErdaFragments}개`)
    }
    entries.push({
      id: `hunt-${h.id}`,
      type: 'hunt',
      characterId: h.characterId,
      characterName: charName(characters, h.characterId),
      recordDate: h.recordDate,
      createdAt: h.createdAt,
      amount: h.meso,
      title: isSolErdaSale ? '솔 에르다 판매' : '사냥',
      detail: detailParts.length > 0 ? detailParts.join(' · ') : undefined,
      memo: null,
    })
  }

  for (const g of gathers) {
    if (charId && g.characterId !== charId) continue
    entries.push({
      id: `gather-${g.id}`,
      type: 'gather',
      characterId: g.characterId,
      characterName: charName(characters, g.characterId),
      recordDate: g.recordDate,
      createdAt: g.createdAt,
      amount: g.meso,
      title: g.itemName,
      memo: g.memo,
    })
  }

  for (const d of options?.drops ?? []) {
    if (charId && d.characterId !== charId) continue
    entries.push({
      id: `drop-${d.id}`,
      type: 'drop',
      characterId: d.characterId,
      characterName: charName(characters, d.characterId),
      recordDate: d.recordDate,
      createdAt: d.createdAt,
      amount: d.meso,
      title: d.itemName,
      memo: d.memo,
    })
  }

  for (const e of expenses) {
    if (charId && e.characterId !== charId) continue
    entries.push({
      id: `expense-${e.id}`,
      type: 'expense',
      characterId: e.characterId,
      characterName: charName(characters, e.characterId),
      recordDate: e.recordDate,
      createdAt: e.createdAt,
      amount: -e.amount,
      title: EXPENSE_CATEGORY_LABEL[e.category],
      memo: e.memo,
    })
  }

  for (const s of options?.snapshots ?? []) {
    if (charId && s.characterId !== charId) continue
    const date = s.createdAt.slice(0, 10)
    entries.push({
      id: `boss-${s.id}`,
      type: 'boss',
      characterId: s.characterId,
      characterName: charName(characters, s.characterId),
      recordDate: date,
      createdAt: s.createdAt,
      amount: s.totalMeso,
      title: s.cycle === 'weekly' ? '주간 보스 스냅샷' : '월간 보스 스냅샷',
      detail: `${s.periodStart} ~ ${s.periodEnd}`,
    })
  }

  if (options?.bossDataMap) {
    entries.push(...buildBossDiaryEntries(characters, options.bossDataMap, charId))
  }

  const dayMap = new Map<string, DiaryEntry[]>()
  for (const entry of entries) {
    const list = dayMap.get(entry.recordDate) ?? []
    list.push(entry)
    dayMap.set(entry.recordDate, list)
  }

  const days: DiaryDay[] = [...dayMap.entries()].map(([date, dayEntries]) => {
    const sorted = dayEntries.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const income = sorted.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0)
    const expense = sorted.filter((e) => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0)
    const { label, weekday } = formatDiaryDayLabel(date)

    return {
      date,
      label,
      weekday,
      entries: sorted,
      income,
      expense,
      net: income - expense,
    }
  })

  days.sort((a, b) => b.date.localeCompare(a.date))

  const limit = options?.limitDays
  return limit ? days.slice(0, limit) : days
}

export function getRecentDiaryEntries(days: DiaryDay[], maxEntries = 8): DiaryEntry[] {
  const result: DiaryEntry[] = []
  for (const day of days) {
    for (const entry of day.entries) {
      result.push(entry)
      if (result.length >= maxEntries) return result
    }
  }
  return result
}
