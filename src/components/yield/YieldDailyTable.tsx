import type { YieldDailyRow, YieldMonthSummary } from '../../lib/yieldCalc'
import {
  formatKrwCell,
  formatUsd,
  formatYieldProfit,
  formatYieldRate,
} from '../../lib/yieldCalc'
import { formatWon } from '../../utils'

interface YieldDailyTableProps {
  rows: YieldDailyRow[]
  monthSummaries: YieldMonthSummary[]
  onRemove: (id: string) => void
}

function EmptyCell() {
  return <span className="text-slate-600">-</span>
}

function MetricBadge({
  value,
  kind,
}: {
  value: number | null
  kind: 'money' | 'rate'
}) {
  if (value == null) return <EmptyCell />
  if (value === 0) {
    return (
      <span className="text-slate-500 tabular-nums">
        {kind === 'money' ? formatYieldProfit(0) : formatYieldRate(0)}
      </span>
    )
  }

  const label = kind === 'money' ? formatYieldProfit(value) : formatYieldRate(value)
  const tone =
    value > 0
      ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20'
      : 'bg-red-500/10 text-red-300 ring-red-500/20'

  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ${tone}`}>
      {label}
    </span>
  )
}

function GroupHeader({ label, currency }: { label: string; currency: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span>{label}</span>
      <span className="text-[9px] font-normal text-slate-500">{currency}</span>
    </div>
  )
}

export default function YieldDailyTable({ rows, monthSummaries, onRemove }: YieldDailyTableProps) {
  const summaryByMonth = new Map(monthSummaries.map((item) => [item.monthKey, item]))

  if (rows.length === 0) {
    return (
      <div className="panel-light p-10 text-center">
        <p className="text-sm text-slate-400">아직 일별 기록이 없어요</p>
        <p className="text-xs text-slate-600 mt-2">아래에서 날짜별 거래소 잔고를 추가해 보세요</p>
      </div>
    )
  }

  const thBase =
    'px-3 py-2.5 text-[11px] font-semibold text-slate-400 whitespace-nowrap bg-dark-surface/90 border-b border-dark-border/80'
  const tdBase =
    'px-3 py-2.5 text-xs text-slate-300 whitespace-nowrap border-b border-dark-border/40 tabular-nums'
  const tdNum = `${tdBase} text-right`
  const tdDate = `${tdBase} sticky left-0 z-10 bg-dark-panel/98 font-medium text-slate-200 shadow-[4px_0_12px_rgba(0,0,0,0.25)]`

  return (
    <div className="panel-light overflow-hidden">
      <div className="px-4 py-3 border-b border-dark-border/60 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-100">일별 기록</h2>
          <p className="text-xs text-slate-500 mt-0.5">날짜순 · {rows.length}일</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1000px] w-full border-collapse">
          <thead>
            <tr>
              <th className={`${thBase} sticky left-0 z-20 text-left`} rowSpan={2}>
                날짜
              </th>
              <th className={`${thBase} text-center border-l border-dark-border/50`} colSpan={2}>
                <GroupHeader label="업비트" currency="KRW" />
              </th>
              <th className={`${thBase} text-center border-l border-dark-border/50`} colSpan={2}>
                <GroupHeader label="바이낸스" currency="USD" />
              </th>
              <th className={`${thBase} text-right border-l border-dark-border/50`} rowSpan={2}>
                총 시드
              </th>
              <th className={`${thBase} text-right border-l border-dark-border/50`} rowSpan={2}>
                출금
              </th>
              <th className={`${thBase} text-right border-l border-dark-border/50`} rowSpan={2}>
                입금
              </th>
              <th className={`${thBase} text-right border-l border-dark-border/50`} rowSpan={2}>
                수익금
              </th>
              <th className={`${thBase} text-right border-l border-dark-border/50`} rowSpan={2}>
                수익률
              </th>
              <th className={`${thBase} text-right border-l border-dark-border/50`} rowSpan={2}>
                환율
              </th>
              <th className={`${thBase} w-10 border-l border-dark-border/50`} rowSpan={2}></th>
            </tr>
            <tr>
              <th className={`${thBase} text-right text-[10px] font-normal text-slate-500`}>시작</th>
              <th className={`${thBase} text-right text-[10px] font-normal text-slate-500`}>마감</th>
              <th className={`${thBase} text-right text-[10px] font-normal text-slate-500 border-l border-dark-border/50`}>
                시작
              </th>
              <th className={`${thBase} text-right text-[10px] font-normal text-slate-500`}>마감</th>
            </tr>
          </thead>
          <tbody>
            {rows.flatMap((row, index) => {
              const monthKey = row.recordDate.slice(0, 7)
              const next = rows[index + 1]
              const isLastInMonth = !next || next.recordDate.slice(0, 7) !== monthKey
              const monthSummary = summaryByMonth.get(monthKey)
              const isEven = index % 2 === 0

              const elements = [
                <tr
                  key={row.id}
                  className={`group transition-colors hover:bg-cyber-400/5 ${
                    isEven ? 'bg-dark-bg/20' : 'bg-transparent'
                  }`}
                >
                  <td className={tdDate}>{row.recordDate}</td>
                  <td className={tdNum}>
                    {row.upbitStart == null ? <EmptyCell /> : formatKrwCell(row.upbitStart)}
                  </td>
                  <td className={tdNum}>
                    {row.upbitEnd == null ? <EmptyCell /> : formatKrwCell(row.upbitEnd)}
                  </td>
                  <td className={`${tdNum} border-l border-dark-border/30`}>
                    {row.binanceStart == null ? <EmptyCell /> : formatUsd(row.binanceStart)}
                  </td>
                  <td className={tdNum}>
                    {row.binanceEnd == null ? <EmptyCell /> : formatUsd(row.binanceEnd)}
                  </td>
                  <td className={`${tdNum} border-l border-dark-border/30 font-semibold text-slate-100`}>
                    {formatWon(row.totalSeed)}
                  </td>
                  <td className={`${tdNum} border-l border-dark-border/30`}>
                    {row.withdrawalKrw > 0 ? (
                      <span className="text-amber-300/90 tabular-nums">{formatWon(row.withdrawalKrw)}</span>
                    ) : (
                      <EmptyCell />
                    )}
                  </td>
                  <td className={`${tdNum} border-l border-dark-border/30`}>
                    {row.depositKrw > 0 ? (
                      <span className="text-sky-300/90 tabular-nums">{formatWon(row.depositKrw)}</span>
                    ) : (
                      <EmptyCell />
                    )}
                  </td>
                  <td className={`${tdNum} border-l border-dark-border/30`}>
                    <MetricBadge value={row.profit} kind="money" />
                  </td>
                  <td className={`${tdNum} border-l border-dark-border/30`}>
                    <MetricBadge value={row.yieldRate} kind="rate" />
                  </td>
                  <td className={`${tdNum} border-l border-dark-border/30 text-slate-400`}>
                    {row.usdKrwRate.toLocaleString('ko-KR')}
                  </td>
                  <td className={`${tdBase} border-l border-dark-border/30 text-center`}>
                    <button
                      type="button"
                      onClick={() => onRemove(row.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-opacity"
                      aria-label="기록 삭제"
                    >
                      ✕
                    </button>
                  </td>
                </tr>,
              ]

              if (isLastInMonth && monthSummary) {
                elements.push(
                  <tr key={`${monthKey}-summary`} className="bg-dark-surface/60">
                    <td
                      className={`${tdDate} text-xs font-semibold text-cyber-300/90 border-t border-dark-border/70`}
                      colSpan={5}
                    >
                      {monthSummary.label} 합계
                    </td>
                    <td
                      className={`${tdNum} border-l border-dark-border/30 border-t border-dark-border/70 font-semibold text-maple-300/90`}
                    >
                      {formatWon(monthSummary.lastTotalSeed)}
                    </td>
                    <td className={`${tdNum} border-l border-dark-border/30 border-t border-dark-border/70`} />
                    <td className={`${tdNum} border-l border-dark-border/30 border-t border-dark-border/70`} />
                    <td className={`${tdNum} border-l border-dark-border/30 border-t border-dark-border/70`}>
                      <MetricBadge value={monthSummary.profit} kind="money" />
                    </td>
                    <td className={`${tdNum} border-l border-dark-border/30 border-t border-dark-border/70`}>
                      <MetricBadge value={monthSummary.yieldRate} kind="rate" />
                    </td>
                    <td className={`${tdNum} border-l border-dark-border/30 border-t border-dark-border/70`} colSpan={2} />
                  </tr>
                )
              }

              return elements
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
