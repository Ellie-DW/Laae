import { useMemo, useState } from 'react'
import type { Character, HuntRecord, GatherRecord, Expense, DropRecord, BossSnapshot, CharacterBossData } from '../types'
import { buildDiaryDays, getDiaryTypeMeta, type DiaryDay } from '../lib/diaryEntries'
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
  onRemoveDrop: (id: string) => Promise<void>
}

type ViewMode = 'list' | 'calendar'

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
  onRemoveDrop,
}: DiaryPageProps) {
  const [filterCharacterId, setFilterCharacterId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const charFilter = filterCharacterId ?? undefined

  const days = useMemo(
    () => buildDiaryDays(hunts, gathers, expenses, characters, {
      characterId: charFilter,
      drops,
      snapshots,
      bossDataMap,
    }),
    [hunts, gathers, expenses, drops, characters, snapshots, bossDataMap, filterCharacterId]
  )

  const { weeks, monthTotal } = useMemo(
    () => buildMonthCalendar(
      yearMonth.year,
      yearMonth.month,
      hunts,
      gathers,
      expenses,
      drops,
      charFilter,
      bossDataMap,
      characters
    ),
    [yearMonth, hunts, gathers, expenses, drops, bossDataMap, characters, filterCharacterId]
  )

  const selectedDay = useMemo(() => {
    if (!selectedDate) return null
    return days.find((d) => d.date === selectedDate) ?? null
  }, [days, selectedDate])

  const handleRemove = async (entryId: string) => {
    if (entryId.startsWith('hunt-')) await onRemoveHunt(entryId.slice(5))
    else if (entryId.startsWith('gather-')) await onRemoveGather(entryId.slice(7))
    else if (entryId.startsWith('drop-')) await onRemoveDrop(entryId.slice(5))
    else if (entryId.startsWith('expense-')) await onRemoveExpense(entryId.slice(8))
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
          <p className="text-sm text-slate-500 mt-1">사냥·채집·지출을 추가하면 다이어리에 쌓여요</p>
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

function DaySection({
  day,
  showCharacter,
  onRemove,
}: {
  day: DiaryDay
  showCharacter: boolean
  onRemove: (id: string) => void
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
          const isExpense = entry.amount < 0
          const canDelete = entry.type !== 'boss'

          return (
            <article
              key={entry.id}
              className="relative panel-light p-4 transition-colors"
              style={{
                borderLeft: `2px solid ${
                  isExpense
                    ? 'rgba(239,68,68,0.35)'
                    : entry.type === 'boss'
                      ? 'rgba(251,191,36,0.35)'
                      : entry.type === 'drop'
                        ? 'rgba(251,191,36,0.25)'
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
                    <p className="text-xs text-slate-500 mt-0.5">
                      {[entry.detail, entry.memo].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-bold ${isExpense ? 'text-red-400' : 'text-cyber-400'}`}>
                    {isExpense ? '' : '+'}{formatMesoKorean(entry.amount)}
                  </span>
                  {canDelete && (
                    <button
                      onClick={() => onRemove(entry.id)}
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
