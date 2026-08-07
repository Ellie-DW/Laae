import type { YieldDailyRow, YieldMonthSummary } from '../../lib/yieldCalc'
import {
  formatKrwCell,
  formatUsd,
  formatYieldProfit,
  formatYieldProfitUsd,
  formatYieldRate,
} from '../../lib/yieldCalc'
import { formatWon } from '../../utils'
import { YieldPanel } from './YieldUi'

interface YieldDailyTableProps {
  rows: YieldDailyRow[]
  monthSummaries: YieldMonthSummary[]
  onRemove: (id: string) => void
}

function EmptyCell() {
  return <span style={{ color: 'rgb(var(--theme-text-disabled))' }}>—</span>
}

function MetricBadge({
  value,
  kind,
}: {
  value: number | null
  kind: 'money_krw' | 'money_usd' | 'rate'
}) {
  if (value == null) return <EmptyCell />

  if (value === 0) {
    const zeroLabel =
      kind === 'money_usd'
        ? formatYieldProfitUsd(0)
        : kind === 'money_krw'
          ? formatYieldProfit(0)
          : formatYieldRate(0)
    return (
      <span className="tabular-nums text-[11px]" style={{ color: 'rgb(var(--theme-text-faint))' }}>
        {zeroLabel}
      </span>
    )
  }

  const label =
    kind === 'money_usd'
      ? formatYieldProfitUsd(value)
      : kind === 'money_krw'
        ? formatYieldProfit(value)
        : formatYieldRate(value)

  return (
    <span className={value > 0 ? 'yield-metric-badge--profit' : 'yield-metric-badge--loss'}>
      {label}
    </span>
  )
}

function GroupHeader({ label, currency, variant }: { label: string; currency: string; variant: 'upbit' | 'binance' }) {
  return (
    <div className={`flex flex-col items-center gap-0.5 rounded-md px-2 py-1 yield-table-group--${variant}`}>
      <span>{label}</span>
      <span className="text-[9px] font-normal opacity-70">{currency}</span>
    </div>
  )
}

export default function YieldDailyTable({ rows, monthSummaries, onRemove }: YieldDailyTableProps) {
  const summaryByMonth = new Map(monthSummaries.map((item) => [item.monthKey, item]))

  if (rows.length === 0) {
    return (
      <YieldPanel title="일별 기록" description="아직 등록된 기록이 없습니다" accent="neutral">
        <div className="py-12 text-center">
          <div className="yield-empty-icon">📊</div>
          <p className="text-sm" style={{ color: 'rgb(var(--theme-text-muted))' }}>
            첫 일별 기록을 추가해 보세요
          </p>
          <p className="text-xs mt-2" style={{ color: 'rgb(var(--theme-text-disabled))' }}>
            업비트·바이낸스 잔고와 환율을 입력하면 표가 채워집니다
          </p>
        </div>
      </YieldPanel>
    )
  }

  const thBase =
    'px-3 py-3 text-[11px] font-semibold whitespace-nowrap border-b tabular-nums'
  const thStyle = { color: 'rgb(var(--theme-text-muted))', backgroundColor: 'rgb(var(--theme-surface) / 0.92)', borderColor: 'rgb(var(--theme-border) / 0.7)' }
  const tdBase = 'px-3 py-2.5 text-xs whitespace-nowrap border-b tabular-nums'
  const tdStyle = { color: 'rgb(var(--theme-text-secondary))', borderColor: 'rgb(var(--theme-border) / 0.35)' }
  const tdNum = `${tdBase} text-right`
  const tdDate = `${tdBase} sticky left-0 z-10 font-medium shadow-[4px_0_16px_rgba(0,0,0,0.2)] border-r`

  return (
    <YieldPanel
      title="일별 기록"
      description={`날짜순 · ${rows.length}일 · 월별 합계 포함`}
      accent="neutral"
    >
      <div className="overflow-x-auto -mx-5 px-5 pb-1">
        <table className="min-w-[1200px] w-full border-collapse">
          <thead>
            <tr>
              <th className={`${thBase} sticky left-0 z-20 text-left`} style={thStyle} rowSpan={2}>
                날짜
              </th>
              <th className={`${thBase} text-center border-l`} style={thStyle} colSpan={2}>
                <GroupHeader label="업비트" currency="KRW" variant="upbit" />
              </th>
              <th className={`${thBase} text-center border-l`} style={thStyle} colSpan={2}>
                <GroupHeader label="바이낸스" currency="USD" variant="binance" />
              </th>
              <th className={`${thBase} text-right border-l`} style={thStyle} rowSpan={2}>
                총 시드
              </th>
              <th className={`${thBase} text-right border-l`} style={thStyle} rowSpan={2}>
                출금
              </th>
              <th className={`${thBase} text-right border-l`} style={thStyle} rowSpan={2}>
                입금
              </th>
              <th className={`${thBase} text-right border-l`} style={thStyle} rowSpan={2}>
                원화 수익금
              </th>
              <th className={`${thBase} text-right border-l`} style={thStyle} rowSpan={2}>
                달러 수익금
              </th>
              <th className={`${thBase} text-right border-l`} style={thStyle} rowSpan={2}>
                원화 수익률
              </th>
              <th className={`${thBase} text-right border-l`} style={thStyle} rowSpan={2}>
                달러 수익률
              </th>
              <th className={`${thBase} text-right border-l`} style={thStyle} rowSpan={2}>
                환율
              </th>
              <th className={`${thBase} w-10 border-l`} style={thStyle} rowSpan={2}></th>
            </tr>
            <tr>
              <th className={`${thBase} text-right text-[10px] font-normal`} style={thStyle}>
                시작
              </th>
              <th className={`${thBase} text-right text-[10px] font-normal`} style={thStyle}>
                마감
              </th>
              <th className={`${thBase} text-right text-[10px] font-normal border-l`} style={thStyle}>
                시작
              </th>
              <th className={`${thBase} text-right text-[10px] font-normal`} style={thStyle}>
                마감
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.flatMap((row, index) => {
              const monthKey = row.recordDate.slice(0, 7)
              const next = rows[index + 1]
              const isLastInMonth = !next || next.recordDate.slice(0, 7) !== monthKey
              const monthSummary = summaryByMonth.get(monthKey)
              const isEven = index % 2 === 0
              const rowBg = isEven ? 'rgb(var(--theme-bg) / 0.28)' : 'transparent'
              const stickyBg = 'rgb(var(--theme-panel) / 0.98)'

              const elements = [
                <tr
                  key={row.id}
                  className="group transition-colors yield-table-row"
                  style={{ backgroundColor: rowBg }}
                >
                  <td className={tdDate} style={{ ...tdStyle, backgroundColor: stickyBg, color: 'rgb(var(--theme-text))' }}>
                    {row.recordDate}
                  </td>
                  <td className={tdNum} style={tdStyle}>
                    {row.upbitStart == null ? <EmptyCell /> : formatKrwCell(row.upbitStart)}
                  </td>
                  <td className={tdNum} style={tdStyle}>
                    {row.upbitEnd == null ? <EmptyCell /> : formatKrwCell(row.upbitEnd)}
                  </td>
                  <td className={`${tdNum} border-l`} style={tdStyle}>
                    {row.binanceStart == null ? <EmptyCell /> : formatUsd(row.binanceStart)}
                  </td>
                  <td className={tdNum} style={tdStyle}>
                    {row.binanceEnd == null ? <EmptyCell /> : formatUsd(row.binanceEnd)}
                  </td>
                  <td className={`${tdNum} border-l font-semibold yield-table-seed`} style={tdStyle}>
                    {formatWon(row.totalSeed)}
                  </td>
                  <td className={`${tdNum} border-l`} style={tdStyle}>
                    {row.withdrawalKrw > 0 ? (
                      <span className="yield-table-withdraw tabular-nums">{formatWon(row.withdrawalKrw)}</span>
                    ) : (
                      <EmptyCell />
                    )}
                  </td>
                  <td className={`${tdNum} border-l`} style={tdStyle}>
                    {row.depositKrw > 0 ? (
                      <span className="yield-table-deposit tabular-nums">{formatWon(row.depositKrw)}</span>
                    ) : (
                      <EmptyCell />
                    )}
                  </td>
                  <td className={`${tdNum} border-l`} style={tdStyle}>
                    <MetricBadge value={row.profit} kind="money_krw" />
                  </td>
                  <td className={`${tdNum} border-l`} style={tdStyle}>
                    <MetricBadge value={row.profitUsd} kind="money_usd" />
                  </td>
                  <td className={`${tdNum} border-l`} style={tdStyle}>
                    <MetricBadge value={row.yieldRate} kind="rate" />
                  </td>
                  <td className={`${tdNum} border-l`} style={tdStyle}>
                    <MetricBadge value={row.yieldRateUsd} kind="rate" />
                  </td>
                  <td className={`${tdNum} border-l`} style={{ ...tdStyle, color: 'rgb(var(--theme-text-faint))' }}>
                    {row.usdKrwRate.toLocaleString('ko-KR')}
                  </td>
                  <td className={`${tdBase} border-l text-center`} style={tdStyle}>
                    <button
                      type="button"
                      onClick={() => onRemove(row.id)}
                      className="opacity-0 group-hover:opacity-100 transition-all rounded p-1 hover:bg-red-500/10"
                      style={{ color: 'rgb(var(--theme-text-disabled))' }}
                      aria-label="기록 삭제"
                    >
                      ✕
                    </button>
                  </td>
                </tr>,
              ]

              if (isLastInMonth && monthSummary) {
                elements.push(
                  <tr key={`${monthKey}-summary`} style={{ backgroundColor: 'rgb(var(--theme-surface) / 0.55)' }}>
                    <td
                      className={`${tdDate} text-xs font-semibold border-t`}
                      style={{
                        ...tdStyle,
                        backgroundColor: stickyBg,
                        color: 'rgb(var(--yield-accent))',
                        borderColor: 'rgb(var(--theme-border) / 0.55)',
                      }}
                      colSpan={5}
                    >
                      {monthSummary.label} 합계
                    </td>
                    <td
                      className={`${tdNum} border-l border-t font-semibold yield-table-seed`}
                      style={{ ...tdStyle, borderColor: 'rgb(var(--theme-border) / 0.55)' }}
                    >
                      {formatWon(monthSummary.lastTotalSeed)}
                    </td>
                    <td className={`${tdNum} border-l border-t`} style={{ ...tdStyle, borderColor: 'rgb(var(--theme-border) / 0.55)' }} />
                    <td className={`${tdNum} border-l border-t`} style={{ ...tdStyle, borderColor: 'rgb(var(--theme-border) / 0.55)' }} />
                    <td className={`${tdNum} border-l border-t`} style={{ ...tdStyle, borderColor: 'rgb(var(--theme-border) / 0.55)' }}>
                      <MetricBadge value={monthSummary.profit} kind="money_krw" />
                    </td>
                    <td className={`${tdNum} border-l border-t`} style={{ ...tdStyle, borderColor: 'rgb(var(--theme-border) / 0.55)' }}>
                      <MetricBadge value={monthSummary.profitUsd} kind="money_usd" />
                    </td>
                    <td className={`${tdNum} border-l border-t`} style={{ ...tdStyle, borderColor: 'rgb(var(--theme-border) / 0.55)' }}>
                      <MetricBadge value={monthSummary.yieldRate} kind="rate" />
                    </td>
                    <td className={`${tdNum} border-l border-t`} style={{ ...tdStyle, borderColor: 'rgb(var(--theme-border) / 0.55)' }}>
                      <MetricBadge value={monthSummary.yieldRateUsd} kind="rate" />
                    </td>
                    <td className={`${tdNum} border-l border-t`} style={{ ...tdStyle, borderColor: 'rgb(var(--theme-border) / 0.55)' }} colSpan={2} />
                  </tr>
                )
              }

              return elements
            })}
          </tbody>
        </table>
      </div>
    </YieldPanel>
  )
}
