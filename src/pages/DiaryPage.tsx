import { useEffect, useMemo, useState } from 'react'
import type { Character, HuntRecord, GatherRecord, Expense, Income, DropRecord, BossSnapshot, CharacterBossData, DiaryNote, RiceRecord } from '../types'
import {
  buildDiaryDays,
  entryMatchesDiaryFilter,
  formatDiaryDayLabel,
  formatDiaryEntryAmount,
  getDiaryEntryTargetPage,
  getDiaryTypeMeta,
  isSolErdaPurchaseExpense,
  summarizeDiaryDays,
  summarizeDiaryMonth,
  type DiaryDay,
  type DiaryEntry,
  type DiaryTypeFilter,
} from '../lib/diaryEntries'
import DiaryTypeIcon from '../components/diary/DiaryTypeIcon'
import CharacterScopeSelect from '../components/layout/CharacterScopeSelect'
import { summarizeSolErdaMonth } from '../lib/huntStats'
import { computeExpenseByCategory } from '../lib/ledgerAnalytics'
import {
  buildDiaryExpenseSlices,
  buildDiaryIncomeSlices,
  withSlicePercents,
} from '../lib/diaryStats'
import { getToday } from '../utils'
import {
  buildMonthCalendar,
  getCurrentYearMonth,
  periodMonthToYearMonth,
  shiftMonth,
} from '../lib/monthCalendar'
import MonthCalendar from '../components/ledger/MonthCalendar'
import DiaryMonthStats from '../components/diary/DiaryMonthStats'
import { formatMesoKorean } from '../utils'

interface DiaryPageProps {
  characters: Character[]
  bossDataMap: Record<string, CharacterBossData>
  hunts: HuntRecord[]
  gathers: GatherRecord[]
  expenses: Expense[]
  incomes: Income[]
  drops: DropRecord[]
  snapshots: BossSnapshot[]
  diaryNotes: DiaryNote[]
  riceRecords?: RiceRecord[]
  onRemoveHunt: (id: string) => Promise<void>
  onRemoveGather: (id: string) => Promise<void>
  onRemoveExpense: (id: string) => Promise<void>
  onRemoveIncome: (id: string) => Promise<void>
  onRemoveSolErdaPurchase: (expenseId: string, memo: string | null) => Promise<void>
  onRemoveDrop: (id: string) => Promise<void>
  onRemoveRice?: (id: string) => Promise<void>
  onCreateNote: (data: { characterId?: string | null; recordDate: string; memo: string }) => Promise<void>
  onSaveNote: (id: string, data: { characterId?: string | null; memo: string }) => Promise<void>
  onRemoveNote: (id: string) => Promise<void>
  onNavigateToSource: (entry: DiaryEntry) => void
}

const PRIMARY_FILTERS: { id: DiaryTypeFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'note', label: '메모' },
  { id: 'hunt', label: '사냥' },
  { id: 'ledger', label: '장부' },
  { id: 'boss', label: '보스' },
]

const MORE_FILTERS: { id: DiaryTypeFilter; label: string }[] = [
  { id: 'solErda', label: '솔 에르다' },
  { id: 'gather', label: '채집' },
  { id: 'drop', label: '드랍' },
  { id: 'rice', label: '쌀먹' },
]

const PAGE_LABEL: Record<string, string> = {
  hunt: '사냥',
  gather: '채집',
  drop: '드랍',
  expense: '장부',
  boss: '보스',
  rice: '쌀곳간',
}

export default function DiaryPage({
  characters,
  bossDataMap,
  hunts,
  gathers,
  expenses,
  incomes,
  drops,
  snapshots,
  diaryNotes,
  riceRecords,
  onRemoveHunt,
  onRemoveGather,
  onRemoveExpense,
  onRemoveIncome,
  onRemoveSolErdaPurchase,
  onRemoveDrop,
  onRemoveRice,
  onCreateNote,
  onSaveNote,
  onRemoveNote,
  onNavigateToSource,
}: DiaryPageProps) {
  const [viewMode, setViewMode] = useState<'calendar' | 'stats'>('calendar')
  const [statsPeriod, setStatsPeriod] = useState<'month' | 'all'>('month')
  const [filterCharacterId, setFilterCharacterId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<DiaryTypeFilter>('all')
  const [moreOpen, setMoreOpen] = useState(false)
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth)
  const [selectedDate, setSelectedDate] = useState<string | null>(getToday)

  const charFilter = filterCharacterId ?? undefined
  const monthKey = `${yearMonth.year}-${String(yearMonth.month).padStart(2, '0')}`
  const moreFilters = riceRecords ? MORE_FILTERS : MORE_FILTERS.filter((item) => item.id !== 'rice')
  const isMoreFilter = moreFilters.some((item) => item.id === filterType)

  const allDays = useMemo(
    () => buildDiaryDays(hunts, gathers, expenses, characters, {
      characterId: charFilter,
      incomes,
      drops,
      snapshots,
      bossDataMap,
      notes: diaryNotes,
      riceRecords,
    }),
    [hunts, gathers, expenses, incomes, drops, characters, snapshots, bossDataMap, diaryNotes, riceRecords, filterCharacterId]
  )

  const { weeks, monthTotal } = useMemo(
    () => buildMonthCalendar(yearMonth.year, yearMonth.month, allDays),
    [yearMonth, allDays]
  )

  const monthSummary = useMemo(
    () => summarizeDiaryMonth(allDays, yearMonth.year, yearMonth.month),
    [allDays, yearMonth]
  )

  const allSummary = useMemo(
    () => summarizeDiaryDays(allDays),
    [allDays]
  )

  const incomeSlices = useMemo(
    () => withSlicePercents(buildDiaryIncomeSlices(monthSummary)),
    [monthSummary]
  )

  const allIncomeSlices = useMemo(
    () => withSlicePercents(buildDiaryIncomeSlices(allSummary)),
    [allSummary]
  )

  const expenseSlices = useMemo(
    () =>
      withSlicePercents(
        buildDiaryExpenseSlices(
          computeExpenseByCategory(expenses, {
            characterId: charFilter,
            month: monthKey,
          })
        )
      ),
    [expenses, charFilter, monthKey]
  )

  const allExpenseSlices = useMemo(
    () =>
      withSlicePercents(
        buildDiaryExpenseSlices(
          computeExpenseByCategory(expenses, {
            characterId: charFilter,
          })
        )
      ),
    [expenses, charFilter]
  )

  const solErdaMonth = useMemo(
    () => summarizeSolErdaMonth(hunts, expenses, monthKey, charFilter),
    [hunts, expenses, monthKey, charFilter]
  )

  const solErdaAll = useMemo(
    () => summarizeSolErdaMonth(hunts, expenses, '', charFilter),
    [hunts, expenses, charFilter]
  )

  const statsIsAll = statsPeriod === 'all'

  const selectedDay = useMemo(() => {
    if (!selectedDate) return null
    return allDays.find((d) => d.date === selectedDate) ?? null
  }, [allDays, selectedDate])

  const filteredEntries = useMemo(() => {
    if (!selectedDay) return []
    return selectedDay.entries.filter((entry) => entryMatchesDiaryFilter(entry, filterType))
  }, [selectedDay, filterType])

  const expenseMemoById = useMemo(
    () => Object.fromEntries(expenses.map((e) => [e.id, e.memo])),
    [expenses]
  )

  const defaultNoteCharacterId = filterCharacterId ?? characters[0]?.id ?? null

  const handleRemove = async (entry: DiaryEntry) => {
    if (entry.type === 'note' && entry.sourceId) {
      await onRemoveNote(entry.sourceId)
      return
    }
    if (entry.id.startsWith('hunt-')) {
      await onRemoveHunt(entry.id.slice(5))
      return
    }
    if (entry.id.startsWith('gather-')) {
      await onRemoveGather(entry.id.slice(7))
      return
    }
    if (entry.id.startsWith('drop-')) {
      await onRemoveDrop(entry.id.slice(5))
      return
    }
    if (entry.id.startsWith('income-')) {
      await onRemoveIncome(entry.id.slice(7))
      return
    }
    if (entry.id.startsWith('expense-')) {
      const expenseId = entry.id.slice(8)
      const memo = expenseMemoById[expenseId] ?? null
      if (isSolErdaPurchaseExpense(memo)) {
        await onRemoveSolErdaPurchase(expenseId, memo)
        return
      }
      await onRemoveExpense(expenseId)
      return
    }
    if (entry.id.startsWith('rice-') && onRemoveRice) {
      await onRemoveRice(entry.id.slice(5))
    }
  }

  const selectDate = (date: string) => {
    setSelectedDate(date)
    const next = periodMonthToYearMonth(date.slice(0, 7))
    if (next.year !== yearMonth.year || next.month !== yearMonth.month) {
      setYearMonth(next)
    }
  }

  const goMonth = (delta: number) => {
    setYearMonth((prev) => shiftMonth(prev.year, prev.month, delta))
    setSelectedDate(null)
  }

  const goToday = () => {
    setYearMonth(getCurrentYearMonth())
    setSelectedDate(getToday())
  }

  const pickFilter = (id: DiaryTypeFilter) => {
    setFilterType(id)
    if (PRIMARY_FILTERS.some((item) => item.id === id)) setMoreOpen(false)
  }

  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">📔</span>
        <h2 className="text-lg font-semibold text-slate-300">캐릭터를 먼저 추가해주세요</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">다이어리</h1>
          <p className="text-sm text-slate-500 mt-1">
            {viewMode === 'stats'
              ? statsIsAll
                ? '그동안 기록 전체'
                : '이번 달 수입·지출 구성'
              : '날짜를 누르면 그날 기록이 나와요'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex gap-1">
            <ViewTab active={viewMode === 'calendar'} onClick={() => setViewMode('calendar')}>
              달력
            </ViewTab>
            <ViewTab active={viewMode === 'stats'} onClick={() => setViewMode('stats')}>
              통계
            </ViewTab>
          </div>
        </div>
      </div>

      <CharacterScopeSelect
        characters={characters}
        value={filterCharacterId}
        onChange={setFilterCharacterId}
      />

      {viewMode === 'stats' ? (
        <DiaryMonthStats
          period={statsPeriod}
          onPeriodChange={setStatsPeriod}
          year={yearMonth.year}
          month={yearMonth.month}
          incomeTotal={statsIsAll ? allSummary.income : monthTotal.income}
          expenseTotal={statsIsAll ? allSummary.expense : monthTotal.expense}
          net={statsIsAll ? allSummary.net : monthTotal.net}
          incomeSlices={statsIsAll ? allIncomeSlices : incomeSlices}
          expenseSlices={statsIsAll ? allExpenseSlices : expenseSlices}
          solErdaSummary={statsIsAll ? solErdaAll : solErdaMonth}
          onPrevMonth={() => goMonth(-1)}
          onNextMonth={() => goMonth(1)}
          onToday={goToday}
        />
      ) : (
      <>
      <MonthCalendar
        year={yearMonth.year}
        month={yearMonth.month}
        weeks={weeks}
        monthTotal={monthTotal}
        solErdaSummary={solErdaMonth}
        selectedDate={selectedDate}
        onSelectDate={selectDate}
        onPrevMonth={() => goMonth(-1)}
        onNextMonth={() => goMonth(1)}
        onToday={goToday}
      />

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {PRIMARY_FILTERS.map((item) => (
            <FilterChip
              key={item.id}
              active={filterType === item.id}
              onClick={() => pickFilter(item.id)}
            >
              {item.label}
            </FilterChip>
          ))}
          {isMoreFilter && (
            <FilterChip active onClick={() => setMoreOpen(true)}>
              {moreFilters.find((item) => item.id === filterType)?.label}
            </FilterChip>
          )}
          <FilterChip
            active={moreOpen}
            onClick={() => setMoreOpen((open) => !open)}
          >
            {moreOpen ? '접기' : '더보기'}
          </FilterChip>
        </div>
        {moreOpen && (
          <div className="flex flex-wrap gap-2">
            {moreFilters.map((item) => (
              <FilterChip
                key={item.id}
                active={filterType === item.id}
                onClick={() => pickFilter(item.id)}
              >
                {item.label}
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      {selectedDate ? (
        <div className="space-y-4">
          {selectedDay ? (
            <DaySection
              day={selectedDay}
              entries={filteredEntries}
              filterType={filterType}
              characters={characters}
              defaultNoteCharacterId={defaultNoteCharacterId}
              showCharacter={filterCharacterId === null}
              onRemove={handleRemove}
              onCreateNote={onCreateNote}
              onSaveNote={onSaveNote}
              onNavigate={onNavigateToSource}
            />
          ) : (
            <EmptyDay
              date={selectedDate}
              characters={characters}
              defaultCharacterId={defaultNoteCharacterId}
              showCharacterSelect={filterCharacterId === null}
              onCreateNote={onCreateNote}
            />
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500 text-center py-2">날짜를 누르면 그날 기록이 나와요</p>
      )}
      </>
      )}
    </div>
  )
}

function ViewTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
        active
          ? 'bg-cyber-500/20 border-cyber-500/40 text-cyber-300'
          : 'border-dark-border text-slate-500 hover:text-slate-300'
      }`}
    >
      {children}
    </button>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
        active
          ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
          : 'border-dark-border text-slate-500 hover:text-slate-300'
      }`}
    >
      {children}
    </button>
  )
}

function AddNoteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs text-amber-400/90 hover:text-amber-300 border border-amber-500/20 hover:border-amber-500/40 px-3 py-1.5 rounded-lg transition-colors shrink-0"
    >
      메모 추가
    </button>
  )
}

function DiaryNoteForm({
  date,
  characters,
  defaultCharacterId,
  showCharacterSelect,
  onSubmit,
  onCancel,
}: {
  date: string
  characters: Character[]
  defaultCharacterId: string | null
  showCharacterSelect: boolean
  onSubmit: (data: { characterId?: string | null; recordDate: string; memo: string }) => Promise<void>
  onCancel: () => void
}) {
  const [memo, setMemo] = useState('')
  const [characterId, setCharacterId] = useState<string>('account')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!memo.trim()) return
    setSaving(true)
    try {
      const resolvedCharacterId = showCharacterSelect
        ? (characterId === 'account' ? null : characterId)
        : defaultCharacterId
      await onSubmit({
        characterId: resolvedCharacterId,
        recordDate: date,
        memo: memo.trim(),
      })
      setMemo('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="panel-light border-amber-500/15 p-4">
      <p className="text-sm font-medium text-slate-200 mb-3">메모 추가</p>
      <div className="space-y-3">
        {showCharacterSelect && (
          <div>
            <label className="text-xs text-slate-500 mb-1 block">캐릭터</label>
            <select
              value={characterId}
              onChange={(e) => setCharacterId(e.target.value)}
              className="input-field text-sm"
            >
              <option value="account">전체 (계정 공통)</option>
              {characters.map((char) => (
                <option key={char.id} value={char.id}>{char.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="text-xs text-slate-500 mb-1 block">메모</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="오늘 있었던 일, 강화 결과, 보스 클리어 등"
            rows={3}
            className="input-field text-sm resize-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!memo.trim() || saving}
            className="btn-primary text-sm flex-1 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? '저장 중...' : '메모 저장'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary text-sm px-4 py-2"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyDay({
  date,
  characters,
  defaultCharacterId,
  showCharacterSelect,
  onCreateNote,
}: {
  date: string
  characters: Character[]
  defaultCharacterId: string | null
  showCharacterSelect: boolean
  onCreateNote: (data: { characterId?: string | null; recordDate: string; memo: string }) => Promise<void>
}) {
  const [noteOpen, setNoteOpen] = useState(false)
  const { label } = formatDiaryDayLabel(date)

  useEffect(() => {
    setNoteOpen(false)
  }, [date])

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-200">{label}</h2>
        {!noteOpen && <AddNoteButton onClick={() => setNoteOpen(true)} />}
      </div>
      {noteOpen && (
        <DiaryNoteForm
          date={date}
          characters={characters}
          defaultCharacterId={defaultCharacterId}
          showCharacterSelect={showCharacterSelect}
          onSubmit={async (data) => {
            await onCreateNote(data)
            setNoteOpen(false)
          }}
          onCancel={() => setNoteOpen(false)}
        />
      )}
      <div className="panel-light p-6 text-center">
        <p className="text-sm text-slate-500">이 날짜에 기록이 없어요</p>
      </div>
    </section>
  )
}

function DaySection({
  day,
  entries,
  filterType,
  characters,
  defaultNoteCharacterId,
  showCharacter,
  onRemove,
  onCreateNote,
  onSaveNote,
  onNavigate,
}: {
  day: DiaryDay
  entries: DiaryEntry[]
  filterType: DiaryTypeFilter
  characters: Character[]
  defaultNoteCharacterId: string | null
  showCharacter: boolean
  onRemove: (entry: DiaryEntry) => void
  onCreateNote: (data: { characterId?: string | null; recordDate: string; memo: string }) => Promise<void>
  onSaveNote: (id: string, data: { characterId?: string | null; memo: string }) => Promise<void>
  onNavigate: (entry: DiaryEntry) => void
}) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editMemo, setEditMemo] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setNoteOpen(false)
  }, [day.date])

  const startEditNote = (entry: DiaryEntry) => {
    if (!entry.sourceId) return
    setEditingNoteId(entry.sourceId)
    setEditMemo(entry.memo ?? '')
  }

  const saveEditNote = async (entry: DiaryEntry) => {
    if (!entry.sourceId || !editMemo.trim()) return
    setSaving(true)
    try {
      await onSaveNote(entry.sourceId, {
        characterId: entry.characterId || null,
        memo: editMemo.trim(),
      })
      setEditingNoteId(null)
      setEditMemo('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <div className="sticky top-0 z-10 py-2 mb-3 bg-dark-bg/90 backdrop-blur-sm border-b border-dark-border/40">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-base font-semibold text-slate-200">{day.label}</h2>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex gap-3 text-xs">
              {day.income > 0 && <span className="text-cyber-400">+{formatMesoKorean(day.income)}</span>}
              {day.expense > 0 && <span className="text-red-400">-{formatMesoKorean(day.expense)}</span>}
              <span className={`font-medium ${day.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                = {formatMesoKorean(day.net)}
              </span>
            </div>
            {!noteOpen && <AddNoteButton onClick={() => setNoteOpen(true)} />}
          </div>
        </div>
      </div>

      {noteOpen && (
        <div className="mb-3">
          <DiaryNoteForm
            date={day.date}
            characters={characters}
            defaultCharacterId={defaultNoteCharacterId}
            showCharacterSelect={showCharacter}
            onSubmit={async (data) => {
              await onCreateNote(data)
              setNoteOpen(false)
            }}
            onCancel={() => setNoteOpen(false)}
          />
        </div>
      )}

      {entries.length === 0 ? (
        <div className="panel-light p-6 text-center">
          <p className="text-sm text-slate-500">
            {filterType === 'all' ? '이 날짜에 기록이 없어요' : '이 필터에 맞는 기록이 없어요'}
          </p>
        </div>
      ) : (
        <div className="relative pl-6 record-list-scroll-tall">
          <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gradient-to-b from-cyber-700/50 via-dark-border to-transparent" />

          {entries.map((entry) => {
            const meta = getDiaryTypeMeta(entry.type)
            const amountDisplay = formatDiaryEntryAmount(entry)
            const targetPage = getDiaryEntryTargetPage(entry)
            const isNote = entry.type === 'note'
            const isEditing = isNote && editingNoteId === entry.sourceId
            const canDelete = entry.type !== 'boss'
            const canNavigate =
              !!targetPage &&
              (entry.characterId || entry.type === 'expense' || entry.type === 'rice')

            return (
              <article
                key={entry.id}
                className={`relative panel-light p-4 transition-colors ${
                  canNavigate ? 'cursor-pointer hover:bg-dark-surface/80' : ''
                }`}
                style={{
                  borderLeft: `2px solid ${
                    amountDisplay.tone === 'expense'
                      ? 'rgb(var(--diary-purchase) / 0.45)'
                      : entry.type === 'rice'
                        ? 'rgb(var(--diary-enhance) / 0.45)'
                        : entry.type === 'boss'
                        ? 'rgb(var(--diary-boss) / 0.45)'
                        : entry.type === 'drop'
                          ? 'rgb(var(--diary-drop) / 0.4)'
                          : entry.type === 'note'
                            ? 'rgb(var(--diary-enhance) / 0.45)'
                            : amountDisplay.tone === 'neutral'
                              ? 'rgb(var(--diary-sol) / 0.45)'
                              : 'rgb(var(--diary-hunt) / 0.45)'
                  }`,
                }}
                onClick={() => {
                  if (isEditing) return
                  if (canNavigate) onNavigate(entry)
                }}
              >
                <div className="absolute -left-6 top-5 w-[18px] h-[18px] rounded-full bg-dark-bg border-2 border-cyber-600/50 flex items-center justify-center overflow-hidden text-[10px]">
                  <DiaryTypeIcon type={entry.type} riceSize="sm" />
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-surface text-slate-500 border border-dark-border">
                        {meta.label}
                      </span>
                      {showCharacter && (
                        <span className="text-[10px] text-cyber-500">{entry.characterName}</span>
                      )}
                      {canNavigate && targetPage && (
                        <span className="text-[10px] text-slate-600">
                          {PAGE_LABEL[targetPage]} 탭 →
                        </span>
                      )}
                    </div>
                    {!isNote && <p className="text-sm font-medium text-slate-200 mt-1">{entry.title}</p>}
                    {isEditing ? (
                      <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                        <textarea
                          value={editMemo}
                          onChange={(e) => setEditMemo(e.target.value)}
                          rows={3}
                          className="input-field text-sm resize-none w-full"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveEditNote(entry)}
                            disabled={!editMemo.trim() || saving}
                            className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40"
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="btn-secondary text-xs px-3 py-1.5"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      (entry.detail || entry.memo || isNote) && (
                        <p className={`text-sm mt-1 ${isNote ? 'text-slate-200 whitespace-pre-wrap' : 'text-xs text-slate-500'}`}>
                          {isNote ? entry.memo : (entry.detail ?? entry.memo)}
                        </p>
                      )
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {!isNote && (
                      <span
                        className={`text-sm font-bold ${
                          amountDisplay.tone === 'expense'
                            ? 'text-red-400'
                            : amountDisplay.tone === 'neutral'
                              ? 'text-violet-400'
                              : 'text-cyber-400'
                        }`}
                      >
                        {amountDisplay.text}
                      </span>
                    )}
                    {isNote && !isEditing && (
                      <button
                        onClick={() => startEditNote(entry)}
                        className="text-slate-600 hover:text-cyber-400 text-xs px-1"
                        title="수정"
                      >
                        ✎
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => onRemove(entry)}
                        className="text-slate-600 hover:text-red-400 text-xs px-1"
                        title="삭제"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
