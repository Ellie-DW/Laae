import { useMemo } from 'react'
import type { Character, Goal, HuntRecord, GatherRecord, Expense, DropRecord, BossSnapshot, CharacterBossData } from '../types'
import type { AccountStats } from '../lib/bossStats'
import type { LedgerSummary, DailyNetEntry, CategoryBreakdown, GoalProgress } from '../lib/ledgerAnalytics'
import { EXPENSE_CATEGORY_LABEL } from '../lib/ledgerApi'
import { buildDiaryDays, getDiaryTypeMeta, getRecentDiaryEntries } from '../lib/diaryEntries'
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
import { formatHuntIncomeSub } from '../lib/huntStats'
import DropDashboardSection from '../components/drop/DropDashboardSection'
import CumulativeDashboardSection from '../components/dashboard/CumulativeDashboardSection'

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
  diaryHunts: HuntRecord[]
  diaryGathers: GatherRecord[]
  diaryExpenses: Expense[]
  diaryDrops: DropRecord[]
  diarySnapshots: BossSnapshot[]
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
  diaryHunts,
  diaryGathers,
  diaryExpenses,
  diaryDrops,
  diarySnapshots,
}: DashboardPageProps) {
  const recentDiary = useMemo(() => {
    const days = buildDiaryDays(diaryHunts, diaryGathers, diaryExpenses, characters, {
      drops: diaryDrops,
      snapshots: diarySnapshots,
      bossDataMap,
    })
    const dayLabelByDate = Object.fromEntries(days.map((d) => [d.date, d.label]))
    return getRecentDiaryEntries(days, 6).map((entry) => ({
      ...entry,
      dayLabel: dayLabelByDate[entry.recordDate] ?? entry.recordDate,
    }))
  }, [diaryHunts, diaryGathers, diaryExpenses, diaryDrops, diarySnapshots, bossDataMap, characters])

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

  const monthGoals = goals.filter(
    (g) => g.periodMonth === currentMonth && (!g.characterId || g.characterId === selectedCharacter?.id)
  )
  const expenseTotal = expenseByCategory.reduce((s, c) => s + c.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">대시보드</h1>
        <p className="text-sm text-slate-500 mt-1">
          {accountStats.characterCount}개 캐릭터 통합 현황
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MoneyCard
          label="이번 달 수익"
          value={ledgerSummary.recordedIncome}
          tone="income"
          sub={`${formatHuntIncomeSub(ledgerSummary.huntMesoIncome, ledgerSummary.solErdaSaleIncome)} · 채집 ${formatMesoKorean(ledgerSummary.gatherIncome)} · 드랍 ${formatMesoKorean(ledgerSummary.dropIncome)} · 보스 ${formatMesoKorean(ledgerSummary.bossIncome)}`}
        />
        <MoneyCard
          label="이번 달 지출"
          value={ledgerSummary.expenseTotal}
          tone="expense"
          sub={`${ledgerSummary.expenseCount}건 기록`}
        />
        <MoneyCard
          label="이번 달 순수익"
          value={ledgerSummary.netProfit}
          tone="net"
          sub="수익 − 지출"
        />
      </div>

      <IncomeExpenseBar income={ledgerSummary.recordedIncome} expense={ledgerSummary.expenseTotal} />

      <div>
        <p className="text-xs text-slate-500 mb-3">이번 주 · {weekLabel} · 목요일 초기화</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MoneyCard
            label="이번 주 수익"
            value={weekSummary.recordedIncome}
            tone="income"
            sub={`${formatHuntIncomeSub(weekSummary.huntMesoIncome, weekSummary.solErdaSaleIncome)} · 채집 ${formatMesoKorean(weekSummary.gatherIncome)} · 드랍 ${formatMesoKorean(weekSummary.dropIncome)} · 보스 ${formatMesoKorean(weekSummary.bossIncome)}`}
          />
          <MoneyCard
            label="이번 주 지출"
            value={weekSummary.expenseTotal}
            tone="expense"
            sub={`${weekSummary.expenseCount}건 기록`}
          />
          <MoneyCard
            label="이번 주 순수익"
            value={weekSummary.netProfit}
            tone="net"
            sub="수익 − 지출"
          />
        </div>
      </div>

      <IncomeExpenseBar income={weekSummary.recordedIncome} expense={weekSummary.expenseTotal} />

      <CumulativeDashboardSection
        characters={characters}
        hunts={diaryHunts}
        gathers={diaryGathers}
        drops={diaryDrops}
        expenses={diaryExpenses}
        snapshots={diarySnapshots}
        bossDataMap={bossDataMap}
      />

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

      <div className="panel-light p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-semibold text-slate-100 mb-1">캐릭터별 보스 수익</h2>
            <p className="text-xs text-slate-500">주간·월간 보스 각각 체크 · 주간은 목요일, 월간은 매월 1일 초기화</p>
          </div>
          {hasExpectedBossIncome && (
            <div className="text-right shrink-0 space-y-2">
              {monthlyExpectedBoss.weeklyPerWeek > 0 && (
                <div>
                  <p className="text-xs text-slate-500">주간 예상 (1주)</p>
                  <p className="text-base font-bold text-cyber-400">
                    {formatMesoKorean(monthlyExpectedBoss.weeklyPerWeek)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500">{currentMonth} 월간 예상</p>
                <p className="text-lg font-bold text-maple-400">
                  {formatMesoKorean(monthlyExpectedBoss.monthlyExpectedTotal)}
                </p>
                {(monthlyExpectedBoss.weeklyInMonthTotal > 0 || monthlyExpectedBoss.monthlyPerMonth > 0) && (
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {monthlyExpectedBoss.weeklyInMonthTotal > 0 && (
                      <span>주간 환산 {formatMesoKorean(monthlyExpectedBoss.weeklyInMonthTotal)}</span>
                    )}
                    {monthlyExpectedBoss.weeklyInMonthTotal > 0 && monthlyExpectedBoss.monthlyPerMonth > 0 && ' + '}
                    {monthlyExpectedBoss.monthlyPerMonth > 0 && (
                      <span>월간 주기 {formatMesoKorean(monthlyExpectedBoss.monthlyPerMonth)}</span>
                    )}
                  </p>
                )}
              </div>
              {accountStats.totalMeso > 0 && accountStats.totalMeso < monthlyExpectedBoss.monthlyExpectedTotal && (
                <p className="text-[10px] text-emerald-400">
                  이번 주·달 반영 {formatMesoKorean(accountStats.totalMeso)}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {characters.map((character) => {
            const char = charStatsById[character.id]
            if (!char) return null
            const isSelected = selectedCharacter?.id === char.id
            const share = accountStats.totalMeso > 0
              ? Math.round((char.totalMeso / accountStats.totalMeso) * 100)
              : 0
            const charBossData = bossDataMap[character.id] ?? createDefaultBossData()
            const { hasWeekly, hasMonthly, weeklyCount, monthlyCount, count: plannedCount } = getPlannedBossCycles(charBossData)
            const weekCleared = isWeeklyBossCleared(charBossData)
            const monthCleared = isMonthlyBossCleared(charBossData)
            const clearStatus = getBossClearStatus(charBossData)
            const monthlyExpected = calculateMonthlyExpectedBossStats(charBossData, currentMonth, getToday())
            const hasIncome = char.totalMeso > 0
            const hasBossSetup = hasWeekly || hasMonthly
            const showWeeklyExpected = plannedCount > 0 && monthlyExpected.weeklyPerWeek > 0
            const showMonthlyExpected = plannedCount > 0 && (
              monthlyExpected.monthlyExpectedTotal > 0 || monthlyExpected.monthlyPerMonth > 0
            )

            return (
              <div
                key={character.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-cyber-500/10 border-cyber-500/30'
                    : 'bg-dark-surface/50 border-dark-border'
                } ${(weekCleared || monthCleared) ? 'ring-1 ring-emerald-500/20' : ''}`}
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
                            <span>
                              월 {formatMesoKorean(monthlyExpected.monthlyExpectedTotal)}
                            </span>
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
                    {hasIncome && accountStats.totalMeso > 0 && <span>비중 {share}%</span>}
                  </div>
                  {hasIncome && accountStats.totalMeso > 0 && (
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
          })}
        </div>

        {selectedCharacter && (bossDataMap[selectedCharacter.id] ?? createDefaultBossData()).selections.filter((s) => s.checked).length === 0 && (
          <button
            onClick={onGoBoss}
            className="mt-3 text-xs text-cyber-400 hover:text-cyber-300"
          >
            {selectedCharacter.name} 보스 난이도 설정 →
          </button>
        )}
      </div>

      <DropDashboardSection
        drops={diaryDrops}
        hunts={diaryHunts}
        onGoDrop={onGoDrop}
      />

      {selectedCharacter && selectedSummary && selectedLedgerSummary && (
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-slate-100">{selectedCharacter.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{currentMonth} 캐릭터별 현황</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MoneyCard
              label="수익"
              value={selectedLedgerSummary.recordedIncome}
              tone="income"
              sub={`${formatHuntIncomeSub(selectedLedgerSummary.huntMesoIncome, selectedLedgerSummary.solErdaSaleIncome)} · 채집 ${formatMesoKorean(selectedLedgerSummary.gatherIncome)} · 드랍 ${formatMesoKorean(selectedLedgerSummary.dropIncome)} · 보스 ${formatMesoKorean(selectedLedgerSummary.bossIncome)}`}
              compact
            />
            <MoneyCard
              label="지출"
              value={selectedLedgerSummary.expenseTotal}
              tone="expense"
              sub={`${selectedLedgerSummary.expenseCount}건`}
              compact
            />
            <MoneyCard
              label="순수익"
              value={selectedLedgerSummary.netProfit}
              tone="net"
              sub="수익 − 지출"
              compact
            />
          </div>

          <IncomeExpenseBar
            income={selectedLedgerSummary.recordedIncome}
            expense={selectedLedgerSummary.expenseTotal}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="panel-light p-5">
              <h3 className="font-semibold text-slate-100 mb-3 text-sm">보스 breakdown</h3>
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

            <div className="panel-light p-5">
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

      {monthGoals.length > 0 && (
        <div className="panel-light p-5">
          <h2 className="font-semibold text-slate-100 mb-4">목표 진행</h2>
          <div className="space-y-3">
            {monthGoals.slice(0, 3).map((goal) => {
              const progress = getGoalProgress(goal)
              return (
                <div key={goal.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{goal.title}</span>
                    <span className="text-cyber-400">{progress.percent}%</span>
                  </div>
                  <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyber-600 to-maple-500 rounded-full"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {recentDiary.length > 0 && (
        <div className="panel-light p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-100">최근 다이어리</h2>
              <p className="text-xs text-slate-500 mt-0.5">전체 캐릭터 · 최근 기록</p>
            </div>
            <button
              onClick={onOpenDiary}
              className="text-xs text-cyber-400 hover:text-cyber-300 border border-cyber-700/40 px-3 py-1.5 rounded-lg hover:bg-cyber-500/10 transition-colors"
            >
              전체 보기 →
            </button>
          </div>

          <div className="relative pl-5 space-y-2">
            <div className="absolute left-[7px] top-1 bottom-1 w-px bg-dark-border" />
            {recentDiary.map((entry) => {
              const meta = getDiaryTypeMeta(entry.type)
              const isExpense = entry.amount < 0
              return (
                <div key={entry.id} className="relative flex items-center gap-3 py-1.5">
                  <span className="absolute -left-5 w-3 h-3 rounded-full bg-dark-bg border border-cyber-600/40 text-[8px] flex items-center justify-center">
                    {meta.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">{entry.title}</p>
                    <p className="text-[10px] text-slate-600">
                      {entry.characterName} · {entry.dayLabel}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold shrink-0 ${isExpense ? 'text-red-400' : 'text-cyber-400'}`}>
                    {isExpense ? '' : '+'}{formatMesoKorean(entry.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
                  <span className={`text-[10px] ${day.net >= 0 ? 'text-cyber-400' : 'text-red-400'}`}>
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
                  <span className="text-[10px] text-slate-500">{day.date.slice(5)}</span>
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

function DashCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="panel-light p-4 hover:border-cyber-700/30 transition-colors">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-100 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1 truncate">{sub}</p>}
    </div>
  )
}

function MoneyCard({
  label,
  value,
  tone,
  sub,
  compact,
}: {
  label: string
  value: number
  tone: 'income' | 'expense' | 'net'
  sub?: string
  compact?: boolean
}) {
  const color =
    tone === 'income' ? 'text-cyber-400'
    : tone === 'expense' ? 'text-red-400'
    : value >= 0 ? 'text-emerald-400' : 'text-red-400'

  const border =
    tone === 'income' ? 'border-cyber-700/30'
    : tone === 'expense' ? 'border-red-500/20'
    : 'border-emerald-500/20'

  return (
    <div className={`panel-glow p-5 ${border} ${compact ? 'p-4' : ''}`}>
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`${compact ? 'text-2xl' : 'text-3xl'} font-bold mt-1 font-display tracking-wide ${color}`}>
        {tone === 'expense' ? `-${formatMesoKorean(value)}` : formatMesoKorean(value)}
      </p>
      {sub && <p className="text-xs text-slate-500 mt-2 truncate">{sub}</p>}
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
