import { useMemo, useState } from 'react'
import type { Character, IncomeCategory } from '../../types'
import { INCOME_CATEGORY_LABEL } from '../../lib/ledgerApi'
import { calcDropSale, type DropSaleFeeRate } from '../../lib/dropSale'
import { formatMesoKorean, getToday, parseMesoInput } from '../../utils'

const FEE_OPTIONS: DropSaleFeeRate[] = [5, 3]

type IncomeInputMode = 'direct' | 'fee'

interface IncomeRecordSectionProps {
  characters: Character[]
  characterId: string
  showCharacterSelect: boolean
  onCharacterChange: (id: string) => void
  onSubmit: (data: {
    characterId: string
    category: IncomeCategory
    amount: number
    memo?: string
    recordDate: string
  }) => Promise<void>
}

export default function IncomeRecordSection({
  characters,
  characterId,
  showCharacterSelect,
  onCharacterChange,
  onSubmit,
}: IncomeRecordSectionProps) {
  const [mode, setMode] = useState<IncomeInputMode>('fee')
  const [category, setCategory] = useState<IncomeCategory>('trade')
  const [recordDate, setRecordDate] = useState(getToday())
  const [memo, setMemo] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [grossMesoInput, setGrossMesoInput] = useState('')
  const [feeRate, setFeeRate] = useState<DropSaleFeeRate>(5)
  const [submitting, setSubmitting] = useState(false)

  const directAmount = useMemo(() => parseMesoInput(amountInput), [amountInput])
  const grossMeso = useMemo(() => parseMesoInput(grossMesoInput), [grossMesoInput])
  const saleCalc = useMemo(
    () => calcDropSale({ grossMeso, feeRate, partySize: 1 }),
    [grossMeso, feeRate]
  )

  const resetForm = () => {
    setAmountInput('')
    setGrossMesoInput('')
    setMemo('')
    setRecordDate(getToday())
  }

  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!characterId || directAmount <= 0) return
    setSubmitting(true)
    try {
      await onSubmit({
        characterId,
        category,
        amount: directAmount,
        memo: memo.trim() || undefined,
        recordDate,
      })
      resetForm()
    } finally {
      setSubmitting(false)
    }
  }

  const handleFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!characterId || !saleCalc || saleCalc.myIncome <= 0) return
    setSubmitting(true)
    try {
      const combinedMemo = [
        `판매 ${formatMesoKorean(saleCalc.grossMeso)}`,
        `수수료 ${saleCalc.feeRate}%`,
        memo.trim(),
      ]
        .filter(Boolean)
        .join(' · ')

      await onSubmit({
        characterId,
        category,
        amount: saleCalc.myIncome,
        memo: combinedMemo,
        recordDate,
      })
      resetForm()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="panel-light p-4 space-y-4">
      <div>
        <h2 className="font-semibold text-slate-100">수입 기록</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {mode === 'fee'
            ? '판매 수수료를 반영한 실수령 금액을 기록합니다.'
            : '실수령 금액을 직접 입력합니다.'}
        </p>
      </div>

      <div className="flex gap-2">
        <ModeButton active={mode === 'fee'} onClick={() => setMode('fee')}>
          수수료 계산
        </ModeButton>
        <ModeButton active={mode === 'direct'} onClick={() => setMode('direct')}>
          직접 입력
        </ModeButton>
      </div>

      {showCharacterSelect && (
        <div>
          <label className="text-xs text-slate-500 mb-1 block">캐릭터</label>
          <select
            value={characterId}
            onChange={(e) => onCharacterChange(e.target.value)}
            className="input-field text-sm"
          >
            {characters.map((char) => (
              <option key={char.id} value={char.id}>{char.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="text-xs text-slate-500 mb-1 block">카테고리</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as IncomeCategory)}
          className="input-field text-sm"
        >
          {(Object.keys(INCOME_CATEGORY_LABEL) as IncomeCategory[]).map((key) => (
            <option key={key} value={key}>{INCOME_CATEGORY_LABEL[key]}</option>
          ))}
        </select>
      </div>

      {mode === 'direct' ? (
        <form onSubmit={handleDirectSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">수입 금액 (억 단위)</label>
            <input
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              required
              placeholder="예: 1, 0.5, 1.5억"
              className="input-field text-sm"
            />
          </div>
          <DateMemoFields
            recordDate={recordDate}
            memo={memo}
            onRecordDateChange={setRecordDate}
            onMemoChange={setMemo}
          />
          <button
            type="submit"
            disabled={submitting || !characterId || directAmount <= 0}
            className="btn-primary text-sm w-full py-2 disabled:opacity-40"
          >
            {submitting ? '추가 중...' : '수입 추가'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleFeeSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">총 판매가 (억 단위)</label>
            <input
              value={grossMesoInput}
              onChange={(e) => setGrossMesoInput(e.target.value)}
              required
              placeholder="예: 10, 5.5억"
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
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <p className="text-[11px] text-slate-500">
                판매 {formatMesoKorean(saleCalc.grossMeso)} · 수수료 {saleCalc.feeRate}% · 실수령{' '}
                <span className="text-emerald-300 font-semibold">
                  {formatMesoKorean(saleCalc.myIncome)}
                </span>
              </p>
            </div>
          )}

          <DateMemoFields
            recordDate={recordDate}
            memo={memo}
            onRecordDateChange={setRecordDate}
            onMemoChange={setMemo}
            memoPlaceholder="추가 메모 (선택)"
          />

          <button
            type="submit"
            disabled={submitting || !characterId || !saleCalc || saleCalc.myIncome <= 0}
            className="btn-primary text-sm w-full py-2 disabled:opacity-40"
          >
            {submitting
              ? '추가 중...'
              : saleCalc && saleCalc.myIncome > 0
                ? `${formatMesoKorean(saleCalc.myIncome)} 수입 추가`
                : '수입 추가'}
          </button>
        </form>
      )}
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
        active
          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
          : 'border-dark-border text-slate-500 hover:text-slate-300'
      }`}
    >
      {children}
    </button>
  )
}

function DateMemoFields({
  recordDate,
  memo,
  onRecordDateChange,
  onMemoChange,
  memoPlaceholder = '메모',
}: {
  recordDate: string
  memo: string
  onRecordDateChange: (value: string) => void
  onMemoChange: (value: string) => void
  memoPlaceholder?: string
}) {
  return (
    <>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">날짜</label>
        <input
          type="date"
          value={recordDate}
          onChange={(e) => onRecordDateChange(e.target.value)}
          className="input-field text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">메모 (선택)</label>
        <input
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder={memoPlaceholder}
          className="input-field text-sm"
        />
      </div>
    </>
  )
}
