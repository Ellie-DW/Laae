import { useMemo, useState } from 'react'
import type { Character, HuntRecord } from '../../types'
import { getHeldSolErdaFragments } from '../../lib/huntStats'
import { getToday } from '../../utils'

interface SolErdaSpendSectionProps {
  hunts: HuntRecord[]
  characters: Character[]
  recordCharacterId: string
  onRecordCharacterChange: (characterId: string) => void
  showCharacterSelect: boolean
  onSpend: (data: { characterId: string; quantity: number; recordDate: string }) => Promise<void>
}

export default function SolErdaSpendSection({
  hunts,
  characters,
  recordCharacterId,
  onRecordCharacterChange,
  showCharacterSelect,
  onSpend,
}: SolErdaSpendSectionProps) {
  const [quantityInput, setQuantityInput] = useState('')
  const [recordDate, setRecordDate] = useState(getToday())
  const [spending, setSpending] = useState(false)

  const held = useMemo(() => getHeldSolErdaFragments(hunts), [hunts])
  const quantity = quantityInput.trim() ? Math.max(0, parseInt(quantityInput, 10) || 0) : 0
  const canSpend = held > 0 && quantity > 0 && quantity <= held && recordCharacterId && !spending

  const handleSpend = async () => {
    if (!canSpend) return
    setSpending(true)
    try {
      await onSpend({ characterId: recordCharacterId, quantity, recordDate })
      setQuantityInput('')
    } finally {
      setSpending(false)
    }
  }

  return (
    <div className="panel-light p-5 border-violet-500/20">
      <div className="mb-4">
        <h2 className="font-semibold text-slate-100">솔 에르다 조각 사용</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          전체 캐릭터 보유 조각에서 차감 · 사용 기록은 선택한 캐릭터에 남습니다.
        </p>
      </div>

      <div className="mb-4 px-4 py-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
        <p className="text-xs text-slate-500">전체 보유 솔 에르다 조각</p>
        <p className="text-xl font-bold text-violet-400 mt-0.5">{held.toLocaleString()}개</p>
      </div>

      {held <= 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">사용할 솔 에르다 조각이 없어요</p>
      ) : (
        <div className="space-y-3">
          {showCharacterSelect && (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">기록 캐릭터</label>
              <select
                value={recordCharacterId}
                onChange={(e) => onRecordCharacterChange(e.target.value)}
                className="input-field text-sm"
              >
                {characters.map((char) => (
                  <option key={char.id} value={char.id}>{char.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">사용 갯수</label>
            <input
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              type="number"
              min={1}
              max={held}
              placeholder={`최대 ${held.toLocaleString()}개`}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">사용일</label>
            <input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          {quantity > held && (
            <p className="text-xs text-red-400">보유 수량({held.toLocaleString()}개)을 초과할 수 없어요</p>
          )}
          <button
            type="button"
            onClick={handleSpend}
            disabled={!canSpend}
            className="btn-primary text-sm w-full py-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {spending ? '사용 기록 중...' : '솔 에르다 조각 사용하기'}
          </button>
        </div>
      )}
    </div>
  )
}
