import { useMemo } from 'react'
import type { HuntRecord } from '../../types'
import { getHuntCumulativeStats } from '../../lib/huntStats'
import { formatMesoKorean } from '../../utils'
import SolErdaIcon from './SolErdaIcon'
import MesoIcon from './MesoIcon'

interface HuntCumulativeSummaryProps {
  hunts: HuntRecord[]
  characterId: string
}

const CUMULATIVE_ITEMS = [
  { id: 'hunt-meso', label: '사냥 수익', getValue: (s: ReturnType<typeof getHuntCumulativeStats>) => formatMesoKorean(s.huntMesoTotal), hasValue: (s: ReturnType<typeof getHuntCumulativeStats>) => s.huntMesoTotal > 0, tone: 'cyber' as const },
  { id: 'sale-meso', label: '솔 에르다 조각 판매 수익', getValue: (s: ReturnType<typeof getHuntCumulativeStats>) => formatMesoKorean(s.saleMesoTotal), hasValue: (s: ReturnType<typeof getHuntCumulativeStats>) => s.saleMesoTotal > 0, tone: 'violet' as const },
  { id: 'sol-erda', label: '솔 에르다 조각', getValue: (s: ReturnType<typeof getHuntCumulativeStats>) => s.acquiredSolErda.toLocaleString(), hasValue: (s: ReturnType<typeof getHuntCumulativeStats>) => s.acquiredSolErda > 0, tone: 'violet' as const, suffix: '개' },
  { id: 'sol-erda-sale', label: '솔 에르다 판매', getValue: (s: ReturnType<typeof getHuntCumulativeStats>) => s.soldSolErda.toLocaleString(), hasValue: (s: ReturnType<typeof getHuntCumulativeStats>) => s.soldSolErda > 0, tone: 'violet' as const, suffix: '개' },
  { id: 'hunt-count', label: '사냥 횟수', getValue: (s: ReturnType<typeof getHuntCumulativeStats>) => String(s.huntCount), hasValue: (s: ReturnType<typeof getHuntCumulativeStats>) => s.huntCount > 0, tone: 'default' as const, suffix: '회' },
]

export default function HuntCumulativeSummary({ hunts, characterId }: HuntCumulativeSummaryProps) {
  const stats = useMemo(() => getHuntCumulativeStats(hunts, characterId), [hunts, characterId])

  return (
    <div className="panel-glow p-5 border-cyber-500/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-slate-100">누적 현황</h2>
          <p className="text-xs text-slate-500 mt-0.5">그동안 획득·판매한 사냥 기록 전체</p>
        </div>
        <span className="text-sm font-bold text-cyber-400">
          사냥 {stats.huntCount}<span className="text-xs font-normal text-slate-500">회</span>
          {stats.saleCount > 0 && (
            <>
              {' · '}
              판매 {stats.saleCount}<span className="text-xs font-normal text-slate-500">회</span>
            </>
          )}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {CUMULATIVE_ITEMS.map((item) => {
          const active = item.hasValue(stats)
          const valueClass =
            item.tone === 'cyber' ? 'text-cyber-400' : item.tone === 'violet' ? 'text-violet-400' : 'text-slate-200'
          return (
            <div
              key={item.id}
              className={`px-3 py-2 rounded-lg border text-sm ${
                active
                  ? 'bg-cyber-500/10 border-cyber-500/30 text-slate-200'
                  : 'bg-dark-surface/40 border-dark-border text-slate-500'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {(item.id === 'hunt-meso' && <MesoIcon size="xs" />) ||
                  ((item.id.includes('sol-erda') || item.id === 'sale-meso') && <SolErdaIcon size="xs" />)}
                <p className="truncate text-xs flex-1">{item.label}</p>
              </div>
              <p className={`text-lg font-bold mt-0.5 ${active ? valueClass : 'text-slate-600'}`}>
                {item.getValue(stats)}
                {'suffix' in item && item.suffix && (
                  <span className="text-xs font-normal text-slate-500 ml-0.5">{item.suffix}</span>
                )}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
