import { useMemo, useState } from 'react'
import type { YieldDailyRow } from '../../lib/yieldCalc'
import { formatYieldProfit, formatYieldProfitUsd, formatYieldRate } from '../../lib/yieldCalc'
import {
  YIELD_CHART_PERIODS,
  buildYieldChartSeries,
  formatChartUsd,
  formatChartUsdFull,
  formatChartWon,
  type YieldChartMode,
  type YieldChartPeriod,
  type YieldChartPoint,
} from '../../lib/yieldChart'
import { formatWon } from '../../utils'

interface YieldPortfolioChartProps {
  rows: YieldDailyRow[]
  initialPrincipal: number | null
  initialPrincipalUsd: number | null
  investmentStartDate: string | null
}

const MODE_LABELS: Record<YieldChartMode, string> = {
  seed: '총 시드 (₩)',
  seed_usd: '총 시드 ($)',
  return_krw: '원화 수익률',
  return_usd: '달러 수익률',
}

const CHART_MODES: YieldChartMode[] = ['seed', 'seed_usd', 'return_krw', 'return_usd']

function chartVariant(mode: YieldChartMode): 'krw' | 'usd' {
  return mode === 'seed_usd' || mode === 'return_usd' ? 'usd' : 'krw'
}

function isSeedChartMode(mode: YieldChartMode): boolean {
  return mode === 'seed' || mode === 'seed_usd'
}

function YieldLineChart({
  points,
  mode,
  hoverIndex,
  onHover,
}: {
  points: YieldChartPoint[]
  mode: YieldChartMode
  hoverIndex: number | null
  onHover: (index: number | null) => void
}) {
  const width = 640
  const height = 260
  const padX = 8
  const padY = 12
  const padRight = 52
  const isSeedMode = isSeedChartMode(mode)
  const variant = chartVariant(mode)
  const lineClass = variant === 'krw' ? 'yield-chart-line--krw' : 'yield-chart-line--usd'
  const dotClass = variant === 'krw' ? 'yield-chart-dot--krw' : 'yield-chart-dot--usd'

  const formatAxisValue = (value: number) => {
    if (mode === 'seed') return formatChartWon(value)
    if (mode === 'seed_usd') return formatChartUsd(value)
    return formatYieldRate(value)
  }

  if (points.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-sm" style={{ color: 'rgb(var(--theme-text-disabled))' }}>
        일별 기록을 추가하면 차트가 표시됩니다
      </div>
    )
  }

  const minValue = isSeedMode ? 0 : Math.min(0, ...points.map((point) => point.value))
  const maxValue = Math.max(...points.map((point) => point.value), 0)
  const valueRange = Math.max(maxValue - minValue, isSeedMode ? 1 : 0.01)

  const chartW = width - padX - padRight
  const chartH = height - padY * 2

  const coords = points.map((point, index) => {
    const x = padX + (index / Math.max(points.length - 1, 1)) * chartW
    const y = padY + chartH - ((point.value - minValue) / valueRange) * chartH
    return { x, y, point }
  })

  const linePath = coords.map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x} ${coord.y}`).join(' ')

  const yTickCount = 4
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, index) => minValue + (valueRange / yTickCount) * index)

  const xLabelIndexes = new Set([
    0,
    Math.floor((points.length - 1) / 3),
    Math.floor(((points.length - 1) * 2) / 3),
    points.length - 1,
  ])

  const activeIndex = hoverIndex ?? points.length - 1
  const activeCoord = coords[activeIndex]
  const isHovering = hoverIndex != null

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
    const index = Math.round(ratio * Math.max(points.length - 1, 0))
    onHover(index)
  }

  return (
    <div className="space-y-3">
      <div
        className="relative h-[260px] cursor-crosshair select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => onHover(null)}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
          aria-hidden
        >
          {yTicks.map((tick, index) => {
            const y = padY + chartH - ((tick - minValue) / valueRange) * chartH
            return (
              <g key={index}>
                <line
                  x1={padX}
                  x2={width - padRight}
                  y1={y}
                  y2={y}
                  stroke="rgb(var(--theme-border) / 0.35)"
                  strokeWidth={1}
                />
                <text
                  x={width - 4}
                  y={y + 3}
                  textAnchor="end"
                  fill="rgb(var(--theme-text-faint) / 0.85)"
                  fontSize={10}
                >
                  {formatAxisValue(tick)}
                </text>
              </g>
            )
          })}

          {isHovering && activeCoord && (
            <line
              x1={activeCoord.x}
              x2={activeCoord.x}
              y1={padY}
              y2={height - padY}
              stroke="rgb(var(--theme-text-faint) / 0.35)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          <path
            d={linePath}
            fill="none"
            className={lineClass}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {activeCoord && (
            <>
              <circle cx={activeCoord.x} cy={activeCoord.y} r={isHovering ? 6 : 4} className={dotClass} opacity={0.2} />
              <circle cx={activeCoord.x} cy={activeCoord.y} r={isHovering ? 4 : 3} className={dotClass} />
            </>
          )}
        </svg>
      </div>

      <div
        className="flex justify-between px-1 text-[10px] tabular-nums"
        style={{ color: 'rgb(var(--theme-text-faint))' }}
      >
        {points.map((point, index) =>
          xLabelIndexes.has(index) ? <span key={point.date}>{point.label}</span> : null
        )}
      </div>
    </div>
  )
}

export default function YieldPortfolioChart({
  rows,
  initialPrincipal,
  initialPrincipalUsd,
  investmentStartDate,
}: YieldPortfolioChartProps) {
  const [mode, setMode] = useState<YieldChartMode>('seed')
  const [period, setPeriod] = useState<YieldChartPeriod>('1m')
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const chart = useMemo(
    () =>
      buildYieldChartSeries(
        rows,
        initialPrincipal,
        initialPrincipalUsd,
        investmentStartDate,
        mode,
        period
      ),
    [rows, initialPrincipal, initialPrincipalUsd, investmentStartDate, mode, period]
  )

  if (rows.length === 0) return null

  const activeIndex = hoverIndex ?? Math.max(chart.points.length - 1, 0)
  const activePoint = chart.points[activeIndex] ?? chart.points[chart.points.length - 1]
  const displayDate = activePoint?.date ?? chart.activeDate

  const displayValue = (() => {
    if (mode === 'seed') {
      return formatWon(activePoint?.totalSeed ?? chart.currentValue)
    }
    if (mode === 'seed_usd') {
      return formatChartUsdFull(activePoint?.totalSeedUsd ?? chart.currentValue)
    }
    return formatYieldRate(activePoint?.value ?? chart.currentValue)
  })()

  const displayChange = (() => {
    const change = activePoint?.change ?? 0
    if (mode === 'seed') return formatYieldProfit(change)
    if (mode === 'seed_usd') return formatYieldProfitUsd(change)
    return formatYieldRate(change)
  })()

  const changeTone =
    activePoint && activePoint.change > 0
      ? 'rgb(var(--yield-profit))'
      : activePoint && activePoint.change < 0
        ? 'rgb(var(--yield-loss))'
        : undefined

  return (
    <div className="yield-chart">
      <div className="yield-chart-topline" />
      <div className="yield-chart-toolbar">
        <div className="yield-chart-tab-group">
          {CHART_MODES.map((item) => (
            <button
              key={item}
              type="button"
              data-yield-chart-tab
              data-active={mode === item ? 'true' : 'false'}
              data-variant={chartVariant(item)}
              onClick={() => setMode(item)}
              className="yield-chart-tab"
            >
              {MODE_LABELS[item]}
            </button>
          ))}
        </div>
        <div className="yield-chart-period-group">
          {YIELD_CHART_PERIODS.map((item) => (
            <button
              key={item.id}
              type="button"
              data-active={period === item.id ? 'true' : 'false'}
              onClick={() => setPeriod(item.id)}
              className="yield-chart-period"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--theme-text-faint))' }}>
          {MODE_LABELS[mode]}
        </p>
        <p className="text-[11px] mt-1 tabular-nums" style={{ color: 'rgb(var(--theme-text-disabled))' }}>
          {displayDate}
        </p>
        <p
          className="text-3xl sm:text-4xl font-bold mt-1 tracking-tight tabular-nums"
          style={{
            color:
              mode === 'seed'
                ? 'rgb(var(--yield-krw))'
                : mode === 'seed_usd'
                  ? 'rgb(var(--yield-usd))'
                  : 'rgb(var(--theme-text))',
          }}
        >
          {displayValue}
        </p>
        {activePoint && activePoint.change !== 0 && (
          <p className="text-xs mt-1 tabular-nums" style={{ color: changeTone }}>
            전일 대비 {displayChange}
          </p>
        )}
      </div>

      <div className="px-2 pb-4">
        <YieldLineChart
          points={chart.points}
          mode={mode}
          hoverIndex={hoverIndex}
          onHover={setHoverIndex}
        />
      </div>
    </div>
  )
}
