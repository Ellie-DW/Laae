import { useMemo, useState, type ReactNode } from 'react'
import type { Character, Goal, HuntRecord, GatherRecord, Expense, Income, DropRecord, BossSnapshot, CharacterBossData, RiceRecord } from '../types'
import type { AccountStats } from '../lib/bossStats'
import type { LedgerSummary, DailyNetEntry, CategoryBreakdown, GoalProgress } from '../lib/ledgerAnalytics'
import { EXPENSE_CATEGORY_LABEL } from '../lib/ledgerApi'
import { buildDiaryDays, formatDiaryEntryAmount, getRecentDiaryEntries } from '../lib/diaryEntries'
import DiaryTypeIcon from '../components/diary/DiaryTypeIcon'
import {
  calculateMonthlyExpectedBossStats,
  calculateAccountMonthlyExpectedBossStats,
  getBossClearStatus,
  getPlannedBossCycles,
  isWeeklyBossCleared,
  isMonthlyBossCleared,
} from '../lib/bossStats'
import { createDefaultBossData } from '../lib/appDataApi'
import { formatMesoKorean, getToday } from '../utils'
import { isGoalActive, isGoalNotStarted } from '../lib/goalHelpers'
import DropDashboardSection from '../components/drop/DropDashboardSection'
import CumulativeDashboardSection from '../components/dashboard/CumulativeDashboardSection'
import GoalProgressCard from '../components/goals/GoalProgressCard'

type Period = 'month' | 'week'

interface DashboardPageProps {
  characters: Character[]
  selectedCharacter: Character | null
  accountStats: AccountStats
  selectedBossTotalMeso: number
  bossDataMap: Record<string, CharacterBossData>
  ledgerSummary: LedgerSummary
  weekSummary: LedgerSummary
  weekLabel: string
  selectedLedgerSummary: LedgerSummary | null
  dailyNet: DailyNetEntry[]
  expenseByCategory: CategoryBreakdown[]
  goals: Goal[]
  currentMonth: string
  getGoalProgress: (goal: Goal) => GoalProgress
  onSelectCharacter: (id: string) => void
  onToggleWeeklyBossCleared: (characterId: string) => void
  onToggleMonthlyBossCleared: (characterId: string) => void
  onGoBoss: () => void
  onOpenDiary: () => void
  onGoDrop: () => void
  onGoGoals: () => void
  diaryHunts: HuntRecord[]
  diaryGathers: GatherRecord[]
  diaryExpenses: Expense[]
  diaryIncomes: Income[]
  diaryDrops: DropRecord[]
  diarySnapshots: BossSnapshot[]
  diaryRiceRecords?: RiceRecord[]
}

export default function DashboardPage({
  characters,
  selectedCharacter,
  accountStats,
  selectedBossTotalMeso,
  bossDataMap,
  ledgerSummary,
  weekSummary,
  weekLabel,
  selectedLedgerSummary,
  dailyNet,
  expenseByCategory,
  goals,
  currentMonth,
  getGoalProgress,
  onSelectCharacter,
  onToggleWeeklyBossCleared,
  onToggleMonthlyBossCleared,
  onGoBoss,
  onOpenDiary,
  onGoDrop,
  onGoGoals,
  diaryHunts,
  diaryGathers,
  diaryExpenses,
  diaryIncomes,
  diaryDrops,
  diarySnapshots,
  diaryRiceRecords,
}: DashboardPageProps) {
  const [period, setPeriod] = useState<Period>('month')
  const [showAllBosses, setShowAllBosses] = useState(false)

  const recentDiary = useMemo(() => {
    const days = buildDiaryDays(diaryHunts, diaryGathers, diaryExpenses, characters, {
      incomes: diaryIncomes,
      drops: diaryDrops,
      snapshots: diarySnapshots,
      bossDataMap,
      riceRecords: diaryRiceRecords,
    })
    const dayLabelByDate = Object.fromEntries(days.map((d) => [d.date, d.label]))
    return getRecentDiaryEntries(days, 5).map((entry) => ({
      ...entry,
      dayLabel: dayLabelByDate[entry.recordDate] ?? entry.recordDate,
    }))
  }, [diaryHunts, diaryGathers, diaryExpenses, diaryIncomes, diaryDrops, diarySnapshots, diaryRiceRecords, bossDataMap, characters])

  const charStatsById = useMemo(
    () => Object.fromEntries(accountStats.perCharacter.map((c) => [c.id, c])),
    [accountStats.perCharacter]
  )

  const monthlyExpectedBoss = useMemo(
    () => calculateAccountMonthlyExpectedBossStats(characters, bossDataMap, createDefaultBossData(), currentMonth, getToday()),
    [characters, bossDataMap, currentMonth]
  )

  const hasExpectedBossIncome =
    monthlyExpectedBoss.weeklyPerWeek > 0 || monthlyExpectedBoss.monthlyPerMonth > 0

  const periodSummary = period === 'month' ? ledgerSummary : weekSummary
  const periodLabel = period === 'month' ? `${currentMonth} · 이번 달` : `이번 주 · ${weekLabel}`

  const bossCompletion = useMemo(() => {
    let done = 0
    let pending = 0
    for (const character of characters) {
      const bossData = bossDataMap[character.id] ?? createDefaultBossData()
      const status = getBossClearStatus(bossData)
      if (status.tone === 'done') done += 1
      else pending += 1
    }
    return { done, pending, total: characters.length }
  }, [characters, bossDataMap])

  const visibleBossCharacters = useMemo(() => {
    if (showAllBosses) return characters
    return characters.filter((character) => {
      const bossData = bossDataMap[character.id] ?? createDefaultBossData()
      return getBossClearStatus(bossData).tone !== 'done'
    })
  }, [characters, bossDataMap, showAllBosses])

  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4 drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]">🍁</span>
        <h2 className="text-lg font-semibold text-slate-300">등록된 캐릭터 없음</h2>
        <p className="text-sm text-slate-500 mt-2">캐릭터를 추가해주세요</p>
      </div>
    )
  }

  const selectedSummary = selectedCharacter
    ? accountStats.perCharacter.find((c) => c.id === selectedCharacter.id)
    : null

  const activeGoals = goals.filter(
    (g) =>
      g.characterId === null &&
      (isGoalActive(g.startDate, g.endDate) || isGoalNotStarted(g.startDate))
  )
  const expenseTotal = expenseByCategory.reduce((s, c) => s + c.amount, 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">대시보드</h1>
        <p className="text-sm text-slate-500 mt-1">
          {accountStats.characterCount}개 캐릭터 통합 현황
        </p>
      </div>

      <div className="space-y-4">
        <PeriodToggle period={period} onChange={setPeriod} weekLabel={weekLabel} />
        <HeroSummaryCard summary={periodSummary} periodLabel={periodLabel} />
        <IncomeExpenseBar income={periodSummary.recordedIncome} expense={periodSummary.expenseTotal} />
      </div>

      <CumulativeDashboardSection
        characters={characters}
        hunts={diaryHunts}
        gathers={diaryGathers}
        drops={diaryDrops}
        expenses={diaryExpenses}
        incomes={diaryIncomes}
        snapshots={diarySnapshots}
        bossDataMap={bossDataMap}
      />

      <div className="panel-light p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-semibold text-slate-100 mb-1">보스 체크</h2>
            <p className="text-xs text-slate-500">
              {bossCompletion.done}/{bossCompletion.total} 완료
              {bossCompletion.pending > 0 && (
                <span className="text-amber-400"> · {bossCompletion.pending}명 남음</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAllBosses((v) => !v)}
            className="text-xs text-cyber-400 hover:text-cyber-300 border border-cyber-700/40 px-3 py-1.5 rounded-lg hover:bg-cyber-500/10 transition-colors shrink-0"
          >
            {showAllBosses ? '미완료만' : '전체 보기'}
          </button>
        </div>

        {hasExpectedBossIncome && (
          <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-dark-border/40 text-sm">
            {monthlyExpectedBoss.weeklyPerWeek > 0 && (
              <div>
                <p className="text-xs text-slate-500">주간 예상</p>
                <p className="font-semibold text-cyber-400">{formatMesoKorean(monthlyExpectedBoss.weeklyPerWeek)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500">{currentMonth} 월간 예상</p>
              <p className="font-semibold text-maple-400">{formatMesoKorean(monthlyExpectedBoss.monthlyExpectedTotal)}</p>
            </div>
          </div>
        )}

        {visibleBossCharacters.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-emerald-400 font-medium">이번 주·달 보스 모두 완료!</p>
            <button
              type="button"
              onClick={() => setShowAllBosses(true)}
              className="mt-2 text-xs text-slate-500 hover:text-slate-300"
            >
              전체 캐릭터 보기
            </button>
          </div>
        ) : (
          <div className="record-list-scroll space-y-2">
            {visibleBossCharacters.map((character) => (
              <CharacterBossRow
                key={character.id}
                character={character}
                char={charStatsById[character.id]}
                accountTotalMeso={accountStats.totalMeso}
                bossData={bossDataMap[character.id] ?? createDefaultBossData()}
                currentMonth={currentMonth}
                isSelected={selectedCharacter?.id === character.id}
                onSelectCharacter={onSelectCharacter}
                onToggleWeeklyBossCleared={onToggleWeeklyBossCleared}
                onToggleMonthlyBossCleared={onToggleMonthlyBossCleared}
              />
            ))}
          </div>
        )}

        {selectedCharacter && (bossDataMap[selectedCharacter.id] ?? createDefaultBossData()).selections.filter((s) => s.checked).length === 0 && (
          <button
            type="button"
            onClick={onGoBoss}
            className="mt-3 text-xs text-cyber-400 hover:text-cyber-300"
          >
            {selectedCharacter.name} 보스 난이도 설정 →
          </button>
        )}
      </div>

      {recentDiary.length > 0 && (
        <div className="panel-light p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-100">최근 다이어리</h2>
              <p className="text-xs text-slate-500 mt-0.5">전체 캐릭터 · 최근 기록</p>
            </div>
            <button
              type="button"
              onClick={onOpenDiary}
              className="text-xs text-cyber-400 hover:text-cyber-300 border border-cyber-700/40 px-3 py-1.5 rounded-lg hover:bg-cyber-500/10 transition-colors"
            >
              전체 보기 →
            </button>
          </div>

          <div className="relative pl-5 space-y-2">
            <div className="absolute left-[7px] top-1 bottom-1 w-px bg-dark-border" />
            {recentDiary.map((entry) => {
              const amountDisplay = formatDiaryEntryAmount(entry)
              return (
                <div key={entry.id} className="relative flex items-center gap-3 py-1.5">
                  <span className="absolute -left-5 w-3 h-3 rounded-full bg-dark-bg border border-cyber-600/40 flex items-center justify-center overflow-hidden">
                    <DiaryTypeIcon type={entry.type} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">{entry.title}</p>
                    <p className="text-xs text-slate-600">
                      {entry.characterName} · {entry.dayLabel}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold shrink-0 ${
                      amountDisplay.tone === 'expense'
                        ? 'text-red-400'
                        : amountDisplay.tone === 'neutral'
                          ? 'text-violet-400'
                          : 'text-cyber-400'
                    }`}
                  >
                    {amountDisplay.text}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeGoals.length > 0 && (
        <div className="panel-light p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-100">목표 진행</h2>
              <p className="text-xs text-slate-500 mt-0.5">진행 중 · {getToday()}</p>
            </div>
            <button
              type="button"
              onClick={onGoGoals}
              className="text-xs text-cyber-400 hover:text-cyber-300 border border-cyber-700/40 px-3 py-1.5 rounded-lg hover:bg-cyber-500/10 transition-colors"
            >
              목표 관리 →
            </button>
          </div>
          <div className="space-y-3">
            {activeGoals.slice(0, 3).map((goal, index) => {
              const progress = getGoalProgress(goal)
              return (
                <GoalProgressCard
                  key={goal.id}
                  goal={goal}
                  progress={progress}
                  scopeLabel="계정 전체"
                  compact
                  highlighted={index === 0}
                />
              )
            })}
          </div>
        </div>
      )}

      {selectedCharacter && selectedSummary && selectedLedgerSummary && (
        <div className="panel-light p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-slate-100">{selectedCharacter.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{currentMonth} 캐릭터별 현황</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MiniStat label="수익" value={selectedLedgerSummary.recordedIncome} tone="income" />
            <MiniStat label="지출" value={selectedLedgerSummary.expenseTotal} tone="expense" />
            <MiniStat
              label="순수익"
              value={selectedLedgerSummary.netProfit}
              tone={selectedLedgerSummary.netProfit >= 0 ? 'net' : 'expense'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-dark-border/60 bg-dark-surface/40 p-4">
              <h3 className="font-semibold text-slate-100 mb-3 text-sm">보스 수익 내역</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">주간 보스</span>
                  <span className="text-cyber-400">{formatMesoKorean(selectedSummary.weeklyBossMeso)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">월간 보스</span>
                  <span className="text-maple-400">{formatMesoKorean(selectedSummary.monthlyBossMeso)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">드랍템</span>
                  <span className="text-slate-200">{formatMesoKorean(selectedLedgerSummary.dropIncome)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-dark-border/60 bg-dark-surface/40 p-4">
              <h3 className="font-semibold text-slate-100 mb-3 text-sm">지출 카테고리</h3>
              {expenseTotal === 0 ? (
                <p className="text-sm text-slate-500">아직 지출이 없어요.</p>
              ) : (
                <div className="space-y-1.5">
                  {expenseByCategory.filter((c) => c.amount > 0).map((cat) => (
                    <div key={cat.category} className="flex justify-between text-sm">
                      <span className="text-slate-500">{EXPENSE_CATEGORY_LABEL[cat.category]}</span>
                      <span className="text-red-400">{formatMesoKorean(cat.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <CollapsibleSection
        title="통계 · 상세"
        subtitle="보스·드랍 상세, 최근 7일 차트"
      >
        <div className="panel-light p-4">
          <p className="text-xs text-slate-500 mb-2">보스 수익 상세</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-maple-400 font-semibold">{formatMesoKorean(accountStats.totalMeso)}</span>
            <span className="text-slate-500">주간 {formatMesoKorean(accountStats.weeklyBossMeso)}</span>
            <span className="text-slate-500">월간 {formatMesoKorean(accountStats.monthlyBossMeso)}</span>
            <span className="text-slate-500">드랍 {formatMesoKorean(ledgerSummary.dropIncome)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashCard label="캐릭터 수" value={`${accountStats.characterCount}개`} />
          <DashCard label="주간 잡은 보스" value={`${accountStats.weeklyCheckedBossCount}개`} sub="목요일 초기화" />
          <DashCard label="월간 잡은 보스" value={`${accountStats.monthlyCheckedBossCount}개`} sub="매월 1일 초기화" />
          <DashCard
            label="선택 캐릭터 보스"
            value={selectedCharacter ? formatMesoKorean(selectedBossTotalMeso) : '-'}
            sub={selectedCharacter?.name}
          />
        </div>

        <DropDashboardSection
          drops={diaryDrops}
          hunts={diaryHunts}
          onGoDrop={onGoDrop}
        />

        <DailyNetChart dailyNet={dailyNet} />
      </CollapsibleSection>
    </div>
  )
}

function PeriodToggle({
  period,
  onChange,
  weekLabel,
}: {
  period: Period
  onChange: (period: Period) => void
  weekLabel: string
}) {
  return (
    <div className="flex gap-1 p-1 bg-dark-surface/60 rounded-lg border border-dark-border/60 w-fit">
      <button
        type="button"
        onClick={() => onChange('month')}
        className={`px-4 py-2 rounded-md text-sm transition-all duration-200 ${
          period === 'month'
            ? 'bg-cyber-500/20 text-cyber-300 font-semibold'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        이번 달
      </button>
      <button
        type="button"
        onClick={() => onChange('week')}
        className={`px-4 py-2 rounded-md text-sm transition-all duration-200 ${
          period === 'week'
            ? 'bg-cyber-500/20 text-cyber-300 font-semibold'
            : 'text-slate-500 hover:text-slate-300'
        }`}
        title={weekLabel}
      >
        이번 주
      </button>
    </div>
  )
}

function HeroSummaryCard({
  summary,
  periodLabel,
}: {
  summary: LedgerSummary
  periodLabel: string
}) {
  const netColor = summary.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="panel-glow p-6 border-emerald-500/20">
      <p className="text-sm text-slate-400">{periodLabel}</p>
      <p className={`text-4xl md:text-5xl font-bold mt-2 font-display tracking-wide ${netColor}`}>
        {formatMesoKorean(summary.netProfit)}
      </p>
      <p className="text-xs text-slate-500 mt-1">순수익 (수익 − 지출)</p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-sm">
        <span className="text-cyber-400">수익 {formatMesoKorean(summary.recordedIncome)}</span>
        <span className="text-red-400">지출 {formatMesoKorean(summary.expenseTotal)}</span>
        <span className="text-slate-500">{summary.expenseCount}건 지출</span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-xs text-slate-500">
        {ledgerIncomeBreakdown(summary).map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
    </div>
  )
}

function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string
  subtitle: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="panel-light overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-dark-surface/30 transition-colors"
      >
        <div>
          <h2 className="font-semibold text-slate-100">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <span
          className={`text-slate-500 text-sm transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▼
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-dark-border/40 pt-5">
          {children}
        </div>
      )}
    </div>
  )
}

function CharacterBossRow({
  character,
  char,
  accountTotalMeso,
  bossData,
  currentMonth,
  isSelected,
  onSelectCharacter,
  onToggleWeeklyBossCleared,
  onToggleMonthlyBossCleared,
}: {
  character: Character
  char: AccountStats['perCharacter'][number] | undefined
  accountTotalMeso: number
  bossData: CharacterBossData
  currentMonth: string
  isSelected: boolean
  onSelectCharacter: (id: string) => void
  onToggleWeeklyBossCleared: (characterId: string) => void
  onToggleMonthlyBossCleared: (characterId: string) => void
}) {
  if (!char) return null

  const share = accountTotalMeso > 0 ? Math.round((char.totalMeso / accountTotalMeso) * 100) : 0
  const { hasWeekly, hasMonthly, weeklyCount, monthlyCount, count: plannedCount } = getPlannedBossCycles(bossData)
  const weekCleared = isWeeklyBossCleared(bossData)
  const monthCleared = isMonthlyBossCleared(bossData)
  const clearStatus = getBossClearStatus(bossData)
  const monthlyExpected = calculateMonthlyExpectedBossStats(bossData, currentMonth, getToday())
  const hasIncome = char.totalMeso > 0
  const hasBossSetup = hasWeekly || hasMonthly
  const showWeeklyExpected = plannedCount > 0 && monthlyExpected.weeklyPerWeek > 0
  const showMonthlyExpected = plannedCount > 0 && (
    monthlyExpected.monthlyExpectedTotal > 0 || monthlyExpected.monthlyPerMonth > 0
  )

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        isSelected
          ? 'bg-cyber-500/10 border-cyber-500/30'
          : 'bg-dark-surface/50 border-dark-border'
      } ${weekCleared || monthCleared ? 'ring-1 ring-emerald-500/20' : ''}`}
    >
      <div className="flex flex-col gap-1 shrink-0">
        {hasWeekly && (
          <BossCycleCheck
            label="주"
            checked={weekCleared}
            onToggle={() => onToggleWeeklyBossCleared(character.id)}
            title={weekCleared ? '주간 잡음 해제' : '주간 보스 잡음 (매주 목요일 초기화)'}
            accent="cyber"
          />
        )}
        {hasMonthly && (
          <BossCycleCheck
            label="월"
            checked={monthCleared}
            onToggle={() => onToggleMonthlyBossCleared(character.id)}
            title={monthCleared ? '월간 잡음 해제' : '월간 보스 잡음 (매월 1일 초기화)'}
            accent="maple"
          />
        )}
        {!hasBossSetup && (
          <div
            className="w-6 h-6 rounded border-2 border-slate-700/50 opacity-30"
            title="보스 페이지에서 난이도를 설정하세요"
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => onSelectCharacter(character.id)}
        className="flex-1 min-w-0 text-left"
      >
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm font-medium ${isSelected ? 'text-cyber-300' : 'text-slate-200'}`}>
            {character.name}
          </span>
          <span className={`text-sm font-semibold shrink-0 text-right ${hasIncome || weekCleared || monthCleared ? 'text-maple-400' : 'text-slate-500'}`}>
            {hasIncome ? (
              formatMesoKorean(char.totalMeso)
            ) : showWeeklyExpected || showMonthlyExpected ? (
              <span className="flex flex-col items-end gap-0.5">
                {showWeeklyExpected && (
                  <span className="text-cyber-400 text-xs">
                    주 {formatMesoKorean(monthlyExpected.weeklyPerWeek)}
                  </span>
                )}
                {showMonthlyExpected && (
                  <span>월 {formatMesoKorean(monthlyExpected.monthlyExpectedTotal)}</span>
                )}
              </span>
            ) : (
              '-'
            )}
          </span>
        </div>
        <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-500">
          {weeklyCount > 0 && <span className="text-cyber-400/80">주간보스 {weeklyCount}</span>}
          {monthlyCount > 0 && <span className="text-maple-400/80">월간보스 {monthlyCount}</span>}
          {plannedCount === 0 && <span>보스 미설정</span>}
          {showMonthlyExpected && !hasIncome && monthlyExpected.weeksInMonth > 0 && (
            <span>주 {monthlyExpected.weeksInMonth}회</span>
          )}
          <span className={clearStatus.tone === 'done' ? 'text-emerald-400' : clearStatus.tone === 'pending' ? 'text-amber-400' : ''}>
            {clearStatus.label}
          </span>
          {hasIncome && accountTotalMeso > 0 && <span>비중 {share}%</span>}
        </div>
        {hasIncome && accountTotalMeso > 0 && (
          <div className="mt-2 h-1.5 bg-dark-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyber-600 to-maple-500 rounded-full transition-all"
              style={{ width: `${share}%` }}
            />
          </div>
        )}
      </button>
    </div>
  )
}

function DailyNetChart({ dailyNet }: { dailyNet: DailyNetEntry[] }) {
  return (
    <div className="panel-light p-5">
      <h2 className="font-semibold text-slate-100 mb-1">최근 7일</h2>
      <p className="text-xs text-slate-500 mb-4">일자별 수익·지출 (보스 제외)</p>

      {dailyNet.every((d) => d.net === 0 && d.income === 0 && d.expense === 0) ? (
        <div className="h-36 flex items-center justify-center text-slate-600 text-sm border border-dashed border-dark-border rounded-lg bg-dark-surface/30">
          기록을 추가하면 차트가 표시됩니다
        </div>
      ) : (
        <div className="flex items-end gap-2 h-36">
          {dailyNet.map((day) => {
            const maxVal = Math.max(...dailyNet.map((d) => Math.max(d.income, d.expense)), 1)
            const incomeH = day.income > 0 ? Math.max(4, (day.income / maxVal) * 100) : 0
            const expenseH = day.expense > 0 ? Math.max(4, (day.expense / maxVal) * 100) : 0
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <span className={`text-xs ${day.net >= 0 ? 'text-cyber-400' : 'text-red-400'}`}>
                  {day.net !== 0 ? formatMesoKorean(day.net) : '-'}
                </span>
                <div className="w-full flex items-end justify-center gap-0.5 h-24">
                  <div
                    className="w-[40%] max-w-[16px] rounded-t bg-cyber-500/70"
                    style={{ height: `${incomeH}%` }}
                    title={`수익: ${formatMesoKorean(day.income)}`}
                  />
                  <div
                    className="w-[40%] max-w-[16px] rounded-t bg-red-500/70"
                    style={{ height: `${expenseH}%` }}
                    title={`지출: ${formatMesoKorean(day.expense)}`}
                  />
                </div>
                <span className="text-xs text-slate-500">{day.date.slice(5)}</span>
              </div>
            )
          })}
        </div>
      )}
      <div className="flex justify-center gap-4 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-cyber-500/70" /> 수익</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/70" /> 지출</span>
      </div>
    </div>
  )
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'income' | 'expense' | 'net'
}) {
  const color =
    tone === 'income' ? 'text-cyber-400'
    : tone === 'expense' ? 'text-red-400'
    : 'text-emerald-400'

  return (
    <div className="rounded-lg border border-dark-border/60 bg-dark-surface/40 p-3 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-bold mt-1 ${color}`}>
        {tone === 'expense' ? formatMesoKorean(value) : formatMesoKorean(value)}
      </p>
    </div>
  )
}

function BossCycleCheck({
  label,
  checked,
  onToggle,
  title,
  accent,
}: {
  label: string
  checked: boolean
  onToggle: () => void
  title: string
  accent: 'cyber' | 'maple'
}) {
  const active =
    accent === 'cyber'
      ? 'bg-cyber-500 border-cyber-500 text-white'
      : 'bg-maple-500 border-maple-500 text-white'
  const hover =
    accent === 'cyber'
      ? 'hover:border-cyber-500 hover:bg-cyber-500/10'
      : 'hover:border-maple-500 hover:bg-maple-500/10'

  return (
    <button
      type="button"
      onClick={onToggle}
      title={title}
      className={`w-6 h-6 rounded border-2 flex items-center justify-center text-[9px] font-bold transition-colors ${
        checked ? active : `border-slate-600 text-slate-500 ${hover}`
      }`}
    >
      {checked ? '✓' : label}
    </button>
  )
}

function ledgerIncomeBreakdown(summary: LedgerSummary): string[] {
  const items = [`사냥 ${formatMesoKorean(summary.huntMesoIncome)}`]
  if (summary.solErdaSaleIncome > 0) {
    items.push(`솔에르다 ${formatMesoKorean(summary.solErdaSaleIncome)}`)
  }
  items.push(
    `채집 ${formatMesoKorean(summary.gatherIncome)}`,
    `드랍 ${formatMesoKorean(summary.dropIncome)}`,
    `보스 ${formatMesoKorean(summary.bossIncome)}`
  )
  return items
}

function DashCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="panel-light p-4 hover:border-cyber-700/30 transition-colors">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-100 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1 truncate">{sub}</p>}
    </div>
  )
}

function IncomeExpenseBar({ income, expense }: { income: number; expense: number }) {
  const total = income + expense
  if (total === 0) return null

  const incomePct = Math.round((income / total) * 100)
  const expensePct = 100 - incomePct

  return (
    <div className="panel-light p-4">
      <div className="flex justify-between text-xs text-slate-500 mb-2">
        <span className="text-cyber-400">수익 {incomePct}%</span>
        <span className="text-red-400">지출 {expensePct}%</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden flex bg-dark-border">
        <div className="bg-gradient-to-r from-cyber-600 to-cyber-400 transition-all" style={{ width: `${incomePct}%` }} />
        <div className="bg-gradient-to-r from-red-600 to-red-400 transition-all" style={{ width: `${expensePct}%` }} />
      </div>
    </div>
  )
}
