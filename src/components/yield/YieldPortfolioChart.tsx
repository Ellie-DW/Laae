import { useMemo, useState } from 'react'
import type { YieldDailyRow } from '../../lib/yieldCalc'
import { formatYieldProfit, formatYieldRate } from '../../lib/yieldCalc'
import {
  YIELD_CHART_PERIODS,
  buildYieldChartSeries,
  formatChartWon,
  type YieldChartMode,
  type YieldChartPeriod,
  type YieldChartPoint,
} from '../../lib/yieldChart'
import { formatWon } from '../../utils'

interface YieldPortfolioChartProps {
  rows: YieldDailyRow[]
  initialPrincipal: number | null
  investmentStartDate: string | null
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
  const height = 240
  const padX = 8
  const padY = 12
  const padRight = 52

  const formatAxisValue = (value: number) =>
    mode === 'seed' ? formatChartWon(value) : formatYieldRate(value)

  if (points.length === 0) {
    return (
      <div className="h-[240px] flex items-center justify-center text-sm text-slate-600">
        일별 기록을 추가하면 차트가 표시됩니다
      </div>
    )
  }

  const minValue = mode === 'seed' ? 0 : Math.min(0, ...points.map((point) => point.value))
  const maxValue = Math.max(...points.map((point) => point.value), 0)
  const valueRange = Math.max(maxValue - minValue, mode === 'return' ? 0.01 : 1)

  const chartW = width - padX - padRight
  const chartH = height - padY * 2

  const coords = points.map((point, index) => {
    const x = padX + (index / Math.max(points.length - 1, 1)) * chartW
    const y = padY + chartH - ((point.value - minValue) / valueRange) * chartH
    return { x, y, point }
  })

  const linePath = coords.map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x} ${coord.y}`).join(' ')
  const lineColor = '#fbbf24'

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
        className="relative h-[240px] cursor-crosshair select-none"
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
                  stroke="rgba(148, 163, 184, 0.1)"
                  strokeWidth={1}
                />
                <text
                  x={width - 4}
                  y={y + 3}
                  textAnchor="end"
                  fill="rgba(148, 163, 184, 0.45)"
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
              stroke="rgba(148, 163, 184, 0.35)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          <path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {activeCoord && (
            <>
              <circle cx={activeCoord.x} cy={activeCoord.y} r={isHovering ? 6 : 4} fill={lineColor} opacity={0.2} />
              <circle cx={activeCoord.x} cy={activeCoord.y} r={isHovering ? 4 : 3} fill={lineColor} />
            </>
          )}
        </svg>
      </div>

      <div className="flex justify-between px-1 text-[10px] text-slate-500 tabular-nums">
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
  investmentStartDate,
}: YieldPortfolioChartProps) {
  const [mode, setMode] = useState<YieldChartMode>('seed')
  const [period, setPeriod] = useState<YieldChartPeriod>('1m')
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const chart = useMemo(
    () => buildYieldChartSeries(rows, initialPrincipal, investmentStartDate, mode, period),
    [rows, initialPrincipal, investmentStartDate, mode, period]
  )

  if (rows.length === 0) return null

  const activeIndex = hoverIndex ?? Math.max(chart.points.length - 1, 0)
  const activePoint = chart.points[activeIndex] ?? chart.points[chart.points.length - 1]
  const displayDate = activePoint?.date ?? chart.activeDate
  const displayValue =
    mode === 'seed'
      ? formatWon(activePoint?.totalSeed ?? chart.currentValue)
      : formatYieldRate(activePoint?.value ?? chart.currentValue)

  const displayChange =
    mode === 'seed'
      ? formatYieldProfit(activePoint?.change ?? 0)
      : formatYieldRate(activePoint?.change ?? 0)

  return (
    <div className="rounded-xl border border-dark-border/70 bg-[#0b0f14] overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex flex-wrap items-start justify-between gap-3 border-b border-dark-border/40">
        <div className="flex gap-1 p-0.5 rounded-lg bg-dark-bg/50">
          <button
            type="button"
            onClick={() => setMode('seed')}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
              mode === 'seed' ? 'bg-white/10 text-slate-100' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            총 시드
          </button>
          <button
            type="button"
            onClick={() => setMode('return')}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
              mode === 'return' ? 'bg-white/10 text-slate-100' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            수익률
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {YIELD_CHART_PERIODS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              className={`px-2 py-1 rounded text-[11px] transition-colors ${
                period === item.id ? 'text-slate-200 bg-white/8' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-2">
        <p className="text-sm text-slate-400">{mode === 'seed' ? '총 시드' : '누적 수익률'}</p>
        <p className="text-[11px] text-slate-500 mt-1 tabular-nums">{displayDate}</p>
        <p className="text-3xl font-bold text-slate-50 mt-1 tracking-tight tabular-nums">{displayValue}</p>
        {activePoint && activePoint.change !== 0 && (
          <p
            className={`text-xs mt-1 tabular-nums ${
              activePoint.change >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
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
