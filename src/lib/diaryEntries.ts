import type { HuntRecord, GatherRecord, Expense, DropRecord, BossSnapshot, CharacterBossData, DiaryNote, RiceRecord, Page } from '../types'
import { EXPENSE_CATEGORY_LABEL } from './ledgerApi'
import { calculateBossStats, isWeeklyBossCleared, isMonthlyBossCleared } from './bossStats'
import { isSolErdaSale, isSolErdaSpend, parseSolErdaPurchaseMemo, isSolErdaPurchaseExpense } from './huntStats'
import { formatWonPerEok } from './riceTrade'
import { getToday, formatMesoKorean, formatWon, getWeeklyPeriod, getMonthlyPeriod } from '../utils'

export type DiaryEntryType = 'hunt' | 'gather' | 'drop' | 'expense' | 'boss' | 'note' | 'rice'

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
  /** 메소 대신 조각 수량 등을 표시할 때 */
  amountLabel?: string
  /** note 타입일 때 원본 메모 ID */
  sourceId?: string
  /** 솔 에르다 관련 항목 (필터·요약용) */
  isSolErda?: boolean
  /** 클릭 시 이동할 탭 (타입 기본값 대신) */
  navigatePage?: Page
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
  note: { icon: '📝', label: '메모' },
  rice: { icon: '🍚', label: '쌀먹' },
}

const ENTRY_TARGET_PAGE: Record<Exclude<DiaryEntryType, 'note'>, Page> = {
  hunt: 'hunt',
  gather: 'gather',
  drop: 'drop',
  expense: 'expense',
  boss: 'boss',
  rice: 'rice',
}

export function getDiaryEntryTargetPage(entry: DiaryEntry): Page | null {
  if (entry.type === 'note') return null
  if (entry.navigatePage) return entry.navigatePage
  return ENTRY_TARGET_PAGE[entry.type]
}

export function isSolErdaDiaryEntry(entry: DiaryEntry) {
  return !!entry.isSolErda
}

export function getDiaryTypeMeta(type: DiaryEntryType) {
  return TYPE_META[type]
}

export function formatDiaryEntryAmount(entry: DiaryEntry) {
  if (entry.type === 'note') {
    return { text: '메모', tone: 'neutral' as const }
  }
  if (entry.type === 'rice' && entry.amountLabel) {
    return { text: entry.amountLabel, tone: 'income' as const }
  }
  if (entry.amountLabel) {
    return { text: entry.amountLabel, tone: 'neutral' as const }
  }
  if (entry.amount < 0) {
    return { text: formatMesoKorean(entry.amount), tone: 'expense' as const }
  }
  return { text: `+${formatMesoKorean(entry.amount)}`, tone: 'income' as const }
}

function collectSolErdaPurchaseHuntIds(expenses: Expense[]) {
  const ids = new Set<string>()
  for (const e of expenses) {
    const parsed = parseSolErdaPurchaseMemo(e.memo)
    if (parsed?.huntId) ids.add(parsed.huntId)
  }
  return ids
}

function liveBossAmount(
  bossData: CharacterBossData,
  snapshots: BossSnapshot[],
  characterId: string
) {
  const stats = calculateBossStats(bossData)
  const weekStart = getWeeklyPeriod().start
  const monthStart = getMonthlyPeriod().start
  const weeklySnapshotted = snapshots.some(
    (s) => s.characterId === characterId && s.cycle === 'weekly' && s.periodStart === weekStart
  )
  const monthlySnapshotted = snapshots.some(
    (s) => s.characterId === characterId && s.cycle === 'monthly' && s.periodStart === monthStart
  )

  let weekly = 0
  let monthly = 0
  if (isWeeklyBossCleared(bossData) && stats.weeklyBossMeso > 0 && !weeklySnapshotted) {
    weekly = stats.weeklyBossMeso
  }
  if (isMonthlyBossCleared(bossData) && stats.monthlyBossMeso > 0 && !monthlySnapshotted) {
    monthly = stats.monthlyBossMeso
  }

  return { weekly, monthly, total: weekly + monthly }
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
  characterId?: string,
  snapshots: BossSnapshot[] = []
): DiaryEntry[] {
  const entries: DiaryEntry[] = []

  for (const character of characters) {
    if (characterId && character.id !== characterId) continue
    const bossData = bossDataMap[character.id]
    if (!bossData) continue

    const { weekly, monthly, total } = liveBossAmount(bossData, snapshots, character.id)
    if (total <= 0) continue

    const recordDate = bossData.bossesClearedAt ?? getToday()
    const detailParts = [
      weekly > 0 ? `주간 ${formatMesoKorean(weekly)}` : null,
      monthly > 0 ? `월간 ${formatMesoKorean(monthly)}` : null,
    ].filter(Boolean)

    entries.push({
      id: `boss-live-${character.id}`,
      type: 'boss',
      characterId: character.id,
      characterName: character.name,
      recordDate,
      createdAt: `${recordDate}T12:00:00.000Z`,
      amount: total,
      title: '보스 잡음',
      detail: `${detailParts.join(' · ')} · 미확정`,
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
    notes?: DiaryNote[]
    riceRecords?: RiceRecord[]
    limitDays?: number
  }
): DiaryDay[] {
  const charId = options?.characterId
  const entries: DiaryEntry[] = []
  const purchaseHuntIds = collectSolErdaPurchaseHuntIds(expenses)

  for (const h of hunts) {
    if (charId && h.characterId !== charId) continue
    if (purchaseHuntIds.has(h.id)) continue

    const isSale = isSolErdaSale(h)
    const isSpend = isSolErdaSpend(h)
    const fragmentQty = Math.abs(h.solErdaFragments)
    const detailParts: string[] = []

    if (isSale) {
      detailParts.push(`솔 에르다 ${fragmentQty.toLocaleString()}개 판매`)
    } else if (isSpend) {
      detailParts.push(`솔 에르다 ${fragmentQty.toLocaleString()}개 사용`)
    } else if (h.solErdaFragments > 0) {
      detailParts.push(`솔 에르다 조각 ${h.solErdaFragments.toLocaleString()}개 획득`)
    }

    entries.push({
      id: `hunt-${h.id}`,
      type: 'hunt',
      characterId: h.characterId,
      characterName: charName(characters, h.characterId),
      recordDate: h.recordDate,
      createdAt: h.createdAt,
      amount: h.meso,
      title: isSale ? '솔 에르다 판매' : isSpend ? '솔 에르다 사용' : '사냥',
      detail: detailParts.length > 0 ? detailParts.join(' · ') : undefined,
      memo: null,
      amountLabel: isSpend
        ? `${fragmentQty.toLocaleString()}개 사용`
        : h.meso === 0 && h.solErdaFragments > 0
          ? `${h.solErdaFragments.toLocaleString()}개 획득`
          : undefined,
      isSolErda: isSale || isSpend || h.solErdaFragments > 0,
      navigatePage: isSpend ? 'expense' : 'hunt',
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
    const purchase = parseSolErdaPurchaseMemo(e.memo)
    entries.push({
      id: `expense-${e.id}`,
      type: 'expense',
      characterId: e.characterId,
      characterName: charName(characters, e.characterId),
      recordDate: e.recordDate,
      createdAt: e.createdAt,
      amount: -e.amount,
      title: purchase ? '솔 에르다 조각 구매' : EXPENSE_CATEGORY_LABEL[e.category],
      detail: purchase ? `${purchase.quantity.toLocaleString()}개 · ${formatMesoKorean(e.amount)}` : undefined,
      memo: purchase ? purchase.displayMemo : e.memo,
      isSolErda: !!purchase,
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
    entries.push(
      ...buildBossDiaryEntries(
        characters,
        options.bossDataMap,
        charId,
        options.snapshots ?? []
      )
    )
  }

  for (const note of options?.notes ?? []) {
    if (charId && note.characterId && note.characterId !== charId) continue
    entries.push({
      id: `note-${note.id}`,
      type: 'note',
      characterId: note.characterId ?? '',
      characterName: note.characterId ? charName(characters, note.characterId) : '전체',
      recordDate: note.recordDate,
      createdAt: note.updatedAt || note.createdAt,
      amount: 0,
      title: '메모',
      memo: note.memo,
      sourceId: note.id,
    })
  }

  for (const record of options?.riceRecords ?? []) {
    const title =
      record.mesoSold != null && record.wonPerEok != null
        ? `${formatMesoKorean(record.mesoSold)} · ${formatWonPerEok(record.wonPerEok)}`
        : record.description

    entries.push({
      id: `rice-${record.id}`,
      type: 'rice',
      characterId: '',
      characterName: '전체',
      recordDate: record.recordDate,
      createdAt: record.createdAt,
      amount: 0,
      amountLabel: `+${formatWon(record.amount)}`,
      title,
      detail: record.mesoSold != null ? `판매 ${formatMesoKorean(record.mesoSold)}` : undefined,
      memo: record.memo,
      sourceId: record.id,
      navigatePage: 'rice',
    })
  }

  const dayMap = new Map<string, DiaryEntry[]>()
  for (const entry of entries) {
    const list = dayMap.get(entry.recordDate) ?? []
    list.push(entry)
    dayMap.set(entry.recordDate, list)
  }

  const days: DiaryDay[] = [...dayMap.entries()].map(([date, dayEntries]) => {
    const sorted = dayEntries.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const income = sorted
      .filter((e) => e.amount > 0 && e.type !== 'rice')
      .reduce((s, e) => s + e.amount, 0)
    const expense = sorted
      .filter((e) => e.amount < 0 && e.type !== 'rice')
      .reduce((s, e) => s + Math.abs(e.amount), 0)
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

export function filterDiaryDaysByType(days: DiaryDay[], type: DiaryEntryType | 'all' | 'solErda'): DiaryDay[] {
  if (type === 'all') return days
  return days
    .map((day) => {
      const entries = day.entries.filter((e) =>
        type === 'solErda' ? isSolErdaDiaryEntry(e) : e.type === type
      )
      if (entries.length === 0) return null
      const income = entries.filter((e) => e.amount > 0 && e.type !== 'rice').reduce((s, e) => s + e.amount, 0)
      const expense = entries.filter((e) => e.amount < 0 && e.type !== 'rice').reduce((s, e) => s + Math.abs(e.amount), 0)
      return { ...day, entries, income, expense, net: income - expense }
    })
    .filter((day): day is DiaryDay => day !== null)
}

export interface DiaryMonthSummary {
  income: number
  expense: number
  net: number
  incomeByType: Partial<Record<DiaryEntryType, number>>
  huntMesoIncome: number
  solErdaSaleIncome: number
  entryCount: number
}

export function summarizeDiaryMonth(days: DiaryDay[], year: number, month: number): DiaryMonthSummary {
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  const monthDays = days.filter((d) => d.date.startsWith(prefix))

  const summary: DiaryMonthSummary = {
    income: 0,
    expense: 0,
    net: 0,
    incomeByType: {},
    huntMesoIncome: 0,
    solErdaSaleIncome: 0,
    entryCount: 0,
  }

  for (const day of monthDays) {
    summary.income += day.income
    summary.expense += day.expense
    summary.net += day.net
    summary.entryCount += day.entries.length
    for (const entry of day.entries) {
      if (entry.amount <= 0) continue
      summary.incomeByType[entry.type] = (summary.incomeByType[entry.type] ?? 0) + entry.amount
      if (entry.type === 'hunt' && entry.title === '솔 에르다 판매') {
        summary.solErdaSaleIncome += entry.amount
      } else if (entry.type === 'hunt') {
        summary.huntMesoIncome += entry.amount
      }
    }
  }

  return summary
}

export { isSolErdaPurchaseExpense }
