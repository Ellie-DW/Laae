import type { BossSelection } from '../../types'
import { BOSSES, getBossResetCycle } from '../../data/bosses'
import { formatMesoKorean } from '../../utils'
import ResetCycleBadge from './ResetCycleBadge'

interface SelectedBossSummaryProps {
  checkedBosses: BossSelection[]
}

export default function SelectedBossSummary({ checkedBosses }: SelectedBossSummaryProps) {
  return (
    <div className="panel-light p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-slate-100">잡은 보스</h2>
        <span className="text-xs text-slate-500">{checkedBosses.length}개</span>
      </div>
      <p className="text-xs text-slate-500 mb-4">✓ 체크한 보스만 수익에 반영돼요</p>

      {checkedBosses.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          아직 잡은 보스가 없어요
        </div>
      ) : (
        <div className="space-y-2">
          {checkedBosses.map((sel) => {
            const boss = BOSSES.find((b) => b.id === sel.bossId)
            const diff = boss?.difficulties.find((d) => d.difficulty === sel.difficulty)
            const myShare = diff ? Math.floor(diff.meso / sel.partySize) : 0

            return (
              <div
                key={`${sel.bossId}-${sel.difficulty}`}
                className="flex items-center justify-between p-3 bg-cyber-500/5 rounded-lg border border-cyber-500/15"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-cyber-400 w-8 text-center">
                    {boss?.shortName}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-200">{boss?.name}</p>
                      {boss && <ResetCycleBadge cycle={getBossResetCycle(boss)} />}
                    </div>
                    <p className="text-xs text-slate-500">{sel.difficulty} · 파티 {sel.partySize}인</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-maple-400">
                  {formatMesoKorean(myShare)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
