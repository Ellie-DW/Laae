import type { BossDifficulty } from '../../types'
import { formatBossDropLabel, getBossDropRows } from '../../data/bossDrops'
import DropItemIcon from '../drop/DropItemIcon'

interface BossDropListProps {
  bossId: string
  selectedDifficulty?: BossDifficulty | null
}

export default function BossDropList({ bossId, selectedDifficulty }: BossDropListProps) {
  const rows = getBossDropRows(bossId)
  if (rows.length === 0) return null

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const isActive =
          row.key === 'common' || !selectedDifficulty || row.key === selectedDifficulty
        return (
          <div
            key={row.key}
            className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}
          >
            <p className="text-[10px] text-slate-500 font-medium mb-1">{row.label}</p>
            <div className="flex flex-wrap gap-1">
              {row.items.map((item, index) => {
                const label = formatBossDropLabel(item)
                return (
                  <span
                    key={`${item.name}-${item.qty ?? 0}-${index}`}
                    title={label}
                    className="inline-flex items-center gap-1 max-w-full rounded border border-dark-border bg-dark-surface/60 px-1.5 py-0.5"
                  >
                    <DropItemIcon name={item.name} size="xs" />
                    <span className="text-[10px] text-slate-300 truncate">{label}</span>
                  </span>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
