import { useMemo } from 'react'
import {
  buildDropSaleMemo,
  calcDropSale,
  formatDropSaleAmount,
  formatDropSaleAmountDetail,
  getDropSaleMemberLabels,
  normalizeDropSaleRatios,
  type DropSaleCalcResult,
  type DropSaleFeeRate,
} from '../../lib/dropSale'
import { formatMesoKorean, parseMesoInput } from '../../utils'

const FEE_OPTIONS: DropSaleFeeRate[] = [5, 3]
const PARTY_SIZES = [1, 2, 3, 4, 5, 6] as const

interface DropSaleSplitPanelProps {
  mesoInput: string
  feeRate: DropSaleFeeRate
  partySize: number
  ratios: number[]
  useCustomRatios: boolean
  onFeeRateChange: (rate: DropSaleFeeRate) => void
  onPartySizeChange: (size: number) => void
  onRatiosChange: (ratios: number[]) => void
  onUseCustomRatiosChange: (value: boolean) => void
}

export default function DropSaleSplitPanel({
  mesoInput,
  feeRate,
  partySize,
  ratios,
  useCustomRatios,
  onFeeRateChange,
  onPartySizeChange,
  onRatiosChange,
  onUseCustomRatiosChange,
}: DropSaleSplitPanelProps) {
  const grossMeso = useMemo(() => parseMesoInput(mesoInput), [mesoInput])
  const normalizedRatios = useMemo(
    () => normalizeDropSaleRatios(partySize, useCustomRatios ? ratios : undefined),
    [partySize, ratios, useCustomRatios]
  )

  const saleCalc = useMemo(
    () =>
      calcDropSale({
        grossMeso,
        feeRate,
        partySize,
        ratios: normalizedRatios,
      }),
    [grossMeso, feeRate, partySize, normalizedRatios]
  )

  const labels = useMemo(() => getDropSaleMemberLabels(partySize), [partySize])

  const handleRatioChange = (index: number, value: string) => {
    const parsed = Math.max(1, parseInt(value.replace(/[^\d]/g, ''), 10) || 1)
    const next = normalizeDropSaleRatios(partySize, ratios)
    next[index] = parsed
    onRatiosChange(next)
  }

  const handlePartySizeChange = (size: number) => {
    onPartySizeChange(size)
    onRatiosChange(normalizeDropSaleRatios(size, ratios))
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-slate-500 mb-2 block">수수료</label>
        <div className="flex gap-2">
          {FEE_OPTIONS.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => onFeeRateChange(rate)}
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

      <div>
        <label className="text-xs text-slate-500 mb-2 block flex items-center gap-1.5">
          <span aria-hidden>👥</span>
          인원수
        </label>
        <div className="grid grid-cols-6 gap-2">
          {PARTY_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => handlePartySizeChange(size)}
              className={`py-2 rounded-lg text-sm border transition-colors ${
                partySize === size
                  ? 'bg-cyber-500/20 border-cyber-500/40 text-cyber-300'
                  : 'border-dark-border text-slate-500 hover:text-slate-300'
              }`}
            >
              {size}명
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-cyber-500/20 overflow-hidden">
        <button
          type="button"
          onClick={() => onUseCustomRatiosChange(!useCustomRatios)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-cyber-500/10 hover:bg-cyber-500/15 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm text-slate-200">
            <span
              className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                useCustomRatios
                  ? 'bg-cyber-500 border-cyber-400 text-white'
                  : 'border-slate-600 text-transparent'
              }`}
            >
              ✓
            </span>
            상세 비율 설정
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-cyber-500/15 text-cyber-300 border border-cyber-500/20">
            {useCustomRatios ? normalizedRatios.join(' : ') : '균등 분배'}
          </span>
        </button>

        {useCustomRatios && (
          <div className="p-4 space-y-4 bg-dark-surface/30 border-t border-cyber-500/15">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              판매 수수료 → 분배 전달 수수료 순으로 차감됩니다. 최종 실수령은 0.1억 단위로 내림하고,
              균등 분배면 모두 같은 금액을 받습니다.
            </p>

            <div className={`grid gap-2 ${partySize <= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
              {labels.map((label, index) => (
                <div key={label}>
                  <label className="text-[10px] text-slate-500 mb-1 block">{label}</label>
                  <input
                    type="number"
                    min={1}
                    value={normalizedRatios[index]}
                    onChange={(e) => handleRatioChange(index, e.target.value)}
                    className="input-field text-sm text-center"
                  />
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-2">
                입력 비율 <span className="text-cyber-300">{normalizedRatios.join(' : ')}</span>
              </p>
              <div className="space-y-2">
                {labels.map((label, index) => {
                  const percent = saleCalc?.members[index]?.ratioPercent ?? (100 / partySize)
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span>{label}</span>
                        <span>{percent.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-dark-bg overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            index === 0
                              ? 'bg-gradient-to-r from-maple-600/80 to-maple-300/90'
                              : 'bg-gradient-to-r from-cyber-700/80 to-cyber-400/90'
                          }`}
                          style={{ width: `${Math.max(percent, 4)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {saleCalc && (
        <DropSaleResultCards saleCalc={saleCalc} />
      )}
    </div>
  )
}

export function DropSaleResultCards({ saleCalc }: { saleCalc: DropSaleCalcResult }) {
  return (
    <div className="rounded-xl overflow-hidden border border-violet-500/20">
      <div className="px-4 py-3 bg-gradient-to-r from-violet-900/40 via-violet-700/20 to-cyber-900/30 border-b border-violet-500/15">
        <p className="text-sm font-semibold text-slate-100">계산 결과</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          판매 {formatMesoKorean(saleCalc.grossMeso)} · 수수료 {saleCalc.feeRate}% · 판매 후{' '}
          {formatMesoKorean(saleCalc.afterSaleFee)}
        </p>
      </div>

      <div className="p-4 bg-dark-surface/40 space-y-3">
        <div className={`grid gap-3 ${saleCalc.members.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
          {saleCalc.members.map((member) => (
            <div
              key={member.label}
              className={`rounded-xl border p-4 ${
                member.isLeader
                  ? 'border-maple-500/30 bg-maple-500/5'
                  : 'border-cyber-500/20 bg-cyber-500/5'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    member.isLeader
                      ? 'bg-maple-500/10 text-maple-300 border-maple-500/20'
                      : 'bg-cyber-500/10 text-cyber-300 border-cyber-500/20'
                  }`}
                >
                  {member.label}
                </span>
                <span className="text-[10px] text-slate-500">{member.ratioPercent.toFixed(1)}%</span>
              </div>
              <p className="text-2xl font-bold text-slate-100 tracking-tight">
                {formatDropSaleAmount(member.actualReceive)}
              </p>
              <p className="text-[10px] text-slate-600 mt-1">
                {formatDropSaleAmountDetail(member.actualReceive)}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">{member.footerLabel}</p>
              {!member.isLeader && saleCalc.partySize > 1 && (
                <p className="text-[10px] text-slate-600 mt-1">
                  전달 {formatDropSaleAmount(member.deliveryAmount)}
                </p>
              )}
            </div>
          ))}
        </div>

        <p className="text-[10px] text-slate-600 leading-relaxed">
          판매 수수료와 분배 수수료를 모두 반영한 최종 실수령입니다. 가계부에는 파티장 몫{' '}
          <span className="text-maple-400">{formatMesoKorean(saleCalc.myIncome)}</span>만 기록돼요.
        </p>
      </div>
    </div>
  )
}

export { buildDropSaleMemo, calcDropSale, type DropSaleCalcResult }
