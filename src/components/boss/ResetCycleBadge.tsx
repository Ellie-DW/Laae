import { RESET_CYCLE_INFO } from '../../data/bosses'
import type { BossResetCycle } from '../../types'

export default function ResetCycleBadge({ cycle }: { cycle: BossResetCycle }) {
  const info = RESET_CYCLE_INFO[cycle]
  const isMonthly = cycle === 'monthly'

  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
        isMonthly
          ? 'bg-maple-500/15 text-maple-400 border border-maple-500/25'
          : 'bg-cyber-500/10 text-cyber-400 border border-cyber-500/20'
      }`}
      title={info.desc}
    >
      {info.label}
    </span>
  )
}
