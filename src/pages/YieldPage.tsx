import { useEffect, useMemo, useState } from 'react'
import type { YieldDailyRecord, YieldDailyRecordInput, YieldSettings } from '../types'
import type { YieldAccessGrant } from '../lib/yieldAccessApi'
import YieldAccessAdmin from '../components/yield/YieldAccessAdmin'
import YieldDailyTable from '../components/yield/YieldDailyTable'
import YieldPortfolioChart from '../components/yield/YieldPortfolioChart'
import YieldIcon from '../components/yield/YieldIcon'
import {
  buildDailyRows,
  buildMonthSummaries,
  calcTotalSeedKrw,
  calcDepositKrw,
  calcWithdrawalKrw,
  formatYieldProfit,
  formatYieldRate,
  getLatestDailyRow,
  parseOptionalWonInput,
  parseUsdInput,
  sortRecordsAsc,
  suggestNextDayStarts,
  summarizeOverall,
} from '../lib/yieldCalc'
import { formatWon, getToday, parseWonInput } from '../utils'

interface YieldPageProps {
  records: YieldDailyRecord[]
  settings: YieldSettings | null
  onSaveRecord: (data: YieldDailyRecordInput) => Promise<void>
  onSaveSettings: (data: { initialPrincipal: number; startDate?: string; memo?: string }) => Promise<void>
  onRemoveRecord: (id: string) => Promise<void>
  isOwner: boolean
  grants: YieldAccessGrant[]
  onGrantAccess: (email: string) => Promise<void>
  onRevokeAccess: (userId: string) => Promise<void>
}

function ExchangeField({
  label,
  currency,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
}: {
  label: string
  currency: 'krw' | 'usd'
  startValue: string
  endValue: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
}) {
  const placeholder = currency === 'krw' ? '원' : '$'
  return (
    <div className="rounded-lg border border-dark-border bg-dark-surface/40 p-3 space-y-2">
      <p className="text-xs font-semibold text-slate-300">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-slate-500 mb-1 block">시작</label>
          <input
            value={startValue}
            onChange={(e) => onStartChange(e.target.value)}
            placeholder={placeholder}
            className="input-field text-xs py-2"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 mb-1 block">마감</label>
          <input
            value={endValue}
            onChange={(e) => onEndChange(e.target.value)}
            placeholder={placeholder}
            className="input-field text-xs py-2"
          />
        </div>
      </div>
    </div>
  )
}

export default function YieldPage({
  records,
  settings,
  onSaveRecord,
  onSaveSettings,
  onRemoveRecord,
  isOwner,
  grants,
  onGrantAccess,
  onRevokeAccess,
}: YieldPageProps) {
  const [recordDate, setRecordDate] = useState(getToday())
  const [usdKrwRate, setUsdKrwRate] = useState('')
  const [upbitStart, setUpbitStart] = useState('')
  const [upbitEnd, setUpbitEnd] = useState('')
  const [binanceStart, setBinanceStart] = useState('')
  const [binanceEnd, setBinanceEnd] = useState('')
  const [withdrawalUpbit, setWithdrawalUpbit] = useState('')
  const [withdrawalBinance, setWithdrawalBinance] = useState('')
  const [depositUpbit, setDepositUpbit] = useState('')
  const [depositBinance, setDepositBinance] = useState('')
  const [memo, setMemo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [principalInput, setPrincipalInput] = useState('')
  const [settingsStartDate, setSettingsStartDate] = useState(getToday())
  const [settingsMemo, setSettingsMemo] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

  const initialPrincipal = settings?.initialPrincipal ?? null
  const rows = useMemo(() => buildDailyRows(records, initialPrincipal), [records, initialPrincipal])
  const monthSummaries = useMemo(
    () => buildMonthSummaries(rows, initialPrincipal),
    [rows, initialPrincipal]
  )
  const latestRow = useMemo(() => getLatestDailyRow(rows), [rows])
  const overallSummary = useMemo(
    () => summarizeOverall(rows, settings?.initialPrincipal ?? null),
    [rows, settings?.initialPrincipal]
  )
  const previousRecord = useMemo(() => {
    const ordered = sortRecordsAsc(records)
    return ordered.length > 0 ? ordered[ordered.length - 1] : null
  }, [records])

  useEffect(() => {
    if (!settings) return
    setPrincipalInput(String(settings.initialPrincipal))
    setSettingsStartDate(settings.startDate ?? getToday())
    setSettingsMemo(settings.memo ?? '')
  }, [settings])

  const preview = useMemo(() => {
    const rate = parseInt(usdKrwRate.replace(/[^\d]/g, ''), 10) || 0
    if (rate <= 0) return null

    const ordered = sortRecordsAsc(records)
    const previous = ordered.filter((record) => record.recordDate < recordDate).slice(-1)[0] ?? null
    const isFirstRecord = ordered.length === 0 || !previous
    const baseline = previous
      ? calcTotalSeedKrw(previous)
      : isFirstRecord && initialPrincipal != null && initialPrincipal > 0
        ? initialPrincipal
        : null

    const totalSeed = calcTotalSeedKrw({
      upbitEnd: parseOptionalWonInput(upbitEnd),
      binanceEnd: parseUsdInput(binanceEnd),
      usdKrwRate: rate,
    })
    const withdrawalKrw = calcWithdrawalKrw({
      withdrawalUpbit: parseOptionalWonInput(withdrawalUpbit),
      withdrawalBinance: parseUsdInput(withdrawalBinance),
      usdKrwRate: rate,
    })
    const depositKrw = calcDepositKrw({
      depositUpbit: parseOptionalWonInput(depositUpbit),
      depositBinance: parseUsdInput(depositBinance),
      usdKrwRate: rate,
    })
    const profit =
      baseline != null ? totalSeed - baseline + withdrawalKrw - depositKrw : null
    const yieldRate =
      baseline != null && baseline > 0 && profit != null ? (profit / baseline) * 100 : null

    return { totalSeed, withdrawalKrw, depositKrw, profit, yieldRate }
  }, [
    usdKrwRate,
    recordDate,
    upbitEnd,
    binanceEnd,
    withdrawalUpbit,
    withdrawalBinance,
    depositUpbit,
    depositBinance,
    records,
    initialPrincipal,
  ])

  const applySuggestedStarts = () => {
    const suggested = suggestNextDayStarts(previousRecord)
    if (suggested.usdKrwRate) setUsdKrwRate(String(suggested.usdKrwRate))
    if (suggested.upbitStart != null) setUpbitStart(String(suggested.upbitStart))
    if (suggested.binanceStart != null) setBinanceStart(String(suggested.binanceStart))
  }

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const initialPrincipal = parseWonInput(principalInput)
    if (initialPrincipal <= 0) return

    setSavingSettings(true)
    try {
      await onSaveSettings({
        initialPrincipal,
        startDate: settingsStartDate,
        memo: settingsMemo.trim() || undefined,
      })
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const rate = parseInt(usdKrwRate.replace(/[^\d]/g, ''), 10)
    if (rate <= 0) return

    setSubmitting(true)
    try {
      await onSaveRecord({
        recordDate,
        usdKrwRate: rate,
        upbitStart: parseOptionalWonInput(upbitStart),
        upbitEnd: parseOptionalWonInput(upbitEnd),
        binanceStart: parseUsdInput(binanceStart),
        binanceEnd: parseUsdInput(binanceEnd),
        withdrawalUpbit: parseOptionalWonInput(withdrawalUpbit),
        withdrawalBinance: parseUsdInput(withdrawalBinance),
        depositUpbit: parseOptionalWonInput(depositUpbit),
        depositBinance: parseUsdInput(depositBinance),
        memo: memo.trim() || undefined,
      })
      setUpbitEnd('')
      setBinanceEnd('')
      setWithdrawalUpbit('')
      setWithdrawalBinance('')
      setDepositUpbit('')
      setDepositBinance('')
      setMemo('')
      applySuggestedStarts()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <YieldIcon size="lg" />
          수익률 가계부
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          거래소별 시작·마감 잔고와 환율을 기록하면 총 시드·수익금·수익률이 자동 계산돼요
        </p>
      </div>

      {(settings || latestRow) && overallSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="panel-glow p-5">
            <p className="text-sm text-slate-400">시작 원금</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">
              {overallSummary.basePrincipal != null
                ? formatWon(overallSummary.basePrincipal)
                : '-'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {settings?.startDate ? `${settings.startDate} 시작` : '원금 기준'}
            </p>
          </div>
          <div className="panel-glow p-5">
            <p className="text-sm text-slate-400">현재 총 시드</p>
            <p className="text-2xl font-bold text-maple-400 mt-1">
              {latestRow ? formatWon(latestRow.totalSeed) : '-'}
            </p>
            <p className="text-xs text-slate-500 mt-1">{latestRow?.recordDate ?? '기록 없음'}</p>
          </div>
          <div className="panel-glow p-5">
            <p className="text-sm text-slate-400">총 수익금</p>
            <p
              className={`text-2xl font-bold mt-1 ${
                (overallSummary.totalProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {overallSummary.totalProfit == null ? '-' : formatYieldProfit(overallSummary.totalProfit)}
            </p>
            <p className="text-xs text-slate-500 mt-1">시작 원금 대비</p>
          </div>
          <div className="panel-glow p-5">
            <p className="text-sm text-slate-400">총 수익률</p>
            <p
              className={`text-2xl font-bold mt-1 ${
                (overallSummary.totalYieldRate ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {overallSummary.totalYieldRate == null
                ? '-'
                : formatYieldRate(overallSummary.totalYieldRate)}
            </p>
            <p className="text-xs text-slate-500 mt-1">시작 원금 대비</p>
          </div>
        </div>
      )}

      <YieldPortfolioChart
        rows={rows}
        initialPrincipal={settings?.initialPrincipal ?? null}
        investmentStartDate={settings?.startDate ?? null}
      />

      <form onSubmit={handleSaveSettings} className="panel-light p-4 space-y-3">
        <div>
          <h2 className="font-semibold text-slate-100">시작 원금</h2>
          <p className="text-xs text-slate-500 mt-1">처음 투자한 금액을 저장해 두면 총 수익금·수익률 계산 기준이 됩니다</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">원금 (원)</label>
            <input
              value={principalInput}
              onChange={(e) => setPrincipalInput(e.target.value)}
              required
              placeholder="예: 2000000"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">투자 시작일</label>
            <input
              type="date"
              value={settingsStartDate}
              onChange={(e) => setSettingsStartDate(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">메모 (선택)</label>
            <input
              value={settingsMemo}
              onChange={(e) => setSettingsMemo(e.target.value)}
              placeholder={settings?.memo ?? '메모'}
              className="input-field text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={savingSettings || parseWonInput(principalInput) <= 0}
          className="btn-secondary text-sm w-full sm:w-auto px-6 py-2 disabled:opacity-50"
        >
          {savingSettings ? '저장 중...' : settings ? '원금 수정' : '원금 저장'}
        </button>
      </form>

      <form onSubmit={handleSubmit} className="panel-light p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-100">일별 기록 추가</h2>
          {previousRecord && (
            <button
              type="button"
              onClick={applySuggestedStarts}
              className="text-xs text-cyber-300 hover:text-cyber-200"
            >
              전일 마감 → 오늘 시작 불러오기
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">날짜</label>
            <input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">당일 환율 (USD/KRW)</label>
            <input
              value={usdKrwRate}
              onChange={(e) => setUsdKrwRate(e.target.value)}
              required
              placeholder="예: 1399"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">메모 (선택)</label>
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모"
              className="input-field text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ExchangeField
            label="업비트 (₩)"
            currency="krw"
            startValue={upbitStart}
            endValue={upbitEnd}
            onStartChange={setUpbitStart}
            onEndChange={setUpbitEnd}
          />
          <ExchangeField
            label="바이낸스 ($)"
            currency="usd"
            startValue={binanceStart}
            endValue={binanceEnd}
            onStartChange={setBinanceStart}
            onEndChange={setBinanceEnd}
          />
        </div>

        <div className="rounded-lg border border-dark-border bg-dark-surface/40 p-3 space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-300">당일 입출금 (선택)</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              입금·출금 금액을 적어 두면 잔고 변동과 투자 수익을 구분해서 계산해요
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-sky-400/90">입금</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">업비트 (₩)</label>
                  <input
                    value={depositUpbit}
                    onChange={(e) => setDepositUpbit(e.target.value)}
                    placeholder="원"
                    className="input-field text-xs py-2"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">바이낸스 ($)</label>
                  <input
                    value={depositBinance}
                    onChange={(e) => setDepositBinance(e.target.value)}
                    placeholder="$"
                    className="input-field text-xs py-2"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-amber-400/90">출금</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">업비트 (₩)</label>
                  <input
                    value={withdrawalUpbit}
                    onChange={(e) => setWithdrawalUpbit(e.target.value)}
                    placeholder="원"
                    className="input-field text-xs py-2"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">바이낸스 ($)</label>
                  <input
                    value={withdrawalBinance}
                    onChange={(e) => setWithdrawalBinance(e.target.value)}
                    placeholder="$"
                    className="input-field text-xs py-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {preview && (
          <div className="rounded-lg bg-dark-bg/60 border border-dark-border px-4 py-3 text-sm flex flex-wrap gap-4">
            <span className="text-slate-400">
              총 시드 <strong className="text-slate-100 ml-1">{formatWon(preview.totalSeed)}</strong>
            </span>
            {preview.depositKrw > 0 && (
              <span className="text-slate-400">
                입금 <strong className="text-sky-300 ml-1">{formatWon(preview.depositKrw)}</strong>
              </span>
            )}
            {preview.withdrawalKrw > 0 && (
              <span className="text-slate-400">
                출금 <strong className="text-amber-300 ml-1">{formatWon(preview.withdrawalKrw)}</strong>
              </span>
            )}
            {preview.profit != null && (
              <span className="text-slate-400">
                수익금{' '}
                <strong className={preview.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {formatYieldProfit(preview.profit)}
                </strong>
              </span>
            )}
            {preview.yieldRate != null && (
              <span className="text-slate-400">
                수익률{' '}
                <strong className={preview.yieldRate >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {formatYieldRate(preview.yieldRate)}
                </strong>
              </span>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !usdKrwRate.trim()}
          className="btn-primary text-sm w-full py-2 disabled:opacity-50"
        >
          {submitting ? '저장 중...' : '기록 저장'}
        </button>
      </form>

      <YieldDailyTable rows={rows} monthSummaries={monthSummaries} onRemove={onRemoveRecord} />

      {isOwner && (
        <YieldAccessAdmin grants={grants} onGrant={onGrantAccess} onRevoke={onRevokeAccess} />
      )}
    </div>
  )
}
