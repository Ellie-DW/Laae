import type { BossDefinition, BossSelection } from '../../types'
import { getBossResetCycle } from '../../data/bosses'
import { formatMesoKorean, DIFFICULTY_COLORS } from '../../utils'
import { getBossIconSrc } from '../../lib/assetImages'
import ResetCycleBadge from './ResetCycleBadge'

interface BossCardProps {
  boss: BossDefinition
  selections: BossSelection[]
  onUpdate: (bossId: string, difficulty: string, updates: Partial<BossSelection>) => void
  onSelectDifficulty: (bossId: string, difficulty: string | null) => void
}

export default function BossCard({ boss, selections, onUpdate, onSelectDifficulty }: BossCardProps) {
  const bossSelections = selections.filter((s) => s.bossId === boss.id)
  const selected = bossSelections.find((s) => s.checked)
  const partySize = selected?.partySize ?? bossSelections[0]?.partySize ?? 1
  const resetCycle = getBossResetCycle(boss)

  const setPartySize = (size: number) => {
    for (const sel of bossSelections) {
      onUpdate(boss.id, sel.difficulty, { partySize: size })
    }
  }

  const handleDifficultyClick = (difficulty: string) => {
    if (selected?.difficulty === difficulty) {
      onSelectDifficulty(boss.id, null)
    } else {
      onSelectDifficulty(boss.id, difficulty)
    }
  }

  const bossIconSrc = getBossIconSrc(boss.id)

  return (
    <div
      className={`panel-light p-4 transition-all ${
        selected ? 'ring-1 ring-cyber-500/30 border-cyber-600/25' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {bossIconSrc ? (
          <img
            src={bossIconSrc}
            alt=""
            className="w-10 h-10 rounded-lg bg-dark-surface border border-dark-border object-contain p-0.5 shrink-0"
            draggable={false}
          />
        ) : (
          <span className="w-8 h-8 mt-0.5 rounded-lg bg-dark-surface border border-dark-border flex items-center justify-center text-xs font-bold text-cyber-400 shrink-0">
            {boss.shortName}
          </span>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-slate-100 text-sm">{boss.name}</h3>
            <ResetCycleBadge cycle={resetCycle} />
          </div>
          <p className="text-xs text-slate-500">{boss.group}</p>

          <div className="mt-3">
            <p className="text-xs text-slate-500 mb-2">난이도별 파티원 수</p>
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xs text-slate-500 mr-1">파티원 수:</span>
              {Array.from({ length: boss.maxParty }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPartySize(n)}
                  className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                    partySize === n
                      ? 'bg-cyber-500 text-white shadow-neon-sm'
                      : 'bg-dark-surface text-slate-400 border border-dark-border hover:border-cyber-700/50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              {boss.difficulties.map((diff) => {
                const isSelected = selected?.difficulty === diff.difficulty
                const myShare = Math.floor(diff.meso / partySize)

                return (
                  <button
                    key={diff.difficulty}
                    onClick={() => handleDifficultyClick(diff.difficulty)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all ${
                      isSelected
                        ? DIFFICULTY_COLORS[diff.difficulty] + ' border'
                        : 'bg-dark-surface/50 border-dark-border text-slate-400 hover:bg-dark-panel/50 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-medium">{diff.difficulty}</span>
                    <span className="text-xs">{formatMesoKorean(myShare)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-2">잡음 체크는 대시보드에서 하세요</p>
        </div>
      </div>
    </div>
  )
}
