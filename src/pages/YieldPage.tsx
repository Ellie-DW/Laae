import { useEffect, useMemo, useState } from 'react'
import type { YieldDailyRecord, YieldDailyRecordInput, YieldSettings } from '../types'
import type { YieldAccessGrant } from '../lib/yieldAccessApi'
import YieldAccessAdmin from '../components/yield/YieldAccessAdmin'
import YieldDailyTable from '../components/yield/YieldDailyTable'
import YieldPortfolioChart from '../components/yield/YieldPortfolioChart'
import YieldResetButton from '../components/yield/YieldResetButton'
import YieldSummarySection from '../components/yield/YieldSummarySection'
import {
  YieldExchangeCard,
  YieldPageHeader,
  YieldPanel,
  YieldPreviewItem,
  YieldPreviewStrip,
  YieldSectionHeader,
} from '../components/yield/YieldUi'
import {
  buildDailyRows,
  buildMonthSummaries,
  calcTotalSeedKrw,
  calcTotalSeedUsd,
  calcDepositKrw,
  calcDepositUsd,
  calcWithdrawalKrw,
  calcWithdrawalUsd,
  formatYieldProfit,
  formatYieldProfitUsd,
  formatYieldRate,
  getLatestDailyRow,
  parseOptionalWonInput,
  parseUsdInput,
  resolveInitialPrincipalUsd,
  sortRecordsAsc,
  suggestNextDayStarts,
  summarizeOverall,
} from '../lib/yieldCalc'
import { formatWon, getToday, parseWonInput } from '../utils'

interface YieldPageProps {
  records: YieldDailyRecord[]
  settings: YieldSettings | null
  onSaveRecord: (data: YieldDailyRecordInput) => Promise<void>
  onSaveSettings: (data: {
    initialPrincipal: number
    initialPrincipalUsd?: number | null
    startDate?: string
    memo?: string
  }) => Promise<void>
  onRemoveRecord: (id: string) => Promise<void>
  onResetAll: () => Promise<void>
  isOwner: boolean
  grants: YieldAccessGrant[]
  onGrantAccess: (email: string) => Promise<void>
  onRevokeAccess: (userId: string) => Promise<void>
}

function ExchangeField({
  label,
  badge,
  variant,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
}: {
  label: string
  badge: string
  variant: 'upbit' | 'binance'
  startValue: string
  endValue: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
}) {
  return (
    <YieldExchangeCard label={label} badge={badge} variant={variant}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="yield-field-label-sm">시작 잔고</label>
          <input
            value={startValue}
            onChange={(e) => onStartChange(e.target.value)}
            placeholder="0"
            className="input-field text-sm py-2.5"
          />
        </div>
        <div>
          <label className="yield-field-label-sm">마감 잔고</label>
          <input
            value={endValue}
            onChange={(e) => onEndChange(e.target.value)}
            placeholder="0"
            className="input-field text-sm py-2.5"
          />
        </div>
      </div>
    </YieldExchangeCard>
  )
}

export default function YieldPage({
  records,
  settings,
  onSaveRecord,
  onSaveSettings,
  onRemoveRecord,
  onResetAll,
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
  const [principalUsdInput, setPrincipalUsdInput] = useState('')
  const [settingsStartDate, setSettingsStartDate] = useState(getToday())
  const [settingsMemo, setSettingsMemo] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

  const initialPrincipal = settings?.initialPrincipal ?? null
  const initialPrincipalUsd = settings?.initialPrincipalUsd ?? null
  const rows = useMemo(
    () => buildDailyRows(records, initialPrincipal, initialPrincipalUsd),
    [records, initialPrincipal, initialPrincipalUsd]
  )
  const monthSummaries = useMemo(
    () => buildMonthSummaries(rows, initialPrincipal, initialPrincipalUsd),
    [rows, initialPrincipal, initialPrincipalUsd]
  )
  const latestRow = useMemo(() => getLatestDailyRow(rows), [rows])
  const overallSummary = useMemo(
    () => summarizeOverall(rows, initialPrincipal, initialPrincipalUsd),
    [rows, initialPrincipal, initialPrincipalUsd]
  )
  const previousRecord = useMemo(() => {
    const ordered = sortRecordsAsc(records)
    return ordered.length > 0 ? ordered[ordered.length - 1] : null
  }, [records])

  useEffect(() => {
    if (!settings) {
      setPrincipalInput('')
      setPrincipalUsdInput('')
      setSettingsStartDate(getToday())
      setSettingsMemo('')
      return
    }
    setPrincipalInput(String(settings.initialPrincipal))
    setPrincipalUsdInput(
      settings.initialPrincipalUsd != null ? String(settings.initialPrincipalUsd) : ''
    )
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
    const baselineUsd = previous
      ? calcTotalSeedUsd(previous)
      : isFirstRecord
        ? resolveInitialPrincipalUsd(
            initialPrincipal,
            initialPrincipalUsd,
            ordered[0] ?? null
          )
        : null

    const recordDraft = {
      upbitEnd: parseOptionalWonInput(upbitEnd),
      binanceEnd: parseUsdInput(binanceEnd),
      usdKrwRate: rate,
      withdrawalUpbit: parseOptionalWonInput(withdrawalUpbit),
      withdrawalBinance: parseUsdInput(withdrawalBinance),
      depositUpbit: parseOptionalWonInput(depositUpbit),
      depositBinance: parseUsdInput(depositBinance),
    }
    const totalSeed = calcTotalSeedKrw(recordDraft)
    const totalSeedUsd = calcTotalSeedUsd(recordDraft)
    const withdrawalKrw = calcWithdrawalKrw(recordDraft)
    const withdrawalUsd = calcWithdrawalUsd(recordDraft)
    const depositKrw = calcDepositKrw(recordDraft)
    const depositUsd = calcDepositUsd(recordDraft)
    const profit =
      baseline != null ? totalSeed - baseline + withdrawalKrw - depositKrw : null
    const profitUsd =
      baselineUsd != null ? totalSeedUsd - baselineUsd + withdrawalUsd - depositUsd : null
    const yieldRate =
      baseline != null && baseline > 0 && profit != null ? (profit / baseline) * 100 : null
    const yieldRateUsd =
      baselineUsd != null && baselineUsd > 0 && profitUsd != null
        ? (profitUsd / baselineUsd) * 100
        : null

    return { totalSeed, withdrawalKrw, depositKrw, profit, profitUsd, yieldRate, yieldRateUsd }
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
    initialPrincipalUsd,
  ])

  const applySuggestedStarts = () => {
    const suggested = suggestNextDayStarts(previousRecord)
    if (suggested.usdKrwRate) setUsdKrwRate(String(suggested.usdKrwRate))
    if (suggested.upbitStart != null) setUpbitStart(String(suggested.upbitStart))
    if (suggested.binanceStart != null) setBinanceStart(String(suggested.binanceStart))
  }

  const resetRecordForm = () => {
    setRecordDate(getToday())
    setUsdKrwRate('')
    setUpbitStart('')
    setUpbitEnd('')
    setBinanceStart('')
    setBinanceEnd('')
    setWithdrawalUpbit('')
    setWithdrawalBinance('')
    setDepositUpbit('')
    setDepositBinance('')
    setMemo('')
  }

  const handleResetAll = async () => {
    await onResetAll()
    resetRecordForm()
  }

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const initialPrincipal = parseWonInput(principalInput)
    if (initialPrincipal <= 0) return
    const parsedUsd = parseUsdInput(principalUsdInput)

    setSavingSettings(true)
    try {
      await onSaveSettings({
        initialPrincipal,
        initialPrincipalUsd: parsedUsd,
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
    <div className="yield-page">
      <YieldPageHeader recordCount={rows.length} />

      <YieldSummarySection
        settings={settings}
        latestRow={latestRow}
        recordCount={rows.length}
        overallSummary={
          overallSummary ?? {
            basePrincipal: null,
            totalProfit: null,
            totalProfitUsd: null,
            totalYieldRate: null,
            totalYieldRateUsd: null,
          }
        }
      />

      {rows.length > 0 && (
        <div className="space-y-3">
          <YieldSectionHeader title="자산 추이" variant="usd" />
          <YieldPortfolioChart
            rows={rows}
            initialPrincipal={settings?.initialPrincipal ?? null}
            initialPrincipalUsd={settings?.initialPrincipalUsd ?? null}
            investmentStartDate={settings?.startDate ?? null}
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <form onSubmit={handleSaveSettings} className="xl:col-span-2">
          <YieldPanel
            title="시작 원금"
            description="원화는 필수, 달러는 선택 (미입력 시 첫 기록 환율로 환산)"
            accent="violet"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="yield-field-label">원금 (₩)</label>
                  <input
                    value={principalInput}
                    onChange={(e) => setPrincipalInput(e.target.value)}
                    required
                    placeholder="예: 2000000"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="yield-field-label">원금 ($, 선택)</label>
                  <input
                    value={principalUsdInput}
                    onChange={(e) => setPrincipalUsdInput(e.target.value)}
                    placeholder="예: 1500.00"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="yield-field-label">투자 시작일</label>
                  <input
                    type="date"
                    value={settingsStartDate}
                    onChange={(e) => setSettingsStartDate(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="yield-field-label">메모 (선택)</label>
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
                className="btn-secondary text-sm w-full px-6 py-2.5 disabled:opacity-50"
              >
                {savingSettings ? '저장 중...' : settings ? '원금 수정' : '원금 저장'}
              </button>
            </div>
          </YieldPanel>
        </form>

        <form onSubmit={handleSubmit} className="xl:col-span-3 space-y-0">
          <YieldPanel
            title="일별 기록 추가"
            description="날짜·환율·거래소 잔고를 입력하세요"
            accent="krw"
            action={
              previousRecord ? (
                <button type="button" onClick={applySuggestedStarts} className="yield-action-btn">
                  전일 마감 → 시작 불러오기
                </button>
              ) : undefined
            }
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="yield-field-label">날짜</label>
                  <input
                    type="date"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="yield-field-label">당일 환율 (USD/KRW)</label>
                  <input
                    value={usdKrwRate}
                    onChange={(e) => setUsdKrwRate(e.target.value)}
                    required
                    placeholder="예: 1399"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="yield-field-label">메모 (선택)</label>
                  <input
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="메모"
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ExchangeField
                  label="업비트"
                  badge="KRW"
                  variant="upbit"
                  startValue={upbitStart}
                  endValue={upbitEnd}
                  onStartChange={setUpbitStart}
                  onEndChange={setUpbitEnd}
                />
                <ExchangeField
                  label="바이낸스"
                  badge="USD"
                  variant="binance"
                  startValue={binanceStart}
                  endValue={binanceEnd}
                  onStartChange={setBinanceStart}
                  onEndChange={setBinanceEnd}
                />
              </div>

              <div className="yield-flow-section">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'rgb(var(--theme-text-secondary))' }}>
                    당일 입출금
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--theme-text-faint))' }}>
                    선택 · 입금·출금을 구분해 수익을 계산합니다
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="yield-flow-box yield-flow-box--deposit">
                    <p className="text-[11px] font-semibold yield-flow-label--deposit">입금</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="yield-field-label-sm">업비트 (₩)</label>
                        <input
                          value={depositUpbit}
                          onChange={(e) => setDepositUpbit(e.target.value)}
                          placeholder="0"
                          className="input-field text-xs py-2"
                        />
                      </div>
                      <div>
                        <label className="yield-field-label-sm">바이낸스 ($)</label>
                        <input
                          value={depositBinance}
                          onChange={(e) => setDepositBinance(e.target.value)}
                          placeholder="0"
                          className="input-field text-xs py-2"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="yield-flow-box yield-flow-box--withdraw">
                    <p className="text-[11px] font-semibold yield-flow-label--withdraw">출금</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="yield-field-label-sm">업비트 (₩)</label>
                        <input
                          value={withdrawalUpbit}
                          onChange={(e) => setWithdrawalUpbit(e.target.value)}
                          placeholder="0"
                          className="input-field text-xs py-2"
                        />
                      </div>
                      <div>
                        <label className="yield-field-label-sm">바이낸스 ($)</label>
                        <input
                          value={withdrawalBinance}
                          onChange={(e) => setWithdrawalBinance(e.target.value)}
                          placeholder="0"
                          className="input-field text-xs py-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {preview && (
                <YieldPreviewStrip>
                  <YieldPreviewItem label="총 시드" value={formatWon(preview.totalSeed)} />
                  {preview.depositKrw > 0 && (
                    <YieldPreviewItem label="입금" value={formatWon(preview.depositKrw)} tone="deposit" />
                  )}
                  {preview.withdrawalKrw > 0 && (
                    <YieldPreviewItem label="출금" value={formatWon(preview.withdrawalKrw)} tone="withdraw" />
                  )}
                  {preview.profit != null && (
                    <YieldPreviewItem
                      label="원화 수익금"
                      value={formatYieldProfit(preview.profit)}
                      tone={preview.profit >= 0 ? 'positive' : 'negative'}
                    />
                  )}
                  {preview.profitUsd != null && (
                    <YieldPreviewItem
                      label="달러 수익금"
                      value={formatYieldProfitUsd(preview.profitUsd)}
                      tone={preview.profitUsd >= 0 ? 'positive' : 'negative'}
                    />
                  )}
                  {preview.yieldRate != null && (
                    <YieldPreviewItem
                      label="원화 수익률"
                      value={formatYieldRate(preview.yieldRate)}
                      tone={preview.yieldRate >= 0 ? 'positive' : 'negative'}
                    />
                  )}
                  {preview.yieldRateUsd != null && (
                    <YieldPreviewItem
                      label="달러 수익률"
                      value={formatYieldRate(preview.yieldRateUsd)}
                      tone={preview.yieldRateUsd >= 0 ? 'positive' : 'negative'}
                    />
                  )}
                </YieldPreviewStrip>
              )}

              <button
                type="submit"
                disabled={submitting || !usdKrwRate.trim()}
                className="btn-primary text-sm w-full py-2.5 disabled:opacity-50"
              >
                {submitting ? '저장 중...' : '기록 저장'}
              </button>
            </div>
          </YieldPanel>
        </form>
      </div>

      <YieldDailyTable rows={rows} monthSummaries={monthSummaries} onRemove={onRemoveRecord} />

      {(records.length > 0 || settings) && (
        <YieldPanel
          title="데이터 초기화"
          description="일별 기록과 시작 원금 설정을 모두 삭제합니다"
          accent="neutral"
        >
          <YieldResetButton onReset={handleResetAll} />
        </YieldPanel>
      )}

      {isOwner && (
        <YieldAccessAdmin grants={grants} onGrant={onGrantAccess} onRevoke={onRevokeAccess} />
      )}
    </div>
  )
}
