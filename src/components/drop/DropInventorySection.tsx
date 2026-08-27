import { useEffect, useMemo, useState } from 'react'
import type { DropRecord } from '../../types'
import { PREDEFINED_DROP_ITEMS, RING_MISS_NAME, getAcquisitionCounts } from '../../data/dropItems'
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

interface DropInventorySectionProps {
  drops: DropRecord[]
  characterId?: string | null
  onSell: (items: DropSaleItem[]) => Promise<void>
}

export default function DropInventorySection({
  drops,
  characterId,
  onSell,
}: DropInventorySectionProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [recordDate, setRecordDate] = useState(getToday())
  const [mesoInput, setMesoInput] = useState('')
  const [feeRate, setFeeRate] = useState<5 | 3>(5)
  const [partySize, setPartySize] = useState(1)
  const [ratios, setRatios] = useState<number[]>(() => Array(1).fill(1))
  const [useCustomRatios, setUseCustomRatios] = useState(false)
  const [selling, setSelling] = useState(false)

  useEffect(() => {
    setSelected(new Set())
  }, [characterId])

  const stockByName = useMemo(
    () => getAcquisitionCounts(drops, characterId ?? undefined),
    [drops, characterId]
  )

  useEffect(() => {
    setSelected((prev) => {
      const next = new Set(
        [...prev].filter((id) => {
          const item = PREDEFINED_DROP_ITEMS.find((i) => i.id === id)
          return item != null && (stockByName.get(item.name) ?? 0) > 0
        })
      )
      if (next.size === prev.size && [...next].every((id) => prev.has(id))) return prev
      return next
    })
  }, [stockByName])

  const groups = useMemo(() => {
    const groupOrder = [...new Set(PREDEFINED_DROP_ITEMS.map((i) => i.group))]
    return groupOrder
      .map((group) => ({
        group,
        items: PREDEFINED_DROP_ITEMS.filter(
          (item) =>
            item.group === group &&
            item.name !== RING_MISS_NAME &&
            (stockByName.get(item.name) ?? 0) > 0
        ).map((item) => ({
          ...item,
          count: stockByName.get(item.name) ?? 0,
        })),
      }))
      .filter((group) => group.items.length > 0)
  }, [stockByName])

  const heldKinds = groups.reduce((sum, group) => sum + group.items.length, 0)
  const heldTotal = groups.reduce(
    (sum, group) => sum + group.items.reduce((s, item) => s + item.count, 0),
    0
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

  return (
    <div className="panel-glow p-5 border-maple-500/20">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="font-semibold text-slate-100">보유</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {selected.size > 0
              ? `${selected.size}개 선택 · 아래에서 판매 조건을 입력하세요`
              : '아이템을 고르면 판매할 수 있어요'}
          </p>
        </div>
        <span className="text-sm font-bold text-maple-400 shrink-0">
          {heldKinds}
          <span className="text-xs font-normal text-slate-500">종</span>
          {' · '}
          {heldTotal}
          <span className="text-xs font-normal text-slate-500">개</span>
        </span>
      </div>

      {heldTotal === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">보유 중인 드랍이 없어요</p>
      ) : (
        <div className="space-y-4">
          {groups.map(({ group, items }) => (
            <div key={group}>
              <p className="text-xs text-slate-500 font-medium mb-2">{group}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {items.map((item) => {
                  const isSelected = selected.has(item.id)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleSelect(item.id)}
                      className={`px-3 py-2 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-maple-500/15 border-maple-500/50 text-maple-200'
                          : 'bg-maple-500/10 border-maple-500/30 text-maple-200 hover:border-maple-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <DropItemIcon name={item.name} size="xs" />
                        <p className="truncate text-xs flex-1">{item.name}</p>
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 text-[10px] ${
                            isSelected
                              ? 'bg-maple-500 border-maple-400 text-white'
                              : 'border-slate-600 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                      </div>
                      <p className="text-lg font-bold mt-1 text-maple-400">{item.count}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected.size > 0 && (
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
            여러 항목을 선택하면 각각 같은 조건으로 기록됩니다. 수수료·인원·비율 분배를 반영해 파티장
            몫만 기록합니다.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSell}
              disabled={selling || !saleCalc}
              className="btn-primary text-sm flex-1 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {selling ? '판매 기록 중...' : `선택 항목 판매하기 (${selected.size})`}
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="btn-secondary text-sm px-4 py-2"
            >
              해제
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
