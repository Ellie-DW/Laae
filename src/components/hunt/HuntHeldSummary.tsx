import { useMemo } from 'react'
import type { HuntRecord } from '../../types'
import { getHuntCumulativeStats } from '../../lib/huntStats'
import { formatMesoKorean } from '../../utils'
import SolErdaIcon from './SolErdaIcon'
import MesoIcon from './MesoIcon'

interface HuntHeldSummaryProps {
  hunts: HuntRecord[]
  characterId: string
}

const HELD_ITEMS = [
  {
    id: 'hunt-meso',
    label: '사냥 수익',
    getValue: (s: ReturnType<typeof getHuntCumulativeStats>) => formatMesoKorean(s.huntMesoTotal),
    hasValue: (s: ReturnType<typeof getHuntCumulativeStats>) => s.huntMesoTotal > 0,
    tone: 'cyber' as const,
  },
  {
    id: 'sale-meso',
    label: '솔 에르다 조각 판매 수익',
    getValue: (s: ReturnType<typeof getHuntCumulativeStats>) => formatMesoKorean(s.saleMesoTotal),
    hasValue: (s: ReturnType<typeof getHuntCumulativeStats>) => s.saleMesoTotal > 0,
    tone: 'violet' as const,
  },
  {
    id: 'held-sol-erda',
    label: '보유 솔 에르다 조각',
    getValue: (s: ReturnType<typeof getHuntCumulativeStats>) => s.heldSolErda.toLocaleString(),
    hasValue: (s: ReturnType<typeof getHuntCumulativeStats>) => s.heldSolErda > 0,
    tone: 'violet' as const,
    suffix: '개',
  },
]

function isSolErdaItem(id: string) {
  return id.includes('sol-erda') || id === 'sale-meso'
}

function getItemIcon(id: string) {
  if (id === 'hunt-meso') return <MesoIcon size="xs" />
  if (isSolErdaItem(id)) return <SolErdaIcon size="xs" />
  return null
}

export default function HuntHeldSummary({ hunts, characterId }: HuntHeldSummaryProps) {
  const stats = useMemo(() => getHuntCumulativeStats(hunts, characterId), [hunts, characterId])
  const activeKinds = HELD_ITEMS.filter((i) => i.hasValue(stats)).length

  return (
    <div className="panel-glow p-5 border-cyber-500/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-slate-100">획득 현황</h2>
          <p className="text-xs text-slate-500 mt-0.5">사냥 수익·판매 수익·보유 조각</p>
        </div>
        <span className="text-sm font-bold text-cyber-400">
          {activeKinds}<span className="text-xs font-normal text-slate-500">항목</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {HELD_ITEMS.map((item) => {
          const active = item.hasValue(stats)
          const valueClass = item.tone === 'cyber' ? 'text-cyber-400' : 'text-violet-400'
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
                {getItemIcon(item.id)}
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
