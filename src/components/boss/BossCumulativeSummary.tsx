import { useMemo } from 'react'
import type { BossSnapshot, CharacterBossData, DropRecord } from '../../types'
import { getBossCumulativeStats } from '../../lib/bossStats'
import {
  getIntensePowerCrystalCounts,
  INTENSE_POWER_MONTHLY_NAME,
  INTENSE_POWER_WEEKLY_NAME,
} from '../../data/dropItems'
import { formatMesoKorean } from '../../utils'
import DropItemIcon from '../drop/DropItemIcon'

interface BossCumulativeSummaryProps {
  snapshots: BossSnapshot[]
  characterId: string
  bossData: CharacterBossData
  drops: DropRecord[]
}

export default function BossCumulativeSummary({ snapshots, characterId, bossData, drops }: BossCumulativeSummaryProps) {
  const stats = useMemo(
    () => getBossCumulativeStats(snapshots, characterId, bossData),
    [snapshots, characterId, bossData]
  )
  const crystalCounts = useMemo(
    () => getIntensePowerCrystalCounts(drops, characterId),
    [drops, characterId]
  )

  const items = [
    {
      id: 'weekly',
      label: '주간 누적',
      value: `${crystalCounts.weekly.toLocaleString()}개`,
      active: crystalCounts.weekly > 0,
      tone: 'cyber' as const,
      icon: <DropItemIcon name={INTENSE_POWER_WEEKLY_NAME} size="xs" />,
    },
    {
      id: 'monthly',
      label: '월간 누적',
      value: `${crystalCounts.monthly.toLocaleString()}개`,
      active: crystalCounts.monthly > 0,
      tone: 'maple' as const,
      icon: <DropItemIcon name={INTENSE_POWER_MONTHLY_NAME} size="xs" />,
    },
    {
      id: 'total',
      label: '총 누적 수익',
      value: formatMesoKorean(stats.totalMeso),
      active: stats.totalMeso > 0,
      tone: 'maple' as const,
      icon: undefined,
    },
  ]

  return (
    <div className="panel-glow p-5 border-maple-500/20">
      <div className="mb-4">
        <h2 className="font-semibold text-slate-100">누적 보스 수익</h2>
        <p className="text-xs text-slate-500 mt-0.5">그동안 잡은 보스 · 결정·수익 전체</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {items.map((item) => {
          const valueClass =
            item.tone === 'cyber' ? 'text-cyber-400' : item.tone === 'maple' ? 'text-maple-400' : 'text-slate-200'
          return (
            <div
              key={item.id}
              className={`px-3 py-2 rounded-lg border text-sm ${
                item.active
                  ? 'bg-maple-500/10 border-maple-500/30 text-slate-200'
                  : 'bg-dark-surface/40 border-dark-border text-slate-500'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {item.icon}
                <p className="truncate text-xs">{item.label}</p>
              </div>
              <p className={`text-lg font-bold mt-0.5 ${item.active ? valueClass : 'text-slate-600'}`}>
                {item.value}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
