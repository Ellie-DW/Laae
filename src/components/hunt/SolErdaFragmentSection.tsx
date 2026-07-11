import { useMemo, useState } from 'react'
import type { Character, HuntRecord } from '../../types'
import { getHeldSolErdaFragments } from '../../lib/huntStats'
import { getToday, parseMesoInput } from '../../utils'

interface SolErdaFragmentSectionProps {
  hunts: HuntRecord[]
  characters: Character[]
  recordCharacterId: string
  onRecordCharacterChange: (characterId: string) => void
  showCharacterSelect: boolean
  onPurchase: (data: {
    characterId: string
    quantity: number
    amount: number
    recordDate: string
  }) => Promise<void>
  onSpend: (data: { characterId: string; quantity: number; recordDate: string }) => Promise<void>
}

export default function SolErdaFragmentSection({
  hunts,
  characters,
  recordCharacterId,
  onRecordCharacterChange,
  showCharacterSelect,
  onPurchase,
  onSpend,
}: SolErdaFragmentSectionProps) {
  const [buyQuantityInput, setBuyQuantityInput] = useState('')
  const [buyMesoInput, setBuyMesoInput] = useState('')
  const [buyDate, setBuyDate] = useState(getToday())
  const [buying, setBuying] = useState(false)

  const [useQuantityInput, setUseQuantityInput] = useState('')
  const [useDate, setUseDate] = useState(getToday())
  const [using, setUsing] = useState(false)

  const held = useMemo(() => getHeldSolErdaFragments(hunts), [hunts])

  const buyQuantity = buyQuantityInput.trim() ? Math.max(0, parseInt(buyQuantityInput, 10) || 0) : 0
  const buyMeso = parseMesoInput(buyMesoInput)
  const canBuy =
    buyQuantity > 0 && buyMeso > 0 && recordCharacterId && !buying

  const useQuantity = useQuantityInput.trim() ? Math.max(0, parseInt(useQuantityInput, 10) || 0) : 0
  const canUse =
    held > 0 && useQuantity > 0 && useQuantity <= held && recordCharacterId && !using

  const handlePurchase = async () => {
    if (!canBuy) return
    setBuying(true)
    try {
      await onPurchase({
        characterId: recordCharacterId,
        quantity: buyQuantity,
        amount: buyMeso,
        recordDate: buyDate,
      })
      setBuyQuantityInput('')
      setBuyMesoInput('')
    } finally {
      setBuying(false)
    }
  }

  const handleSpend = async () => {
    if (!canUse) return
    setUsing(true)
    try {
      await onSpend({ characterId: recordCharacterId, quantity: useQuantity, recordDate: useDate })
      setUseQuantityInput('')
    } finally {
      setUsing(false)
    }
  }

  const characterSelect = showCharacterSelect && (
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
  )

  return (
    <div className="panel-light p-5 border-violet-500/20 space-y-5">
      <div>
        <h2 className="font-semibold text-slate-100">솔 에르다 조각</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          메소로 구매해 전체 보유량에 더하고, 필요할 때 사용합니다. 기록은 선택한 캐릭터에 남습니다.
        </p>
      </div>

      <div className="px-4 py-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
        <p className="text-xs text-slate-500">전체 보유 솔 에르다 조각</p>
        <p className="text-xl font-bold text-violet-400 mt-0.5">{held.toLocaleString()}개</p>
      </div>

      <div className="space-y-3 pt-1 border-t border-dark-border/60">
        <p className="text-sm font-medium text-slate-300">구매</p>
        {characterSelect}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">구매 갯수</label>
            <input
              value={buyQuantityInput}
              onChange={(e) => setBuyQuantityInput(e.target.value)}
              type="number"
              min={1}
              placeholder="0"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">지출 메소 (억 단위)</label>
            <input
              value={buyMesoInput}
              onChange={(e) => setBuyMesoInput(e.target.value)}
              placeholder="예: 1, 0.5, 1.5억"
              className="input-field text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">구매일</label>
          <input
            type="date"
            value={buyDate}
            onChange={(e) => setBuyDate(e.target.value)}
            className="input-field text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handlePurchase}
          disabled={!canBuy}
          className="btn-primary text-sm w-full py-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {buying ? '구매 기록 중...' : '솔 에르다 조각 구매하기'}
        </button>
      </div>

      <div className="space-y-3 pt-1 border-t border-dark-border/60">
        <p className="text-sm font-medium text-slate-300">사용</p>
        {held <= 0 ? (
          <p className="text-sm text-slate-500 text-center py-2">사용할 조각이 없어요. 먼저 구매하거나 사냥에서 획득하세요.</p>
        ) : (
          <>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">사용 갯수</label>
              <input
                value={useQuantityInput}
                onChange={(e) => setUseQuantityInput(e.target.value)}
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
                value={useDate}
                onChange={(e) => setUseDate(e.target.value)}
                className="input-field text-sm"
              />
            </div>
            {useQuantity > held && (
              <p className="text-xs text-red-400">보유 수량({held.toLocaleString()}개)을 초과할 수 없어요</p>
            )}
            <button
              type="button"
              onClick={handleSpend}
              disabled={!canUse}
              className="btn-secondary text-sm w-full py-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {using ? '사용 기록 중...' : '솔 에르다 조각 사용하기'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
