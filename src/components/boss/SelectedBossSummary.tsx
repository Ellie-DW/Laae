import { useMemo } from 'react'
import type { BossSelection } from '../../types'
import { BOSSES, getBossResetCycle } from '../../data/bosses'
import { formatMesoKorean } from '../../utils'
import { getBossIconSrc } from '../../lib/assetImages'
import ResetCycleBadge from './ResetCycleBadge'

interface SelectedBossSummaryProps {
  plannedBosses: BossSelection[]
}

function getPlannedBossShare(sel: BossSelection): number {
  const boss = BOSSES.find((b) => b.id === sel.bossId)
  const diff = boss?.difficulties.find((d) => d.difficulty === sel.difficulty)
  return diff ? Math.floor(diff.meso / sel.partySize) : 0
}

export default function SelectedBossSummary({ plannedBosses }: SelectedBossSummaryProps) {
  const sortedBosses = useMemo(
    () => [...plannedBosses].sort((a, b) => getPlannedBossShare(b) - getPlannedBossShare(a)),
    [plannedBosses]
  )
  return (
    <div className="panel-light p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-slate-100">예상 보스</h2>
        <span className="text-xs text-slate-500">{plannedBosses.length}개</span>
      </div>
      <p className="text-xs text-slate-500 mb-4">난이도를 선택한 보스 기준이에요. 잡음 체크는 대시보드에서 하세요.</p>

      {plannedBosses.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          아직 선택한 보스가 없어요
        </div>
      ) : (
        <div className="space-y-2">
          {sortedBosses.map((sel) => {
            const boss = BOSSES.find((b) => b.id === sel.bossId)
            const myShare = getPlannedBossShare(sel)
            const bossIconSrc = boss ? getBossIconSrc(boss.id) : undefined

            return (
              <div
                key={`${sel.bossId}-${sel.difficulty}`}
                className="flex items-center justify-between p-3 bg-cyber-500/5 rounded-lg border border-cyber-500/15"
              >
                <div className="flex items-center gap-3">
                  {bossIconSrc ? (
                    <img
                      src={bossIconSrc}
                      alt=""
                      className="w-10 h-10 rounded-lg bg-dark-surface border border-dark-border object-contain p-0.5 shrink-0"
                      draggable={false}
                    />
                  ) : (
                    <span className="w-10 h-10 rounded-lg bg-dark-surface border border-dark-border flex items-center justify-center text-xs font-bold text-cyber-400 shrink-0">
                      {boss?.shortName}
                    </span>
                  )}
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
