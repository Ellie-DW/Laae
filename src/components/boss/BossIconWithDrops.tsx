import type { BossDifficulty } from '../../types'
import { getBossDropTable } from '../../data/bossDrops'
import { getBossIconSrc } from '../../lib/assetImages'
import BossDropList from './BossDropList'

interface BossIconWithDropsProps {
  bossId: string
  name: string
  shortName: string
  selectedDifficulty?: BossDifficulty | null
}

export default function BossIconWithDrops({
  bossId,
  name,
  shortName,
  selectedDifficulty,
}: BossIconWithDropsProps) {
  const bossIconSrc = getBossIconSrc(bossId)
  const hasDrops = Boolean(getBossDropTable(bossId))

  return (
    <div className="relative z-10 group/drops shrink-0 hover:z-30">
      {bossIconSrc ? (
        <img
          src={bossIconSrc}
          alt={name}
          className={`w-10 h-10 rounded-lg bg-dark-surface border object-contain p-0.5 ${
            hasDrops
              ? 'border-dark-border cursor-help group-hover/drops:border-cyber-500/50'
              : 'border-dark-border'
          }`}
          draggable={false}
        />
      ) : (
        <span
          className={`w-10 h-10 rounded-lg bg-dark-surface border flex items-center justify-center text-xs font-bold text-cyber-400 ${
            hasDrops
              ? 'border-dark-border cursor-help group-hover/drops:border-cyber-500/50'
              : 'border-dark-border'
          }`}
        >
          {shortName}
        </span>
      )}

      {hasDrops && (
        <div className="pointer-events-none invisible absolute left-full top-0 z-40 pl-2 opacity-0 transition-opacity duration-150 group-hover/drops:pointer-events-auto group-hover/drops:visible group-hover/drops:opacity-100">
          <div className="w-72 max-h-80 overflow-y-auto overscroll-contain rounded-xl border border-cyber-500/30 bg-dark-panel/95 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md">
            <p className="text-xs text-slate-400 font-medium mb-2">{name} 주요 드랍</p>
            <BossDropList bossId={bossId} selectedDifficulty={selectedDifficulty} />
          </div>
        </div>
      )}
    </div>
  )
}
