import { useEffect, useMemo, useState } from 'react'
import type { SolErdaMonthStats } from '../../lib/huntStats'
import {
  describeDonutSlice,
  formatSlicePercent,
  type DiaryStatSliceView,
} from '../../lib/diaryStats'
import { formatMesoKorean } from '../../utils'
import { SolErdaMonthSummary, hasSolErdaActivity } from './SolErdaMonthSummary'

type StatsKind = 'income' | 'expense'
type StatsPeriod = 'month' | 'all'

interface DiaryMonthStatsProps {
  period: StatsPeriod
  onPeriodChange: (period: StatsPeriod) => void
  year: number
  month: number
  incomeTotal: number
  expenseTotal: number
  net: number
  incomeSlices: DiaryStatSliceView[]
  expenseSlices: DiaryStatSliceView[]
  solErdaSummary?: SolErdaMonthStats
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}

export default function DiaryMonthStats({
  period,
  onPeriodChange,
  year,
  month,
  incomeTotal,
  expenseTotal,
  net,
  incomeSlices,
  expenseSlices,
  solErdaSummary,
  onPrevMonth,
  onNextMonth,
  onToday,
}: DiaryMonthStatsProps) {
  const [kind, setKind] = useState<StatsKind>('income')
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    setActiveId(null)
  }, [period])

  const slices = kind === 'expense' ? expenseSlices : incomeSlices
  const total = kind === 'expense' ? expenseTotal : incomeTotal
  const active = slices.find((slice) => slice.id === activeId) ?? slices[0] ?? null
  const showSolErda = !!solErdaSummary && hasSolErdaActivity(solErdaSummary)
  const isAll = period === 'all'

  return (
    <div className="panel-light overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-dark-border flex-wrap">
        <div className="flex items-center gap-3">
          {isAll ? (
            <span className="text-2xl font-bold font-display text-cyber-400">전체</span>
          ) : (
            <>
              <span className="px-3 py-1 rounded-lg bg-cyber-700 text-white text-sm font-bold">{year}</span>
              <span className="text-2xl font-bold font-display text-cyber-400">{month}월</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex p-0.5 rounded-lg bg-dark-surface/50 border border-dark-border/70">
            <PeriodTab active={!isAll} onClick={() => onPeriodChange('month')}>이번 달</PeriodTab>
            <PeriodTab active={isAll} onClick={() => onPeriodChange('all')}>전체</PeriodTab>
          </div>
          {!isAll && (
            <div className="flex items-center gap-1">
              <NavBtn onClick={onPrevMonth}>‹</NavBtn>
              <button
                type="button"
                onClick={onToday}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-dark-border rounded-lg hover:bg-dark-surface/50"
              >
                오늘
              </button>
              <NavBtn onClick={onNextMonth}>›</NavBtn>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        <div className="grid grid-cols-3 gap-2">
          <SummaryCard label={isAll ? '누적 수입' : '수입'} value={formatMesoKorean(incomeTotal)} tone="income" />
          <SummaryCard label={isAll ? '누적 지출' : '지출'} value={formatMesoKorean(expenseTotal)} tone="expense" />
          <SummaryCard
            label={isAll ? '누적 순수익' : '순수익'}
            value={formatMesoKorean(net)}
            tone={net >= 0 ? 'profit' : 'expense'}
          />
        </div>

        <div className="grid grid-cols-2 p-1 rounded-xl bg-dark-surface/50 border border-dark-border/70">
          <KindTab active={kind === 'income'} onClick={() => { setKind('income'); setActiveId(null) }}>
            수입
          </KindTab>
          <KindTab active={kind === 'expense'} onClick={() => { setKind('expense'); setActiveId(null) }}>
            지출
          </KindTab>
        </div>

        {slices.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-500">
              이번 달 {kind === 'expense' ? '지출' : '수입'} 기록이 없어요
            </p>
          </div>
        ) : (
          <>
            <StatDonut
              slices={slices}
              total={total}
              activeId={active?.id ?? null}
              kind={kind}
              onSelect={setActiveId}
            />

            <ul className="space-y-1.5">
              {slices.map((slice) => {
                const selected = active?.id === slice.id
                return (
                  <li key={slice.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(slice.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        selected
                          ? 'bg-dark-surface/70 ring-1 ring-inset ring-cyber-500/25'
                          : 'hover:bg-dark-surface/40'
                      }`}
                    >
                      <span
                        className="w-1.5 h-8 rounded-full shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-slate-200 truncate">{slice.label}</span>
                        <span className="block text-xs text-slate-500 mt-0.5">
                          {formatSlicePercent(slice.percent)}
                        </span>
                      </span>
                      <span className="text-sm font-semibold font-display text-slate-100 shrink-0">
                        {formatMesoKorean(slice.amount)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}

        {showSolErda && solErdaSummary && (
          <div className="pt-3 border-t border-dark-border/60">
            <SolErdaMonthSummary summary={solErdaSummary} compact />
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'income' | 'expense' | 'profit'
}) {
  const valueClass =
    tone === 'income' ? 'text-cyber-400' : tone === 'profit' ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="px-3 py-2.5 rounded-xl bg-dark-surface/45 border border-dark-border/70">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={`mt-1 text-xs sm:text-sm font-bold font-display leading-snug ${valueClass}`}>
        {value}
      </p>
    </div>
  )
}

function StatDonut({
  slices,
  total,
  activeId,
  kind,
  onSelect,
}: {
  slices: DiaryStatSliceView[]
  total: number
  activeId: string | null
  kind: StatsKind
  onSelect: (id: string) => void
}) {
  const paths = useMemo(() => {
    const gap = slices.length > 1 ? 2.4 : 0
    let angle = 0
    return slices.map((slice) => {
      const sweep = (slice.percent / 100) * 360
      const start = angle + gap / 2
      const end = angle + sweep - gap / 2
      angle += sweep
      return { slice, start: Math.min(start, end), end: Math.max(start, end) }
    })
  }, [slices])

  const active = slices.find((slice) => slice.id === activeId) ?? slices[0]
  const glow = active?.color ?? 'rgb(var(--diary-hunt))'

  return (
    <div className="relative mx-auto w-56 h-56 sm:w-64 sm:h-64">
      <div
        className="absolute inset-[12%] rounded-full blur-2xl opacity-40 pointer-events-none"
        style={{ background: `radial-gradient(circle, color-mix(in srgb, ${glow} 40%, transparent), transparent 70%)` }}
      />
      <svg viewBox="0 0 220 220" className="absolute inset-0 drop-shadow-sm">
        <circle cx="110" cy="110" r="82" fill="none" stroke="rgb(var(--theme-border))" strokeWidth="18" opacity="0.45" />
        {paths.map(({ slice, start, end }) => {
          const selected = slice.id === active?.id
          return (
            <path
              key={slice.id}
              d={describeDonutSlice(110, 110, selected ? 88 : 83, selected ? 52 : 55, start, end)}
              fill={slice.color}
              fillRule="evenodd"
              opacity={selected ? 1 : 0.72}
              className="cursor-pointer transition-[d,opacity] duration-200"
              onClick={() => onSelect(slice.id)}
            >
              <title>{`${slice.label} ${formatSlicePercent(slice.percent)}`}</title>
            </path>
          )
        })}
      </svg>

      <div className="absolute inset-[27%] rounded-full bg-dark-surface/80 border border-dark-border/50 flex flex-col items-center justify-center text-center px-3 shadow-[inset_0_1px_0_var(--panel-inset)]">
        <p className="text-[11px] text-slate-500 truncate max-w-full">
          {active?.label ?? (kind === 'expense' ? '지출' : '수입')}
        </p>
        <p className="mt-0.5 text-sm sm:text-base font-bold font-display text-slate-100 leading-tight">
          {formatMesoKorean(active?.amount ?? total)}
        </p>
        {active && (
          <p className="mt-1 text-[11px] font-semibold" style={{ color: active.color }}>
            {formatSlicePercent(active.percent)}
          </p>
        )}
      </div>
    </div>
  )
}

function PeriodTab({
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
      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
        active
          ? 'bg-cyber-500/20 text-cyber-300'
          : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {children}
    </button>
  )
}

function KindTab({
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
      className={`py-2 rounded-lg text-xs font-medium transition-colors ${
        active
          ? 'bg-cyber-500/20 text-cyber-300 shadow-sm'
          : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {children}
    </button>
  )
}

function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-dark-surface/50 rounded-lg text-lg"
    >
      {children}
    </button>
  )
}
