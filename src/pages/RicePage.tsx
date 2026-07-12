import { useMemo, useState } from 'react'
import type { RiceRecord } from '../types'
import type { RiceAccessGrant } from '../lib/riceAccessApi'
import RiceAccessAdmin from '../components/rice/RiceAccessAdmin'
import RiceRateTrend from '../components/rice/RiceRateTrend'
import {
  buildRiceRateHistory,
  calcRiceTradeAmount,
  formatRiceRateDelta,
  formatWonPerEok,
  parseWonPerEokInput,
} from '../lib/riceTrade'
import { formatMesoKorean, formatWon, getToday, parseMesoInput } from '../utils'

interface RicePageProps {
  records: RiceRecord[]
  heldMeso: number
  onAdd: (data: {
    mesoSold: number
    wonPerEok: number
    memo?: string
    recordDate: string
  }) => Promise<void>
  onRemove: (id: string) => Promise<void>
  isOwner: boolean
  grants: RiceAccessGrant[]
  onGrantAccess: (email: string) => Promise<void>
  onRevokeAccess: (userId: string) => Promise<void>
}

function formatRiceRecordTitle(record: RiceRecord): string {
  if (record.mesoSold != null && record.wonPerEok != null) {
    return `${formatMesoKorean(record.mesoSold)} · ${formatWonPerEok(record.wonPerEok)}`
  }
  return record.description
}

export default function RicePage({
  records,
  heldMeso,
  onAdd,
  onRemove,
  isOwner,
  grants,
  onGrantAccess,
  onRevokeAccess,
}: RicePageProps) {
  const [mesoInput, setMesoInput] = useState('')
  const [rateInput, setRateInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const total = useMemo(() => records.reduce((sum, r) => sum + r.amount, 0), [records])
  const previewMeso = useMemo(() => parseMesoInput(mesoInput), [mesoInput])
  const previewRate = useMemo(() => parseWonPerEokInput(rateInput), [rateInput])
  const previewAmount = useMemo(
    () => calcRiceTradeAmount(previewMeso, previewRate),
    [previewMeso, previewRate]
  )
  const lastRate = useMemo(() => {
    const history = buildRiceRateHistory(records)
    return history.length > 0 ? history[history.length - 1].wonPerEok : null
  }, [records])
  const previewRateDelta = useMemo(() => {
    if (previewRate <= 0 || lastRate == null) return null
    return previewRate - lastRate
  }, [previewRate, lastRate])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const mesoSold = parseMesoInput(mesoInput)
    const wonPerEok = parseWonPerEokInput(rateInput)
    if (mesoSold <= 0 || wonPerEok <= 0) return

    setSubmitting(true)
    try {
      await onAdd({
        mesoSold,
        wonPerEok,
        memo: String(fd.get('memo') ?? '').trim() || undefined,
        recordDate: String(fd.get('recordDate') ?? getToday()),
      })
      setMesoInput('')
      setRateInput('')
      form.reset()
      const dateInput = form.querySelector<HTMLInputElement>('input[name="recordDate"]')
      if (dateInput) dateInput.value = getToday()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <span>🍚</span> 쌀곳간
        </h1>
        <p className="text-sm text-slate-500 mt-1">보유 메소와 쌀먹 수익을 기록해요</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="panel-glow p-5">
          <p className="text-sm text-slate-400">보유 메소</p>
          <p className={`text-2xl font-bold mt-1 ${heldMeso >= 0 ? 'text-maple-400' : 'text-red-400'}`}>
            {formatMesoKorean(heldMeso)}
          </p>
          <p className="text-xs text-slate-500 mt-1">순수익 − 쌀 판매 메소</p>
        </div>
        <div className="panel-glow p-5">
          <p className="text-sm text-slate-400">누적 쌀먹</p>
          <p className="text-2xl font-bold text-amber-300 mt-1">{formatWon(total)}</p>
          <p className="text-xs text-slate-500 mt-1">{records.length}건</p>
        </div>
      </div>

      <RiceRateTrend records={records} />

      <form onSubmit={handleSubmit} className="panel-light p-4 space-y-3">
        <h2 className="font-semibold text-slate-100">쌀먹 기록</h2>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">판 메소 (억 단위)</label>
          <input
            value={mesoInput}
            onChange={(e) => setMesoInput(e.target.value)}
            required
            placeholder="예: 1, 3, 1.5억"
            className="input-field text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">1억당 단가 (원)</label>
          <input
            value={rateInput}
            onChange={(e) => setRateInput(e.target.value)}
            required
            placeholder="예: 1750"
            className="input-field text-sm"
          />
          {lastRate != null && (
            <p className="text-[10px] text-slate-600 mt-1">
              직전 단가 {formatWonPerEok(lastRate)}
              {previewRateDelta != null && previewRate > 0 && (
                <span
                  className={
                    previewRateDelta > 0
                      ? 'text-emerald-400'
                      : previewRateDelta < 0
                        ? 'text-red-400'
                        : 'text-slate-500'
                  }
                >
                  {' '}
                  · 입력 시 {formatRiceRateDelta(previewRateDelta)}
                </span>
              )}
            </p>
          )}
        </div>
        {previewAmount > 0 && (
          <p className="text-sm text-amber-300/90">
            예상 수익 {formatWon(previewAmount)}
            {previewMeso > 0 && previewRate > 0 && (
              <span className="text-slate-500 text-xs ml-2">
                ({formatMesoKorean(previewMeso)} × {formatWonPerEok(previewRate)})
              </span>
            )}
          </p>
        )}
        <div>
          <label className="text-xs text-slate-500 mb-1 block">날짜</label>
          <input name="recordDate" type="date" defaultValue={getToday()} className="input-field text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">메모 (선택)</label>
          <input name="memo" placeholder="메모" className="input-field text-sm" />
        </div>
        <button
          type="submit"
          disabled={submitting || previewAmount <= 0}
          className="btn-primary text-sm w-full py-2 disabled:opacity-50"
        >
          {submitting ? '저장 중...' : '쌀먹 기록 추가'}
        </button>
      </form>

      <div className="panel-light p-5">
        <h2 className="font-semibold text-slate-100 mb-4">기록</h2>
        {records.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">아직 쌀먹 기록이 없어요</p>
        ) : (
          <div className="record-list-scroll">
            {records.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-dark-surface/50 border border-dark-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {formatRiceRecordTitle(r)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {r.recordDate}
                    {r.memo ? ` · ${r.memo}` : ''}
                  </p>
                </div>
                <span className="text-sm font-semibold text-amber-300 shrink-0">
                  +{formatWon(r.amount)}
                </span>
                <button
                  onClick={() => onRemove(r.id)}
                  className="text-slate-600 hover:text-red-400 text-xs shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isOwner && (
        <RiceAccessAdmin
          grants={grants}
          onGrant={onGrantAccess}
          onRevoke={onRevokeAccess}
        />
      )}
    </div>
  )
}
