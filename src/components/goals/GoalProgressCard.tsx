import type { Goal } from '../../types'
import type { GoalProgress } from '../../lib/ledgerAnalytics'
import { formatGoalPace, goalBarClass, goalPercentTone } from '../../lib/goalHelpers'
import { formatMesoKorean } from '../../utils'

interface GoalProgressCardProps {
  goal: Goal
  progress: GoalProgress
  scopeLabel: string
  compact?: boolean
  onRemove?: () => void
}

export default function GoalProgressCard({
  goal,
  progress,
  scopeLabel,
  compact = false,
  onRemove,
}: GoalProgressCardProps) {
  const pace = formatGoalPace(progress)

  if (compact) {
    return (
      <div>
        <div className="flex justify-between items-start gap-2 text-sm mb-1">
          <div className="min-w-0">
            <span className="text-slate-300">{goal.title}</span>
            <span className="text-xs text-slate-600 ml-2">{scopeLabel}</span>
          </div>
          <span className={`font-semibold shrink-0 ${goalPercentTone(progress.percent)}`}>
            {progress.percent}%
          </span>
        </div>
        <div className="h-1.5 bg-dark-border rounded-full overflow-hidden mb-1">
          <div
            className={`h-full rounded-full transition-all ${goalBarClass(progress.percent)}`}
            style={{ width: `${progress.barPercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 truncate">{pace}</p>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-lg bg-dark-surface/50 border border-dark-border">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-slate-200">{goal.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{scopeLabel}</p>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-slate-600 hover:text-red-400 text-xs shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <p
            className={`text-lg font-bold ${
              progress.netProfit >= 0 ? 'text-maple-400' : 'text-red-400'
            }`}
          >
            {formatMesoKorean(progress.netProfit)}
          </p>
          <p className="text-xs text-slate-500">/ {formatMesoKorean(goal.targetMeso)}</p>
        </div>
        <span className={`text-sm font-semibold ${goalPercentTone(progress.percent)}`}>
          {progress.percent}%
        </span>
      </div>

      <div className="mt-2 h-2 bg-dark-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${goalBarClass(progress.percent)}`}
          style={{ width: `${progress.barPercent}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-slate-400">{pace}</p>

      <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
        <span>사냥 +{formatMesoKorean(progress.summary.huntMesoIncome)}</span>
        {progress.summary.solErdaSaleIncome > 0 && (
          <span>솔에르다 +{formatMesoKorean(progress.summary.solErdaSaleIncome)}</span>
        )}
        <span>채집 +{formatMesoKorean(progress.summary.gatherIncome)}</span>
        <span>드랍 +{formatMesoKorean(progress.summary.dropIncome)}</span>
        <span className="text-maple-400">보스 +{formatMesoKorean(progress.summary.bossIncome)}</span>
        <span>지출 -{formatMesoKorean(progress.summary.expenseTotal)}</span>
      </div>
    </div>
  )
}
