import { useMemo, useState } from 'react'
import type { DropRecord } from '../../types'
import { PREDEFINED_DROP_ITEMS, getAcquisitionCounts, getDropItemGroups } from '../../data/dropItems'
import { buildDropSaleMemo, calcDropSale, normalizeDropSaleRatios } from '../../lib/dropSale'
import { formatMesoKorean, getToday, parseMesoInput } from '../../utils'
import DropItemIcon from './DropItemIcon'
import DropSaleSplitPanel from './DropSaleSplitPanel'

export interface DropSaleItem {
  itemName: string
  meso: number
  recordDate: string
  memo?: string
}

interface DropSaleSectionProps {
  drops: DropRecord[]
  onSell: (items: DropSaleItem[]) => Promise<void>
}

export default function DropSaleSection({ drops, onSell }: DropSaleSectionProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [recordDate, setRecordDate] = useState(getToday())
  const [mesoInput, setMesoInput] = useState('')
  const [feeRate, setFeeRate] = useState<5 | 3>(5)
  const [partySize, setPartySize] = useState(6)
  const [ratios, setRatios] = useState<number[]>(() => Array(6).fill(1))
  const [useCustomRatios, setUseCustomRatios] = useState(false)
  const [selling, setSelling] = useState(false)

  const stockByName = useMemo(() => getAcquisitionCounts(drops), [drops])

  const stockById = useMemo(
    () => new Map(PREDEFINED_DROP_ITEMS.map((i) => [i.id, stockByName.get(i.name) ?? 0])),
    [stockByName]
  )

  const groups = useMemo(
    () =>
      getDropItemGroups(
        PREDEFINED_DROP_ITEMS.map((item) => ({
          id: item.id,
          name: item.name,
          meso: 0,
          checked: selected.has(item.id),
        }))
      ),
    [selected]
  )

  const grossMeso = useMemo(() => parseMesoInput(mesoInput), [mesoInput])
  const saleCalc = useMemo(
    () =>
      calcDropSale({
        grossMeso,
        feeRate,
        partySize,
        ratios: normalizeDropSaleRatios(partySize, useCustomRatios ? ratios : undefined),
      }),
    [grossMeso, feeRate, partySize, ratios, useCustomRatios]
  )

  const toggleSelect = (id: string) => {
    if ((stockById.get(id) ?? 0) <= 0) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSell = async () => {
    if (selected.size === 0 || selling || !saleCalc) return

    const memo = buildDropSaleMemo(saleCalc)
    const items = PREDEFINED_DROP_ITEMS.filter((i) => selected.has(i.id)).map((i) => ({
      itemName: i.name,
      meso: saleCalc.myIncome,
      recordDate,
      memo: `${memo} · 판매 ${formatMesoKorean(saleCalc.grossMeso)}`,
    }))

    setSelling(true)
    try {
      await onSell(items)
      setSelected(new Set())
      setMesoInput('')
    } finally {
      setSelling(false)
    }
  }

  const hasStock = [...stockById.values()].some((n) => n > 0)

  return (
    <div className="panel-light p-5">
      <div className="mb-4">
        <h2 className="font-semibold text-slate-100">판매 기록</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          수수료·인원·비율 분배를 반영해 파티장 몫만 기록합니다.
        </p>
      </div>

      {!hasStock ? (
        <p className="text-sm text-slate-500 text-center py-6">판매할 보유 드랍이 없어요</p>
      ) : (
        <div className="space-y-5">
          {groups.map(({ group, items }) => (
            <div key={group}>
              <p className="text-xs text-slate-500 font-medium mb-2">{group}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {items.map((item) => {
                  const stock = stockById.get(item.id) ?? 0
                  const isSelected = selected.has(item.id)
                  const disabled = stock <= 0
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleSelect(item.id)}
                      disabled={disabled}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                        disabled
                          ? 'bg-dark-surface/30 border-dark-border/60 text-slate-600 cursor-not-allowed opacity-50'
                          : isSelected
                            ? 'bg-maple-500/10 border-maple-500/40 text-maple-200'
                            : 'bg-dark-surface/50 border-dark-border text-slate-400 hover:border-maple-500/20 hover:text-slate-300'
                      }`}
                    >
                      <DropItemIcon name={item.name} size="sm" />
                      <span className="text-sm flex-1 min-w-0">{item.name}</span>
                      <span className="text-xs text-slate-500 shrink-0">{stock}개</span>
                      <span
                        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 text-xs ${
                          isSelected
                            ? 'bg-maple-500 border-maple-400 text-white'
                            : 'border-slate-600'
                        }`}
                      >
                        {isSelected ? '✓' : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasStock && (
        <div className="mt-5 pt-4 border-t border-dark-border space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">판매일</label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">총 판매가 (억 단위)</label>
              <input
                value={mesoInput}
                onChange={(e) => setMesoInput(e.target.value)}
                placeholder="예: 100, 50.5억"
                className="input-field text-sm"
              />
            </div>
          </div>

          <DropSaleSplitPanel
            mesoInput={mesoInput}
            feeRate={feeRate}
            partySize={partySize}
            ratios={ratios}
            useCustomRatios={useCustomRatios}
            onFeeRateChange={setFeeRate}
            onPartySizeChange={setPartySize}
            onRatiosChange={setRatios}
            onUseCustomRatiosChange={setUseCustomRatios}
          />

          <p className="text-[11px] text-slate-600">
            여러 항목을 선택하면 각각 같은 조건으로 기록됩니다.
          </p>
          <button
            type="button"
            onClick={handleSell}
            disabled={selected.size === 0 || selling || !saleCalc}
            className="btn-primary text-sm w-full py-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {selling ? '판매 기록 중...' : `선택 항목 판매하기 (${selected.size})`}
          </button>
        </div>
      )}
    </div>
  )
}
