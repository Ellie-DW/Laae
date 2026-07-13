import { useMemo, useState } from 'react'
import type { HuntRecord } from '../../types'
import { getHeldSolErdaFragments } from '../../lib/huntStats'
import { calcDropSale, type DropSaleFeeRate } from '../../lib/dropSale'
import { formatMesoKorean, getToday, parseMesoInput } from '../../utils'
import { HeldSolErdaStat, SolErdaSectionTitle } from './SolErdaIcon'

const FEE_OPTIONS: DropSaleFeeRate[] = [5, 3]

interface SolErdaSaleSectionProps {
  hunts: HuntRecord[]
  characterId: string
  onSell: (data: { quantity: number; meso: number; recordDate: string }) => Promise<void>
}

export default function SolErdaSaleSection({ hunts, characterId, onSell }: SolErdaSaleSectionProps) {
  const [quantityInput, setQuantityInput] = useState('')
  const [mesoInput, setMesoInput] = useState('')
  const [feeRate, setFeeRate] = useState<DropSaleFeeRate>(5)
  const [recordDate, setRecordDate] = useState(getToday())
  const [selling, setSelling] = useState(false)

  const held = useMemo(() => getHeldSolErdaFragments(hunts, characterId), [hunts, characterId])
  const quantity = quantityInput.trim() ? Math.max(0, parseInt(quantityInput, 10) || 0) : 0
  const grossMeso = parseMesoInput(mesoInput)
  const saleCalc = useMemo(
    () => calcDropSale({ grossMeso, feeRate, partySize: 1 }),
    [grossMeso, feeRate]
  )
  const netMeso = saleCalc?.myIncome ?? 0
  const canSell = held > 0 && quantity > 0 && quantity <= held && netMeso > 0 && !selling

  const handleSell = async () => {
    if (!canSell || !saleCalc) return
    setSelling(true)
    try {
      await onSell({ quantity, meso: saleCalc.myIncome, recordDate })
      setQuantityInput('')
      setMesoInput('')
    } finally {
      setSelling(false)
    }
  }

  return (
    <div className="panel-light p-5">
      <SolErdaSectionTitle
        title="솔 에르다 조각 판매"
        description="판매 수수료를 반영한 실수령 금액이 기록되고, 보유 조각이 차감됩니다."
      />

      <div className="mb-4">
        <HeldSolErdaStat label="보유 솔 에르다 조각" count={held} />
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
            <label className="text-xs text-slate-500 mb-1 block">총 판매가 (억 단위)</label>
            <input
              value={mesoInput}
              onChange={(e) => setMesoInput(e.target.value)}
              placeholder="예: 1, 0.5, 1.5억"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-2 block">수수료</label>
            <div className="flex gap-2">
              {FEE_OPTIONS.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setFeeRate(rate)}
                  className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                    feeRate === rate
                      ? 'bg-maple-500/20 border-maple-500/40 text-maple-300'
                      : 'border-dark-border text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>
          {saleCalc && grossMeso > 0 && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
              <p className="text-[11px] text-slate-500">
                판매 {formatMesoKorean(saleCalc.grossMeso)} · 수수료 {saleCalc.feeRate}% · 실수령{' '}
                <span className="text-violet-300 font-semibold">
                  {formatMesoKorean(saleCalc.myIncome)}
                </span>
              </p>
            </div>
          )}
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
