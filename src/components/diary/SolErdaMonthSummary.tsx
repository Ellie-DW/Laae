import type { SolErdaMonthStats } from '../../lib/huntStats'
import { formatMesoKorean } from '../../utils'

export function hasSolErdaActivity(summary: SolErdaMonthStats) {
  return (
    summary.acquired > 0 ||
    summary.purchased > 0 ||
    summary.used > 0 ||
    summary.sold > 0 ||
    summary.held > 0
  )
}

function spentTotal(summary: SolErdaMonthStats) {
  return summary.used + summary.sold
}

function formatSpent(summary: SolErdaMonthStats) {
  const total = spentTotal(summary)
  if (summary.saleMeso > 0) {
    return `-${total.toLocaleString()}개 · ${formatMesoKorean(summary.saleMeso)}`
  }
  return `-${total.toLocaleString()}개`
}

export function SolErdaMonthSummary({
  summary,
  compact = false,
}: {
  summary: SolErdaMonthStats
  compact?: boolean
}) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <StatLine label="획득" value={`+${summary.acquired.toLocaleString()}개`} />
        <StatLine label="지출" value={formatSpent(summary)} muted />
        <StatLine label="보유" value={`${summary.held.toLocaleString()}개`} highlight />
      </div>
    )
  }

  return (
    <div className="mb-4 pt-3 border-t border-dark-border/60">
      <p className="text-xs text-slate-500 mb-2">솔 에르다 조각 · 이번 달</p>
      <div className="grid grid-cols-3 gap-2">
        <StatChip label="획득" value={`+${summary.acquired.toLocaleString()}개`} />
        <StatChip label="지출" value={formatSpent(summary)} tone="muted" />
        <StatChip label="현재 보유" value={`${summary.held.toLocaleString()}개`} highlight />
      </div>
    </div>
  )
}

function StatChip({
  label,
  value,
  tone = 'default',
  highlight = false,
}: {
  label: string
  value: string
  tone?: 'default' | 'muted'
  highlight?: boolean
}) {
  return (
    <div
      className={`px-3 py-2 rounded-lg border ${
        highlight
          ? 'bg-violet-500/15 border-violet-500/30'
          : 'bg-violet-500/5 border-violet-500/15'
      }`}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`text-sm font-bold mt-0.5 ${
          highlight
            ? 'text-violet-300'
            : tone === 'muted'
              ? 'text-violet-400/80'
              : 'text-violet-400'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function StatLine({
  label,
  value,
  muted = false,
  highlight = false,
}: {
  label: string
  value: string
  muted?: boolean
  highlight?: boolean
}) {
  return (
    <span
      className={
        highlight
          ? 'text-violet-300 font-semibold'
          : muted
            ? 'text-violet-400/80'
            : 'text-violet-400'
      }
    >
      {label} {value}
    </span>
  )
}
