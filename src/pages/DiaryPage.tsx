import { useMemo, useState } from 'react'
import type { Character, HuntRecord, GatherRecord, Expense, DropRecord, BossSnapshot, CharacterBossData } from '../types'
import {
  buildDiaryDays,
  filterDiaryDaysByType,
  formatDiaryEntryAmount,
  getDiaryTypeMeta,
  isSolErdaPurchaseExpense,
  summarizeDiaryMonth,
  type DiaryDay,
  type DiaryEntry,
  type DiaryEntryType,
} from '../lib/diaryEntries'
import { computeExpenseByCategory } from '../lib/ledgerAnalytics'
import {
  buildMonthCalendar,
  getCurrentYearMonth,
  shiftMonth,
} from '../lib/monthCalendar'
import MonthCalendar from '../components/ledger/MonthCalendar'
import { formatMesoKorean } from '../utils'

interface DiaryPageProps {
  characters: Character[]
  bossDataMap: Record<string, CharacterBossData>
  hunts: HuntRecord[]
  gathers: GatherRecord[]
  expenses: Expense[]
  drops: DropRecord[]
  snapshots: BossSnapshot[]
  onRemoveHunt: (id: string) => Promise<void>
  onRemoveGather: (id: string) => Promise<void>
  onRemoveExpense: (id: string) => Promise<void>
  onRemoveSolErdaPurchase: (expenseId: string, memo: string | null) => Promise<void>
  onRemoveDrop: (id: string) => Promise<void>
}

type ViewMode = 'list' | 'calendar'
type TypeFilter = 'all' | DiaryEntryType

const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'hunt', label: '사냥' },
  { id: 'gather', label: '채집' },
  { id: 'drop', label: '드랍' },
  { id: 'expense', label: '지출' },
  { id: 'boss', label: '보스' },
]

export default function DiaryPage({
  characters,
  bossDataMap,
  hunts,
  gathers,
  expenses,
  drops,
  snapshots,
  onRemoveHunt,
  onRemoveGather,
  onRemoveExpense,
  onRemoveSolErdaPurchase,
  onRemoveDrop,
}: DiaryPageProps) {
  const [filterCharacterId, setFilterCharacterId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<TypeFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const charFilter = filterCharacterId ?? undefined
  const monthKey = `${yearMonth.year}-${String(yearMonth.month).padStart(2, '0')}`

  const allDays = useMemo(
    () => buildDiaryDays(hunts, gathers, expenses, characters, {
      characterId: charFilter,
      drops,
      snapshots,
      bossDataMap,
    }),
    [hunts, gathers, expenses, drops, characters, snapshots, bossDataMap, filterCharacterId]
  )

  const days = useMemo(
    () => filterDiaryDaysByType(allDays, filterType),
    [allDays, filterType]
  )

  const { weeks, monthTotal } = useMemo(
    () => buildMonthCalendar(yearMonth.year, yearMonth.month, days),
    [yearMonth, days]
  )

  const monthSummary = useMemo(
    () => summarizeDiaryMonth(days, yearMonth.year, yearMonth.month),
    [days, yearMonth]
  )

  const categoryBreakdown = useMemo(
    () =>
      computeExpenseByCategory(expenses, {
        characterId: charFilter,
        month: monthKey,
      }).filter((c) => c.amount > 0),
    [expenses, charFilter, monthKey]
  )

  const selectedDay = useMemo(() => {
    if (!selectedDate) return null
    return days.find((d) => d.date === selectedDate) ?? null
  }, [days, selectedDate])

  const expenseMemoById = useMemo(
    () => Object.fromEntries(expenses.map((e) => [e.id, e.memo])),
    [expenses]
  )

  const handleRemove = async (entry: DiaryEntry) => {
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
    if (entry.id.startsWith('expense-')) {
      const expenseId = entry.id.slice(8)
      const memo = expenseMemoById[expenseId] ?? null
      if (isSolErdaPurchaseExpense(memo)) {
        await onRemoveSolErdaPurchase(expenseId, memo)
        return
      }
      await onRemoveExpense(expenseId)
    }
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
          <p className="text-sm text-slate-500 mt-1">날짜별 수입·지출 기록을 한눈에</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <ViewTab active={viewMode === 'calendar'} onClick={() => setViewMode('calendar')}>
            📅 캘린더
          </ViewTab>
          <ViewTab active={viewMode === 'list'} onClick={() => setViewMode('list')}>
            📋 목록
          </ViewTab>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <ScopeButton active={filterCharacterId === null} onClick={() => setFilterCharacterId(null)}>
          전체 캐릭터
        </ScopeButton>
        {characters.map((char) => (
          <ScopeButton
            key={char.id}
            active={filterCharacterId === char.id}
            onClick={() => setFilterCharacterId(char.id)}
          >
            {char.name}
          </ScopeButton>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilterType(item.id)}
            className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
              filterType === item.id
                ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                : 'border-dark-border text-slate-500 hover:text-slate-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {viewMode === 'calendar' && (
        <div className="panel-light p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-100">{monthKey} 월간 결산</h2>
              <p className="text-xs text-slate-500 mt-0.5">{monthSummary.entryCount}건 기록</p>
            </div>
            <span className={`text-sm font-bold ${monthSummary.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              순수익 {formatMesoKorean(monthSummary.net)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <SummaryChip label="수입" value={formatMesoKorean(monthSummary.income)} tone="income" />
            <SummaryChip label="지출" value={formatMesoKorean(monthSummary.expense)} tone="expense" />
            <SummaryChip label="순수익" value={formatMesoKorean(monthSummary.net)} tone={monthSummary.net >= 0 ? 'income' : 'expense'} />
          </div>
          {Object.keys(monthSummary.incomeByType).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {(['hunt', 'gather', 'drop', 'boss'] as const).map((type) => {
                const amount = monthSummary.incomeByType[type]
                if (!amount) return null
                return (
                  <span
                    key={type}
                    className="text-xs px-2 py-1 rounded bg-cyber-500/10 text-cyber-400 border border-cyber-500/20"
                  >
                    {getDiaryTypeMeta(type).label} {formatMesoKorean(amount)}
                  </span>
                )
              })}
            </div>
          )}
          {categoryBreakdown.length > 0 && filterType === 'all' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-dark-border/60">
              {categoryBreakdown.map((item) => (
                <div key={item.category} className="px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/15">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-sm font-bold text-red-400 mt-0.5">{formatMesoKorean(item.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === 'calendar' ? (
        <div className="space-y-4">
          <MonthCalendar
            year={yearMonth.year}
            month={yearMonth.month}
            weeks={weeks}
            monthTotal={monthTotal}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onPrevMonth={() => {
              setYearMonth((prev) => shiftMonth(prev.year, prev.month, -1))
              setSelectedDate(null)
            }}
            onNextMonth={() => {
              setYearMonth((prev) => shiftMonth(prev.year, prev.month, 1))
              setSelectedDate(null)
            }}
            onToday={() => {
              const today = getCurrentYearMonth()
              setYearMonth(today)
              const d = new Date()
              setSelectedDate(
                `${today.year}-${String(today.month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
              )
            }}
          />

          {selectedDate ? (
            selectedDay && selectedDay.entries.length > 0 ? (
              <DaySection
                day={selectedDay}
                showCharacter={filterCharacterId === null}
                onRemove={handleRemove}
              />
            ) : (
              <div className="panel-light p-8 text-center">
                <p className="text-sm text-slate-500">이 날짜에 기록이 없어요</p>
              </div>
            )
          ) : (
            <div className="panel-light p-6 text-center">
              <p className="text-sm text-slate-500">날짜를 클릭하면 상세 기록을 볼 수 있어요</p>
            </div>
          )}
        </div>
      ) : days.length === 0 ? (
        <div className="panel-light p-12 text-center">
          <span className="text-4xl">📔</span>
          <p className="text-slate-400 mt-4">아직 기록이 없어요</p>
          <p className="text-sm text-slate-500 mt-1">사냥·채집·드랍·지출·보스 기록이 여기에 쌓여요</p>
        </div>
      ) : (
        <div className="space-y-8">
          {days.map((day) => (
            <DaySection
              key={day.date}
              day={day}
              showCharacter={filterCharacterId === null}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'income' | 'expense'
}) {
  return (
    <div className="px-3 py-2 rounded-lg bg-dark-surface/50 border border-dark-border">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${tone === 'income' ? 'text-cyber-400' : 'text-red-400'}`}>
        {value}
      </p>
    </div>
  )
}

function DaySection({
  day,
  showCharacter,
  onRemove,
}: {
  day: DiaryDay
  showCharacter: boolean
  onRemove: (entry: DiaryEntry) => void
}) {
  return (
    <section>
      <div className="sticky top-0 z-10 py-2 mb-3 bg-dark-bg/90 backdrop-blur-sm border-b border-dark-border/40">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-200">{day.label}</h2>
          <div className="flex gap-3 text-xs shrink-0">
            {day.income > 0 && <span className="text-cyber-400">+{formatMesoKorean(day.income)}</span>}
            {day.expense > 0 && <span className="text-red-400">-{formatMesoKorean(day.expense)}</span>}
            <span className={`font-medium ${day.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              = {formatMesoKorean(day.net)}
            </span>
          </div>
        </div>
      </div>

      <div className="relative pl-6 space-y-3">
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gradient-to-b from-cyber-700/50 via-dark-border to-transparent" />

        {day.entries.map((entry) => {
          const meta = getDiaryTypeMeta(entry.type)
          const amountDisplay = formatDiaryEntryAmount(entry)
          const canDelete = entry.type !== 'boss'

          return (
            <article
              key={entry.id}
              className="relative panel-light p-4 transition-colors"
              style={{
                borderLeft: `2px solid ${
                  amountDisplay.tone === 'expense'
                    ? 'rgba(239,68,68,0.35)'
                    : entry.type === 'boss'
                      ? 'rgba(251,191,36,0.35)'
                      : entry.type === 'drop'
                        ? 'rgba(251,191,36,0.25)'
                        : amountDisplay.tone === 'neutral'
                          ? 'rgba(167,139,250,0.35)'
                          : 'rgba(34,211,238,0.35)'
                }`,
              }}
            >
              <div className="absolute -left-6 top-5 w-[18px] h-[18px] rounded-full bg-dark-bg border-2 border-cyber-600/50 flex items-center justify-center text-[10px]">
                {meta.icon}
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
                  </div>
                  <p className="text-sm font-medium text-slate-200 mt-1">{entry.title}</p>
                  {(entry.detail || entry.memo) && (
                    <p className="text-xs text-slate-500 mt-0.5">{entry.detail ?? entry.memo}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
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
    </section>
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

function ScopeButton({
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
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
        active
          ? 'bg-cyber-500/20 border-cyber-500/40 text-cyber-300'
          : 'border-dark-border text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  )
}
