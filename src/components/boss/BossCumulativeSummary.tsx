import { useMemo } from 'react'
import type { BossSnapshot, CharacterBossData } from '../../types'
import { getBossCumulativeStats } from '../../lib/bossStats'
import { formatMesoKorean } from '../../utils'

interface BossCumulativeSummaryProps {
  snapshots: BossSnapshot[]
  characterId: string
  bossData: CharacterBossData
}

const SUMMARY_ITEMS = [
  { id: 'weekly', label: '주간 누적', getValue: (s: ReturnType<typeof getBossCumulativeStats>) => formatMesoKorean(s.weeklyMeso), hasValue: (s: ReturnType<typeof getBossCumulativeStats>) => s.weeklyMeso > 0, tone: 'cyber' as const },
  { id: 'monthly', label: '월간 누적', getValue: (s: ReturnType<typeof getBossCumulativeStats>) => formatMesoKorean(s.monthlyMeso), hasValue: (s: ReturnType<typeof getBossCumulativeStats>) => s.monthlyMeso > 0, tone: 'maple' as const },
  { id: 'total', label: '총 누적 수익', getValue: (s: ReturnType<typeof getBossCumulativeStats>) => formatMesoKorean(s.totalMeso), hasValue: (s: ReturnType<typeof getBossCumulativeStats>) => s.totalMeso > 0, tone: 'maple' as const },
]

export default function BossCumulativeSummary({ snapshots, characterId, bossData }: BossCumulativeSummaryProps) {
  const stats = useMemo(
    () => getBossCumulativeStats(snapshots, characterId, bossData),
    [snapshots, characterId, bossData]
  )

  return (
    <div className="panel-glow p-5 border-maple-500/20">
      <div className="mb-4">
        <h2 className="font-semibold text-slate-100">누적 보스 수익</h2>
        <p className="text-xs text-slate-500 mt-0.5">그동안 잡은 보스 수익 전체</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {SUMMARY_ITEMS.map((item) => {
          const active = item.hasValue(stats)
          const valueClass =
            item.tone === 'cyber' ? 'text-cyber-400' : item.tone === 'maple' ? 'text-maple-400' : 'text-slate-200'
          return (
            <div
              key={item.id}
              className={`px-3 py-2 rounded-lg border text-sm ${
                active
                  ? 'bg-maple-500/10 border-maple-500/30 text-slate-200'
                  : 'bg-dark-surface/40 border-dark-border text-slate-500'
              }`}
            >
              <p className="truncate text-xs">{item.label}</p>
              <p className={`text-lg font-bold mt-0.5 ${active ? valueClass : 'text-slate-600'}`}>
                {item.getValue(stats)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
