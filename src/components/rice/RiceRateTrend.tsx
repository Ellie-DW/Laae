import { useMemo } from 'react'
import type { RiceRecord } from '../../types'
import {
  buildRiceMonthlyRateAverages,
  buildRiceRateHistory,
  formatRiceRateDelta,
  formatWonPerEok,
  summarizeRiceRateHistory,
} from '../../lib/riceTrade'
import { formatMesoKorean } from '../../utils'

interface RiceRateTrendProps {
  records: RiceRecord[]
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta == null) {
    return <span className="text-xs text-slate-600">기준</span>
  }
  if (delta === 0) {
    return <span className="text-xs text-slate-500">변동 없음</span>
  }
  const up = delta > 0
  return (
    <span className={`text-xs font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      {up ? '▲' : '▼'} {formatRiceRateDelta(delta)}
    </span>
  )
}

export default function RiceRateTrend({ records }: RiceRateTrendProps) {
  const history = useMemo(() => buildRiceRateHistory(records), [records])
  const summary = useMemo(() => summarizeRiceRateHistory(history), [history])
  const monthlyRates = useMemo(() => buildRiceMonthlyRateAverages(history), [history])
  const recentHistory = useMemo(() => [...history].reverse(), [history])

  if (!summary || history.length === 0) return null

  const range = Math.max(summary.max - summary.min, 1)

  return (
    <div className="panel-light p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-slate-100">메소 시세 추이</h2>
        <p className="text-xs text-slate-500 mt-1">1억당 단가가 어떻게 변했는지 보여줘요</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatChip label="최근 단가" value={formatWonPerEok(summary.latest)} highlight />
        <StatChip label="평균 단가" value={formatWonPerEok(summary.average)} />
        <StatChip label="최고" value={formatWonPerEok(summary.max)} />
        <StatChip label="최저" value={formatWonPerEok(summary.min)} />
      </div>

      {monthlyRates.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-2">월별 평균 단가</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {monthlyRates.map((month) => (
              <div
                key={month.monthKey}
                className="rounded-lg bg-dark-surface/50 border border-dark-border px-3 py-2.5"
              >
                <p className="text-[10px] text-slate-500">{month.label}</p>
                <p className="text-sm font-semibold text-slate-200 mt-0.5">
                  {formatWonPerEok(month.average)}
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">{month.tradeCount}건</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[15.625rem] overflow-y-auto overscroll-contain pr-1">
        {recentHistory.map((point) => {
          const barWidth = ((point.wonPerEok - summary.min) / range) * 100
          return (
            <div
              key={point.recordId}
              className="p-3 rounded-lg bg-dark-surface/50 border border-dark-border"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200">
                    {formatWonPerEok(point.wonPerEok)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {point.recordDate}
                    {point.mesoSold != null ? ` · ${formatMesoKorean(point.mesoSold)}` : ''}
                  </p>
                </div>
                <DeltaBadge delta={point.delta} />
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-dark-bg overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600/70 to-amber-300/90"
                  style={{ width: `${Math.max(barWidth, 8)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatChip({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  const valueClass = highlight ? 'text-amber-300' : 'text-slate-200'

  return (
    <div className="rounded-lg bg-dark-surface/50 border border-dark-border px-3 py-2.5">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${valueClass}`}>{value}</p>
    </div>
  )
}
