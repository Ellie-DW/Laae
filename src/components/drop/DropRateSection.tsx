import { useMemo } from 'react'
import type { BossDifficulty, BossSnapshot, Character, CharacterBossData, DropRecord } from '../../types'
import {
  formatDifficultyList,
  formatDropRate,
  getDropRateStats,
} from '../../lib/dropRates'
import { getBossIconSrc } from '../../lib/assetImages'
import { DIFFICULTY_COLORS } from '../../utils'
import DropItemIcon from './DropItemIcon'

interface DropRateSectionProps {
  characters: Character[]
  characterId?: string
  drops: DropRecord[]
  snapshots: BossSnapshot[]
  bossDataMap: Record<string, CharacterBossData>
}

function DifficultyChip({ difficulty, kills }: { difficulty: BossDifficulty; kills?: number }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${DIFFICULTY_COLORS[difficulty]}`}>
      {difficulty}
      {kills != null ? ` ${kills}` : ''}
    </span>
  )
}

export default function DropRateSection({
  characters,
  characterId,
  drops,
  snapshots,
  bossDataMap,
}: DropRateSectionProps) {
  const characterIds = useMemo(
    () => (characterId ? [characterId] : characters.map((c) => c.id)),
    [characterId, characters]
  )

  const stats = useMemo(
    () => getDropRateStats(drops, snapshots, characterIds, bossDataMap),
    [drops, snapshots, characterIds, bossDataMap]
  )

  if (stats.bosses.length === 0 && stats.shared.length === 0 && stats.combined.length === 0) {
    return (
      <div className="panel-light p-5">
        <h2 className="font-semibold text-slate-100 mb-1">처치 대비 드랍</h2>
        <p className="text-xs text-slate-500 mb-4">주간·월간 잡음 체크와 획득 기록을 비교해요</p>
        <p className="text-sm text-slate-500 text-center py-6">아직 잡음 체크나 드랍 기록이 없어요</p>
      </div>
    )
  }

  return (
    <div className="panel-light p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-slate-100">처치 대비 드랍</h2>
        <span className="text-xs text-slate-500">
          처치 {stats.totalKills}회 · 드랍 {stats.totalDrops}개
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        처치 횟수는 대시보드 잡음 체크 기준이에요. 드랍은 기록한 보스·난이도별로 나눠 봐요.
      </p>

      {stats.combined.length > 0 && (
        <div className="mb-5 rounded-lg border border-dark-border bg-dark-surface/40 p-3">
          <p className="text-sm font-medium text-slate-200 mb-0.5">반지 상자 · 칠흑 상자 · 주문서 합산</p>
          <p className="text-[10px] text-slate-500 mb-3">나오는 모든 보스·난이도 처치를 합쳐서 봐요</p>
          {[
            { group: '반지 상자', label: '반지 상자' },
            { group: '칠흑', label: '칠흑 상자' },
            { group: '주문서', label: '주문서' },
          ].map(({ group, label }) => {
            const items = stats.combined.filter((item) => item.group === group)
            if (items.length === 0) return null
            return (
              <div key={group} className="mb-3 last:mb-0">
                <p className="text-[10px] text-slate-500 mb-1">{label}</p>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div key={item.id}>
                      <div className="flex items-center gap-2 py-0.5">
                        <DropItemIcon name={item.name} size="xs" />
                        <p className="text-xs text-slate-300 truncate flex-1">{item.name}</p>
                        <span className={`text-xs tabular-nums ${item.drops > 0 ? 'text-maple-300' : 'text-slate-600'}`}>
                          {item.drops}개
                        </span>
                        <span className="text-[10px] text-slate-600 w-14 text-right tabular-nums">
                          {item.kills}회
                        </span>
                        <span className="text-[11px] text-slate-500 w-16 text-right tabular-nums">
                          {formatDropRate(item.drops, item.kills)}
                        </span>
                      </div>
                      {item.opens.length > 0 && (
                        <div className="pl-7 mt-0.5 space-y-0.5">
                          {item.opens.map((open) => (
                            <div key={open.id} className="flex items-center gap-2 py-0.5">
                              <DropItemIcon name={open.name} size="xs" />
                              <p className="text-[11px] text-slate-400 truncate flex-1">{open.name}</p>
                              <span className="text-[11px] tabular-nums text-maple-300">{open.count}개</span>
                              <span className="w-14 shrink-0" />
                              <span className="text-[11px] text-slate-500 w-16 text-right tabular-nums">
                                {formatDropRate(open.count, item.opened)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="space-y-3">
        {stats.bosses.map((boss) => {
          const iconSrc = getBossIconSrc(boss.bossId)
          return (
            <div
              key={boss.bossId}
              className="rounded-lg border border-dark-border bg-dark-surface/40 p-3"
            >
              <div className="flex items-center gap-3 mb-2">
                {iconSrc ? (
                  <img
                    src={iconSrc}
                    alt=""
                    className="w-8 h-8 rounded-lg bg-dark-surface border border-dark-border object-contain p-0.5 shrink-0"
                    draggable={false}
                  />
                ) : (
                  <span className="w-8 h-8 rounded-lg bg-dark-surface border border-dark-border flex items-center justify-center text-[10px] font-bold text-cyber-400 shrink-0">
                    {boss.shortName}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-200">{boss.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {boss.difficultyKills.length > 0 ? (
                      boss.difficultyKills.map((row) => (
                        <DifficultyChip
                          key={row.difficulty}
                          difficulty={row.difficulty}
                          kills={row.kills}
                        />
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-500">{boss.group}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-cyber-300 shrink-0">
                  {boss.kills}<span className="text-xs font-normal text-slate-500">회</span>
                </span>
              </div>

              {boss.itemGroups.length === 0 ? (
                <p className="text-[11px] text-slate-600">이 보스에서 기록하는 드랍은 없어요</p>
              ) : (
                <div className="space-y-3">
                  {boss.itemGroups.map((group) => (
                    <div key={group.untagged ? 'untagged' : group.difficulties.join('|')}>
                      <p className="text-[10px] text-slate-500 mb-1">
                        {group.untagged
                          ? '난이도 미기록'
                          : `${formatDifficultyList(group.difficulties)} · ${group.kills}회`}
                      </p>
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 py-0.5">
                            <DropItemIcon name={item.name} size="xs" />
                            <p className="text-xs text-slate-300 truncate flex-1">{item.name}</p>
                            <span className={`text-xs tabular-nums ${item.drops > 0 ? 'text-maple-300' : 'text-slate-600'}`}>
                              {item.drops}개
                            </span>
                            <span className="text-[11px] text-slate-500 w-16 text-right tabular-nums">
                              {item.untagged ? '미기록' : formatDropRate(item.drops, item.kills)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {stats.shared.length > 0 && (
        <div className="mt-5 pt-4 border-t border-dark-border">
          <p className="text-xs text-slate-500 font-medium mb-3">보스·난이도 미기록</p>
          <div className="space-y-1">
            {stats.shared.map((item) => (
              <div key={item.id} className="flex items-center gap-2 py-0.5">
                <DropItemIcon name={item.name} size="xs" />
                <p className="text-xs text-slate-300 truncate flex-1">{item.name}</p>
                <span className="text-xs tabular-nums text-maple-300">{item.untaggedDrops}개</span>
                <span className="text-[11px] text-slate-500 w-16 text-right">미기록</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
