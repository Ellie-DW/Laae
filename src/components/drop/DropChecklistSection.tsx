import { useEffect, useMemo, useState } from 'react'
import type { BossDifficulty, Character, CharacterBossData } from '../../types'
import {
  CHAOS_BLACK_BOX_NAME,
  getBoxRewards,
  getDropItemGroups,
  isOpenableBoxName,
  withBoxOpenMemo,
} from '../../data/dropItems'
import { getBossDropTable } from '../../data/bossDrops'
import { getTrackedItemsForSource } from '../../lib/dropRates'
import { getToday } from '../../utils'
import DropItemIcon from './DropItemIcon'
import DropSourcePicker from './DropSourcePicker'

export interface DropAddItem {
  itemName: string
  recordDate: string
  memo?: string
  bossId: string
  difficulty: BossDifficulty
}

interface DropChecklistSectionProps {
  characters: Character[]
  characterId: string
  bossDataMap: Record<string, CharacterBossData>
  onCharacterChange: (id: string) => void
  onAdd: (items: DropAddItem[]) => Promise<void>
}

function defaultSource(characterId: string, bossDataMap: Record<string, CharacterBossData>) {
  const selected = bossDataMap[characterId]?.selections.find(
    (sel) => sel.checked && getBossDropTable(sel.bossId)
  )
  if (!selected) return { bossId: '', difficulty: '' as const }
  return { bossId: selected.bossId, difficulty: selected.difficulty }
}

export default function DropChecklistSection({
  characters,
  characterId,
  bossDataMap,
  onCharacterChange,
  onAdd,
}: DropChecklistSectionProps) {
  const initial = defaultSource(characterId, bossDataMap)
  const [bossId, setBossId] = useState(initial.bossId)
  const [difficulty, setDifficulty] = useState<BossDifficulty | ''>(initial.difficulty)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [boxPicks, setBoxPicks] = useState<Record<string, string>>({})
  const [recordDate, setRecordDate] = useState(getToday)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const next = defaultSource(characterId, bossDataMap)
    setBossId(next.bossId)
    setDifficulty(next.difficulty)
    setSelected(new Set())
    setBoxPicks({})
  }, [characterId])

  const sourceItems = useMemo(
    () => (bossId && difficulty ? getTrackedItemsForSource(bossId, difficulty) : []),
    [bossId, difficulty]
  )

  const groups = useMemo(
    () =>
      getDropItemGroups(
        sourceItems.map((item) => ({
          id: item.id,
          name: item.name,
          meso: 0,
          checked: selected.has(item.id),
        }))
      ),
    [sourceItems, selected]
  )

  const selectedBoxes = sourceItems.filter((item) => isOpenableBoxName(item.name) && selected.has(item.id))
  const boxNeedsReward = selectedBoxes.some((item) => !boxPicks[item.id])
  const canSubmit = Boolean(bossId && difficulty && selected.size > 0 && !boxNeedsReward && !adding)

  const toggleSelect = (id: string, itemName: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        if (isOpenableBoxName(itemName)) {
          setBoxPicks((picks) => {
            const rest = { ...picks }
            delete rest[id]
            return rest
          })
        }
      } else {
        next.add(id)
        if (isOpenableBoxName(itemName)) {
          const rewards = getBoxRewards(itemName)
          setBoxPicks((picks) => ({ ...picks, [id]: rewards[0]?.name ?? '' }))
        }
      }
      return next
    })
  }

  const handleSourceChange = (nextBossId: string, nextDifficulty: BossDifficulty) => {
    setBossId(nextBossId)
    setDifficulty(nextDifficulty)
    setSelected(new Set())
    setBoxPicks({})
  }

  const handleAdd = async () => {
    if (!canSubmit || !bossId || !difficulty) return
    const items = sourceItems.filter((item) => selected.has(item.id)).map((item) => {
      if (isOpenableBoxName(item.name)) {
        return {
          itemName: boxPicks[item.id],
          recordDate,
          memo: withBoxOpenMemo(null, item.name),
          bossId,
          difficulty,
        }
      }
      return { itemName: item.name, recordDate, bossId, difficulty }
    })
    setAdding(true)
    try {
      await onAdd(items)
      setSelected(new Set())
      setBoxPicks({})
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="panel-light p-5">
      <div className="mb-4">
        <h2 className="font-semibold text-slate-100">획득 추가</h2>
        <p className="text-xs text-slate-500 mt-0.5">보스·난이도를 고른 뒤 나온 아이템을 기록하세요</p>
      </div>

      <div className="mb-4">
        <label className="text-xs text-slate-500 mb-1 block">기록 캐릭터</label>
        <select
          value={characterId}
          onChange={(e) => onCharacterChange(e.target.value)}
          className="input-field text-sm"
        >
          {characters.map((char) => (
            <option key={char.id} value={char.id}>
              {char.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-5">
        <DropSourcePicker bossId={bossId} difficulty={difficulty} onChange={handleSourceChange} />
      </div>

      {!bossId || !difficulty ? (
        <p className="text-sm text-slate-500 text-center py-6">보스와 난이도를 먼저 고르세요</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">이 난이도에서 기록하는 드랍은 없어요</p>
      ) : (
        <div className="space-y-5">
          {groups.map(({ group, items }) => (
            <div key={group}>
              <p className="text-xs text-slate-500 font-medium mb-2">{group}</p>
              {group === '칠흑' && items.some((item) => item.name === CHAOS_BLACK_BOX_NAME) && (
                <p className="text-[11px] text-slate-600 mb-2">
                  상자가 뜨면 상자를 체크한 뒤 나온 칠흑을 고르세요. 보스에서 직접 뜨면 그 칠흑만 고르세요.
                </p>
              )}
              {group === '반지 상자' && (
                <p className="text-[11px] text-slate-600 mb-2">
                  상자를 체크한 뒤 나온 링을 고르세요. 안 나왔으면 미당첨을 고르세요.
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {items.map((item) => {
                  const isSelected = selected.has(item.id)
                  const isBox = isOpenableBoxName(item.name)
                  const rewards = isBox ? getBoxRewards(item.name) : []
                  const pick = boxPicks[item.id] ?? ''
                  return (
                    <div key={item.id} className={isBox && isSelected ? 'sm:col-span-2 space-y-2' : ''}>
                      <button
                        type="button"
                        onClick={() => toggleSelect(item.id, item.name)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all w-full ${
                          isSelected
                            ? 'bg-cyber-500/10 border-cyber-500/40 text-cyber-200'
                            : 'bg-dark-surface/50 border-dark-border text-slate-400 hover:border-maple-500/20 hover:text-slate-300'
                        }`}
                      >
                        <DropItemIcon name={item.name} size="sm" />
                        <span className="text-sm flex-1 min-w-0">{item.name}</span>
                        <span
                          className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 text-xs ${
                            isSelected
                              ? 'bg-cyber-500 border-cyber-400 text-white'
                              : 'border-slate-600'
                          }`}
                        >
                          {isSelected ? '✓' : ''}
                        </span>
                      </button>
                      {isBox && isSelected && (
                        <div className="rounded-lg border border-maple-500/30 bg-maple-500/5 p-3">
                          <label className="text-[11px] text-maple-300/80 mb-1.5 block">
                            {item.name === CHAOS_BLACK_BOX_NAME ? '상자에서 나온 칠흑' : '상자에서 나온 결과'}
                          </label>
                          <div className="flex items-center gap-2">
                            {pick && <DropItemIcon name={pick} size="sm" />}
                            <select
                              value={pick}
                              onChange={(e) => setBoxPicks((prev) => ({ ...prev, [item.id]: e.target.value }))}
                              className="input-field text-sm flex-1"
                            >
                              {rewards.map((reward) => (
                                <option key={reward.id} value={reward.name}>
                                  {reward.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-dark-border space-y-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">획득일</label>
          <input
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            className="input-field text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canSubmit}
          className="btn-primary text-sm w-full py-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {adding ? '기록 중...' : `선택 항목 획득 기록 (${selected.size})`}
        </button>
      </div>
    </div>
  )
}
