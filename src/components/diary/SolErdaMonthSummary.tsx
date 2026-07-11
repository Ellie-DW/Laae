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

export function SolErdaMonthSummary({
  summary,
  showPurchaseMeso = false,
  compact = false,
}: {
  summary: SolErdaMonthStats
  showPurchaseMeso?: boolean
  compact?: boolean
}) {
  if (!hasSolErdaActivity(summary)) return null

  if (compact) {
    return <SolErdaMonthLine summary={summary} />
  }

  return (
    <div className="mb-4 pt-3 border-t border-dark-border/60">
      <p className="text-xs text-slate-500 mb-2">솔 에르다 조각</p>
      <div className="flex flex-wrap gap-2">
        {summary.acquired > 0 && (
          <SolErdaChip label="획득" value={`+${summary.acquired.toLocaleString()}개`} />
        )}
        {summary.purchased > 0 && (
          <SolErdaChip
            label="구매"
            value={
              showPurchaseMeso
                ? `+${summary.purchased.toLocaleString()}개 · ${formatMesoKorean(summary.purchaseMeso)}`
                : `+${summary.purchased.toLocaleString()}개`
            }
          />
        )}
        {summary.used > 0 && (
          <SolErdaChip label="사용" value={`-${summary.used.toLocaleString()}개`} />
        )}
        {summary.sold > 0 && (
          <SolErdaChip
            label="판매"
            value={`-${summary.sold.toLocaleString()}개 · ${formatMesoKorean(summary.saleMeso)}`}
          />
        )}
        {summary.netChange !== 0 && (
          <SolErdaChip
            label="순증"
            value={`${summary.netChange > 0 ? '+' : ''}${summary.netChange.toLocaleString()}개`}
            highlight
          />
        )}
        {summary.held > 0 && (
          <SolErdaChip label="현재 보유" value={`${summary.held.toLocaleString()}개`} highlight />
        )}
      </div>
    </div>
  )
}

function SolErdaMonthLine({ summary }: { summary: SolErdaMonthStats }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
      {summary.acquired > 0 && (
        <span className="text-violet-400">획득 +{summary.acquired.toLocaleString()}개</span>
      )}
      {summary.purchased > 0 && (
        <span className="text-violet-400">구매 +{summary.purchased.toLocaleString()}개</span>
      )}
      {summary.used > 0 && (
        <span className="text-violet-300">사용 -{summary.used.toLocaleString()}개</span>
      )}
      {summary.sold > 0 && (
        <span className="text-violet-300">판매 -{summary.sold.toLocaleString()}개</span>
      )}
      {summary.netChange !== 0 && (
        <span className={`font-semibold ${summary.netChange > 0 ? 'text-violet-300' : 'text-violet-400/80'}`}>
          순증 {summary.netChange > 0 ? '+' : ''}{summary.netChange.toLocaleString()}개
        </span>
      )}
      {summary.held > 0 && (
        <span className="text-violet-300 font-medium">보유 {summary.held.toLocaleString()}개</span>
      )}
    </div>
  )
}

function SolErdaChip({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded border ${
        highlight
          ? 'bg-violet-500/15 text-violet-300 border-violet-500/30 font-medium'
          : 'bg-violet-500/10 text-violet-400 border-violet-500/20'
      }`}
    >
      {label} {value}
    </span>
  )
}
