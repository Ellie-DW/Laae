import { useMemo, useState } from 'react'
import type { PremiumCharacterSection } from '../../lib/premiumGroups'
import {
  PREMIUM_CHART_PERIODS,
  buildPremiumMesoChartSeries,
  buildPremiumMesoPortfolio,
  type GetCharacterPeriodSummary,
  type GetCharacterSummary,
  type PremiumChartPeriod,
  type PremiumChartPoint,
  type PremiumGroupMesoEntry,
} from '../../lib/premiumMesoPortfolio'
import { formatMesoKorean } from '../../utils'

interface PremiumMesoPortfolioPanelProps {
  sections: PremiumCharacterSection[]
  getCharacterSummary: GetCharacterSummary
  getCharacterPeriodSummary: GetCharacterPeriodSummary
}

function MesoLineChart({
  points,
  periodChange,
}: {
  points: PremiumChartPoint[]
  periodChange: number
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const width = 640
  const height = 220
  const padX = 12
  const padY = 16

  if (points.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-slate-600 border border-dashed border-dark-border/60 rounded-lg bg-[#0d1117]/60">
        기록을 추가하면 차트가 표시됩니다
      </div>
    )
  }

  const values = points.map((point) => point.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = Math.max(maxValue - minValue, 1)

  const chartW = width - padX * 2
  const chartH = height - padY * 2

  const coords = points.map((point, index) => {
    const x = padX + (index / Math.max(points.length - 1, 1)) * chartW
    const y = padY + chartH - ((point.value - minValue) / valueRange) * chartH
    return { x, y, point }
  })

  const linePath = coords.map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x} ${coord.y}`).join(' ')
  const lineColor = periodChange >= 0 ? '#f04452' : '#3182f6'

  const yTicks = [minValue, minValue + valueRange / 2, maxValue]
  const xLabelIndexes = new Set([
    0,
    Math.floor((points.length - 1) / 2),
    points.length - 1,
  ])

  const activeIndex = hoverIndex ?? points.length - 1
  const activeCoord = coords[activeIndex]
  const activePoint = points[activeIndex]
  const isHovering = hoverIndex != null

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
    const index = Math.round(ratio * Math.max(points.length - 1, 0))
    setHoverIndex(index)
  }

  const tooltipLeftPercent = (activeIndex / Math.max(points.length - 1, 1)) * 100

  return (
    <div className="space-y-2">
      <div
        className="relative h-[220px] cursor-crosshair select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
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
                  x2={width - padX}
                  y1={y}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.12)"
                  strokeWidth={1}
                />
                <text
                  x={width - padX}
                  y={y - 4}
                  textAnchor="end"
                  fill="rgba(148, 163, 184, 0.55)"
                  fontSize={10}
                >
                  {formatMesoKorean(tick)}
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
              strokeDasharray="4 3"
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
              <circle cx={activeCoord.x} cy={activeCoord.y} r={isHovering ? 5 : 4} fill={lineColor} opacity={0.25} />
              <circle cx={activeCoord.x} cy={activeCoord.y} r={isHovering ? 3.5 : 2.5} fill={lineColor} />
            </>
          )}
        </svg>

        <div
          className={`absolute top-2 z-10 pointer-events-none rounded-lg border border-dark-border/70 bg-[#0d1117]/95 px-2.5 py-1.5 shadow-lg backdrop-blur-sm transition-opacity ${
            isHovering ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            left: `${tooltipLeftPercent}%`,
            transform: `translateX(${tooltipLeftPercent > 75 ? '-100%' : tooltipLeftPercent < 25 ? '0' : '-50%'})`,
          }}
        >
          <p className="text-[10px] text-slate-500 font-mono">{activePoint.date}</p>
          <p className="text-sm font-semibold text-slate-100 mt-0.5">{formatMesoKorean(activePoint.value)}</p>
          {activePoint.change !== 0 && (
            <p className={`text-[10px] font-mono mt-0.5 ${activePoint.change >= 0 ? 'text-[#f04452]' : 'text-[#3182f6]'}`}>
              {activePoint.change >= 0 ? '+' : ''}
              {formatMesoKorean(activePoint.change)}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between px-1 text-[10px] text-slate-600 font-mono">
        {points.map((point, index) =>
          xLabelIndexes.has(index) ? <span key={point.date}>{point.label}</span> : null
        )}
      </div>
    </div>
  )
}

function WatchlistItem({
  entry,
  active,
  onSelect,
}: {
  entry: PremiumGroupMesoEntry
  active: boolean
  onSelect: () => void
}) {
  const isUp = entry.change >= 0

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-3 py-3 border-b border-dark-border/40 transition-colors ${
        active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="mt-1 w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
          style={{ backgroundColor: entry.color }}
        >
          {entry.groupName.slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-100 truncate font-medium">{entry.groupName}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{entry.characterCount}캐릭 · {entry.percentage.toFixed(1)}%</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm text-slate-100 font-medium">{formatMesoKorean(entry.meso)}</p>
          <p className={`text-xs mt-0.5 font-mono ${isUp ? 'text-[#f04452]' : 'text-[#3182f6]'}`}>
            {entry.change === 0 ? '0' : `${isUp ? '+' : ''}${formatMesoKorean(entry.change)}`}
          </p>
        </div>
      </div>
    </button>
  )
}

export default function PremiumMesoPortfolioPanel({
  sections,
  getCharacterSummary,
  getCharacterPeriodSummary,
}: PremiumMesoPortfolioPanelProps) {
  const [period, setPeriod] = useState<PremiumChartPeriod>('3m')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null | undefined>(undefined)

  const portfolio = useMemo(
    () => buildPremiumMesoPortfolio(sections, getCharacterSummary, getCharacterPeriodSummary, period),
    [sections, getCharacterSummary, getCharacterPeriodSummary, period]
  )

  const chart = useMemo(
    () =>
      buildPremiumMesoChartSeries(
        sections,
        getCharacterSummary,
        getCharacterPeriodSummary,
        period,
        selectedGroupId
      ),
    [sections, getCharacterSummary, getCharacterPeriodSummary, period, selectedGroupId]
  )

  if (portfolio.characterCount === 0) return null

  const activeEntry =
    selectedGroupId === undefined
      ? null
      : portfolio.entries.find((entry) => entry.groupId === selectedGroupId) ?? null

  const displayTitle = activeEntry?.groupName ?? '총 보유 메소'
  const displayTotal = activeEntry?.meso ?? chart.currentTotal
  const displayChange = activeEntry?.change ?? chart.periodChange
  const isUp = displayChange >= 0

  return (
    <div className="rounded-xl border border-dark-border/70 bg-[#0b0f14] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col lg:flex-row lg:min-h-[360px]">
        <div className="flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-dark-border/60">
          <div className="px-4 pt-3 pb-2 border-b border-dark-border/40">
            <div className="flex flex-wrap gap-1.5">
              {PREMIUM_CHART_PERIODS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPeriod(item.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    period === item.id
                      ? 'bg-white/10 text-slate-100'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-4">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <p className="text-sm text-slate-400">{displayTitle}</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-50 mt-1 tracking-tight">
                  {formatMesoKorean(displayTotal)}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-sm font-mono">
                  <span className={isUp ? 'text-[#f04452]' : 'text-[#3182f6]'}>
                    {displayChange === 0
                      ? '0'
                      : `${isUp ? '+' : ''}${formatMesoKorean(displayChange)}`}
                  </span>
                  <span className="text-slate-600 text-xs">
                    {PREMIUM_CHART_PERIODS.find((item) => item.id === period)?.label}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-600 font-mono">MESO</p>
                <p className="text-xs text-slate-500 mt-1">{portfolio.characterCount}캐릭</p>
              </div>
            </div>

            <MesoLineChart points={chart.points} periodChange={displayChange} />

            <div className="mt-3 text-[10px] text-slate-600 font-mono">
              누적 보유량 추이 · 장부+보스 합산
            </div>
          </div>
        </div>

        <aside className="w-full lg:w-[280px] shrink-0 bg-[#0d1117]/80">
          <div className="px-4 py-3 border-b border-dark-border/40 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">관심 그룹</h3>
            <span className="text-[10px] text-slate-600 font-mono">{portfolio.entries.length}</span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedGroupId(undefined)}
            className={`w-full text-left px-4 py-3 border-b border-dark-border/40 transition-colors ${
              selectedGroupId === undefined ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-100">총 보유 메소</p>
                <p className="text-[11px] text-slate-500 mt-0.5">전체 그룹 합산</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-100">{formatMesoKorean(portfolio.totalMeso)}</p>
              </div>
            </div>
          </button>

          <div className="max-h-[280px] overflow-y-auto">
            {portfolio.entries.map((entry) => (
              <WatchlistItem
                key={entry.groupId ?? 'ungrouped'}
                entry={entry}
                active={selectedGroupId === entry.groupId}
                onSelect={() => setSelectedGroupId(entry.groupId)}
              />
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
