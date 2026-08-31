import { NAV_ICON_SRC } from '../../lib/assetImages'
import type { LedgerSummary } from '../../lib/ledgerAnalytics'
import { formatMesoKorean } from '../../utils'

type Period = 'month' | 'week'

interface HomeHeroProps {
  summary: LedgerSummary
  period: Period
  periodLabel: string
  weekLabel: string
  onPeriodChange: (period: Period) => void
  characterCount: number
  onGoHunt: () => void
  onGoDrop: () => void
  onGoLedger: () => void
}

export default function HomeHero({
  summary,
  period,
  periodLabel,
  weekLabel,
  onPeriodChange,
  characterCount,
  onGoHunt,
  onGoDrop,
  onGoLedger,
}: HomeHeroProps) {
  const netColor = summary.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'

  return (
    <section>
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">홈</h1>
          {characterCount === 0 && (
            <p className="text-sm text-slate-500 mt-1">캐릭터를 추가하면 숫자가 여기에 모여요</p>
          )}
        </div>
        <PeriodToggle period={period} onChange={onPeriodChange} weekLabel={weekLabel} />
      </div>

      <div className="panel-glow p-5 sm:p-6">
        <p className="text-xs text-slate-500">{periodLabel}</p>
        <p className={`mt-2 text-4xl sm:text-5xl font-bold font-display tracking-wide ${netColor}`}>
          {formatMesoKorean(summary.netProfit)}
        </p>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span className="text-cyber-400">수익 {formatMesoKorean(summary.recordedIncome)}</span>
          <span className="text-red-400">지출 {formatMesoKorean(summary.expenseTotal)}</span>
        </div>

        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-400">
          <span>보스 {formatMesoKorean(summary.bossIncome)}</span>
          <span>사냥 {formatMesoKorean(summary.huntIncome)}</span>
          <span>드랍 {formatMesoKorean(summary.dropIncome)}</span>
          <span>채집 {formatMesoKorean(summary.gatherIncome)}</span>
        </div>
      </div>

      <div className="mt-3 panel-light overflow-hidden grid grid-cols-3 divide-x divide-dark-border/50">
        <ActionTile
          icon={NAV_ICON_SRC.hunt}
          label="사냥"
          hint="메소·조각"
          onClick={onGoHunt}
        />
        <ActionTile
          icon={NAV_ICON_SRC.drop}
          label="드랍"
          hint="아이템·판매"
          onClick={onGoDrop}
        />
        <ActionTile
          icon={NAV_ICON_SRC.expense}
          label="장부"
          hint="수입·지출"
          onClick={onGoLedger}
        />
      </div>
    </section>
  )
}

function ActionTile({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: string
  label: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2.5 px-3 py-3.5 sm:px-4 text-left hover:bg-cyber-500/5 transition-colors"
    >
      <img src={icon} alt="" className="w-8 h-8 object-contain image-pixelated shrink-0" draggable={false} />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-100">{label}</span>
        <span className="mt-0.5 block text-[11px] text-slate-500 truncate">{hint}</span>
      </span>
    </button>
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
    <div className="flex gap-1 p-1 bg-dark-surface/60 rounded-lg border border-dark-border/60">
      <button
        type="button"
        onClick={() => onChange('month')}
        className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
          period === 'month' ? 'bg-cyber-500/20 text-cyber-300 font-semibold' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        이번 달
      </button>
      <button
        type="button"
        onClick={() => onChange('week')}
        className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
          period === 'week' ? 'bg-cyber-500/20 text-cyber-300 font-semibold' : 'text-slate-500 hover:text-slate-300'
        }`}
        title={weekLabel}
      >
        이번 주
      </button>
    </div>
  )
}
