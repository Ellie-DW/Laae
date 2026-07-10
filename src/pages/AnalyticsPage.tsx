import type { Character } from '../types'
import type { LedgerSummary, DailyNetEntry, CategoryBreakdown, CharacterLedgerSummary } from '../lib/ledgerAnalytics'
import { formatMesoKorean } from '../utils'

interface AnalyticsPageProps {
  characters: Character[]
  selectedCharacter: Character | null
  currentMonth: string
  accountSummary: LedgerSummary
  accountSummaryAll: LedgerSummary
  dailyNet: DailyNetEntry[]
  expenseByCategory: CategoryBreakdown[]
  characterSummaries: (CharacterLedgerSummary & { name: string })[]
}

export default function AnalyticsPage({
  selectedCharacter,
  currentMonth,
  accountSummary,
  accountSummaryAll,
  dailyNet,
  expenseByCategory,
  characterSummaries,
}: AnalyticsPageProps) {
  const maxCategory = Math.max(...expenseByCategory.map((c) => c.amount), 1)
  const expenseTotal = expenseByCategory.reduce((s, c) => s + c.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">분석</h1>
        <p className="text-sm text-slate-500 mt-1">사냥·채집·드랍·보스·지출 통합 통계</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="이번 달 수익" value={formatMesoKorean(accountSummary.recordedIncome)} income />
        <StatCard label="이번 달 지출" value={`-${formatMesoKorean(accountSummary.expenseTotal)}`} danger />
        <StatCard label="이번 달 순수익" value={formatMesoKorean(accountSummary.netProfit)} highlight />
      </div>

      <IncomeExpenseBar income={accountSummary.recordedIncome} expense={accountSummary.expenseTotal} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="누적 순수익" value={formatMesoKorean(accountSummaryAll.netProfit)} sub="전체 기간 (보스 제외)" />
        <StatCard label="누적 수익" value={formatMesoKorean(accountSummaryAll.recordedIncome)} sub="사냥·채집" />
        <StatCard label="누적 지출" value={`-${formatMesoKorean(accountSummaryAll.expenseTotal)}`} danger />
        <StatCard
          label="수익 대비 지출"
          value={accountSummary.recordedIncome > 0
            ? `${Math.round((accountSummary.expenseTotal / accountSummary.recordedIncome) * 100)}%`
            : '-'}
          sub="이번 달 지출/수익 비율"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MiniStat label="사냥" count={accountSummary.huntCount} amount={accountSummary.huntIncome} color="text-cyber-400" />
        <MiniStat label="채집" count={accountSummary.gatherCount} amount={accountSummary.gatherIncome} color="text-emerald-400" />
        <MiniStat label="드랍" count={accountSummary.dropCount} amount={accountSummary.dropIncome} color="text-amber-400" />
        <MiniStat label="보스" amount={accountSummary.bossIncome} color="text-maple-400" />
        <MiniStat label="지출" count={accountSummary.expenseCount} amount={accountSummary.expenseTotal} color="text-red-400" />
      </div>

      <div className="panel-light p-5">
        <h2 className="font-semibold text-slate-100 mb-1">최근 7일</h2>
        <p className="text-xs text-slate-500 mb-4">
          {selectedCharacter ? `${selectedCharacter.name} · ` : '계정 전체 · '}
          일자별 수익·지출 (보스 제외)
        </p>

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
                    className="w-[40%] max-w-[16px] rounded-t bg-gradient-to-t from-cyber-700 to-cyber-400"
                    style={{ height: `${incomeH}%` }}
                  />
                  <div
                    className="w-[40%] max-w-[16px] rounded-t bg-gradient-to-t from-red-700 to-red-400"
                    style={{ height: `${expenseH}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500">{day.date.slice(5)}</span>
              </div>
            )
          })}
        </div>
        <div className="flex justify-center gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-cyber-500" /> 수익</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" /> 지출</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="panel-light p-5">
          <h2 className="font-semibold text-slate-100 mb-1">{currentMonth} 지출 카테고리</h2>
          <p className="text-xs text-slate-500 mb-4">총 {formatMesoKorean(expenseTotal)}</p>

          {expenseTotal === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">지출 기록 없음</p>
          ) : (
            <div className="space-y-3">
              {expenseByCategory.filter((c) => c.amount > 0).map((cat) => (
                <div key={cat.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{cat.label}</span>
                    <span className="text-red-400">{formatMesoKorean(cat.amount)}</span>
                  </div>
                  <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500/60 rounded-full"
                      style={{ width: `${(cat.amount / maxCategory) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel-light p-5">
          <h2 className="font-semibold text-slate-100 mb-1">캐릭터별 순수익</h2>
          <p className="text-xs text-slate-500 mb-4">이번 달 기준</p>

          {characterSummaries.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">캐릭터 없음</p>
          ) : (
            <div className="space-y-2">
              {characterSummaries.map((char) => (
                <div key={char.characterId} className="p-3 rounded-lg bg-dark-surface/50 border border-dark-border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-200">{char.name}</p>
                    <span className={`text-sm font-semibold ${char.netProfit >= 0 ? 'text-cyber-400' : 'text-red-400'}`}>
                      {formatMesoKorean(char.netProfit)}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-1.5 text-xs">
                    <span className="text-cyber-400">+{formatMesoKorean(char.huntIncome + char.gatherIncome + char.bossIncome)}</span>
                    <span className="text-red-400">-{formatMesoKorean(char.expenseTotal)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, highlight, danger, income }: {
  label: string; value: string; sub?: string; highlight?: boolean; danger?: boolean; income?: boolean
}) {
  return (
    <div className="panel-light p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-bold mt-1 ${
        highlight ? 'text-emerald-400' : danger ? 'text-red-400' : income ? 'text-cyber-400' : 'text-slate-100'
      }`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
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
      <div className="flex justify-between text-xs mb-2">
        <span className="text-cyber-400">수익 {formatMesoKorean(income)}</span>
        <span className="text-red-400">지출 {formatMesoKorean(expense)}</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden flex bg-dark-border">
        <div className="bg-gradient-to-r from-cyber-600 to-cyber-400" style={{ width: `${incomePct}%` }} />
        <div className="bg-gradient-to-r from-red-600 to-red-400" style={{ width: `${expensePct}%` }} />
      </div>
    </div>
  )
}

function MiniStat({ label, count, amount, color }: { label: string; count?: number; amount: number; color: string }) {
  return (
    <div className="panel-light p-3 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm font-bold mt-1 ${color}`}>{formatMesoKorean(amount)}</p>
      {count !== undefined && <p className="text-[10px] text-slate-600 mt-0.5">{count}건</p>}
    </div>
  )
}
