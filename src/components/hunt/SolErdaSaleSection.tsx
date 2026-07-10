import { useMemo, useState } from 'react'
import type { HuntRecord } from '../../types'
import { getHeldSolErdaFragments } from '../../lib/huntStats'
import { formatMesoKorean, getToday, parseMesoInput } from '../../utils'

interface SolErdaSaleSectionProps {
  hunts: HuntRecord[]
  characterId: string
  onSell: (data: { quantity: number; meso: number; recordDate: string }) => Promise<void>
}

export default function SolErdaSaleSection({ hunts, characterId, onSell }: SolErdaSaleSectionProps) {
  const [quantityInput, setQuantityInput] = useState('')
  const [mesoInput, setMesoInput] = useState('')
  const [recordDate, setRecordDate] = useState(getToday())
  const [selling, setSelling] = useState(false)

  const held = useMemo(() => getHeldSolErdaFragments(hunts, characterId), [hunts, characterId])
  const quantity = quantityInput.trim() ? Math.max(0, parseInt(quantityInput, 10) || 0) : 0
  const meso = parseMesoInput(mesoInput)
  const canSell = held > 0 && quantity > 0 && quantity <= held && meso > 0 && !selling

  const handleSell = async () => {
    if (!canSell) return
    setSelling(true)
    try {
      await onSell({ quantity, meso, recordDate })
      setQuantityInput('')
      setMesoInput('')
    } finally {
      setSelling(false)
    }
  }

  return (
    <div className="panel-light p-5">
      <div className="mb-4">
        <h2 className="font-semibold text-slate-100">솔 에르다 조각 판매</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          판매 시 보유 조각이 차감되고 솔 에르다 조각 판매 수익에 반영됩니다.
        </p>
      </div>

      <div className="mb-4 px-4 py-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
        <p className="text-xs text-slate-500">보유 솔 에르다 조각</p>
        <p className="text-xl font-bold text-violet-400 mt-0.5">{held.toLocaleString()}개</p>
      </div>

      {held <= 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">판매할 솔 에르다 조각이 없어요</p>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">판매 갯수</label>
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
            <label className="text-xs text-slate-500 mb-1 block">판매 금액 (억 단위)</label>
            <input
              value={mesoInput}
              onChange={(e) => setMesoInput(e.target.value)}
              placeholder="예: 1, 0.5, 1.5억"
              className="input-field text-sm"
            />
            {meso > 0 && (
              <p className="text-[11px] text-slate-600 mt-1">{formatMesoKorean(meso)}</p>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">판매일</label>
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
            onClick={handleSell}
            disabled={!canSell}
            className="btn-primary text-sm w-full py-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {selling ? '판매 기록 중...' : '솔 에르다 조각 판매하기'}
          </button>
        </div>
      )}
    </div>
  )
}
