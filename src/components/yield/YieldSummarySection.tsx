import type { YieldDailyRow } from '../../lib/yieldCalc'
import { formatYieldProfit, formatYieldProfitUsd, formatYieldRate } from '../../lib/yieldCalc'
import type { YieldSettings } from '../../types'
import { formatWon } from '../../utils'
import { YieldSectionHeader, YieldStatCard } from './YieldUi'

interface YieldSummarySectionProps {
  settings: YieldSettings | null
  latestRow: YieldDailyRow | null
  recordCount: number
  overallSummary: {
    basePrincipal: number | null
    totalProfit: number | null
    totalProfitUsd: number | null
    totalYieldRate: number | null
    totalYieldRateUsd: number | null
  }
}

function profitTone(value: number | null): 'profit' | 'loss' | 'default' {
  if (value == null || value === 0) return 'default'
  return value >= 0 ? 'profit' : 'loss'
}

export default function YieldSummarySection({
  settings,
  latestRow,
  recordCount,
  overallSummary,
}: YieldSummarySectionProps) {
  return (
    <div className="space-y-4">
      <YieldSectionHeader title="포트폴리오 요약" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <YieldStatCard
          label="시작 원금"
          accent="neutral"
          value={overallSummary.basePrincipal != null ? formatWon(overallSummary.basePrincipal) : '-'}
          sub={settings?.startDate ? `${settings.startDate} 투자 시작` : '원금 기준'}
        />
        <YieldStatCard
          label="현재 총 시드"
          accent="krw"
          tone="krw"
          value={latestRow ? formatWon(latestRow.totalSeed) : '-'}
          sub={latestRow ? `${latestRow.recordDate} 기준` : '기록 없음'}
        />
        <YieldStatCard
          label="총 시드 ($)"
          accent="usd"
          tone="usd"
          value={
            latestRow
              ? `$${latestRow.totalSeedUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '-'
          }
          sub="당일 환율 환산"
        />
        <YieldStatCard
          label="기록 일수"
          accent="violet"
          tone="violet"
          value={`${recordCount}일`}
          sub="누적 트래킹"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <YieldStatCard
          label="원화 수익금"
          accent="profit"
          tone={profitTone(overallSummary.totalProfit)}
          value={overallSummary.totalProfit == null ? '-' : formatYieldProfit(overallSummary.totalProfit)}
          sub="환율 반영 · ₩"
        />
        <YieldStatCard
          label="달러 수익금"
          accent="usd"
          tone={profitTone(overallSummary.totalProfitUsd)}
          value={
            overallSummary.totalProfitUsd == null
              ? '-'
              : formatYieldProfitUsd(overallSummary.totalProfitUsd)
          }
          sub="환율 제외 · $"
        />
        <YieldStatCard
          label="원화 수익률"
          accent="profit"
          tone={profitTone(overallSummary.totalYieldRate)}
          value={
            overallSummary.totalYieldRate == null
              ? '-'
              : formatYieldRate(overallSummary.totalYieldRate)
          }
          sub="시작 원금 대비"
        />
        <YieldStatCard
          label="달러 수익률"
          accent="usd"
          tone={profitTone(overallSummary.totalYieldRateUsd)}
          value={
            overallSummary.totalYieldRateUsd == null
              ? '-'
              : formatYieldRate(overallSummary.totalYieldRateUsd)
          }
          sub="시작 원금 대비"
        />
      </div>
    </div>
  )
}
