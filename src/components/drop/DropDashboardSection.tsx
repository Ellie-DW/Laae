import { useMemo } from 'react'
import type { DropRecord, HuntRecord } from '../../types'
import { getDropItemStats, getDropStatsSummary } from '../../data/dropItems'
import { getHeldSolErdaFragments } from '../../lib/huntStats'
import { formatMesoKorean } from '../../utils'

interface DropDashboardSectionProps {
  drops: DropRecord[]
  hunts: HuntRecord[]
  onGoDrop?: () => void
}

export default function DropDashboardSection({
  drops,
  hunts,
  onGoDrop,
}: DropDashboardSectionProps) {
  const stats = useMemo(() => getDropItemStats(drops), [drops])
  const summary = useMemo(() => getDropStatsSummary(stats), [stats])

  const groups = useMemo(() => {
    const groupOrder = [...new Set(stats.map((s) => s.group))]
    return groupOrder.map((group) => ({
      group,
      items: stats.filter((s) => s.group === group),
    }))
  }, [stats])

  const recentSales = useMemo(() => {
    return drops
      .filter((d) => d.meso > 0)
      .sort((a, b) => b.recordDate.localeCompare(a.recordDate) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
  }, [drops])

  const totalSolErda = useMemo(() => getHeldSolErdaFragments(hunts), [hunts])

  const hasAnyDrop = summary.acquiredTotal > 0 || summary.saleIncome > 0
  const hasAnyContent = hasAnyDrop || totalSolErda > 0

  if (!hasAnyContent) {
    return (
      <div className="panel-light p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-100">드랍 현황</h2>
            <p className="text-xs text-slate-500 mt-0.5">모든 캐릭터 · 아직 드랍 기록이 없어요</p>
          </div>
          {onGoDrop && (
            <button
              onClick={onGoDrop}
              className="text-xs text-maple-400 hover:text-maple-300 border border-maple-500/30 px-3 py-1.5 rounded-lg hover:bg-maple-500/10 transition-colors shrink-0"
            >
              드랍 기록 →
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!hasAnyDrop) {
    return (
      <div className="panel-light p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-100">드랍 현황</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              모든 캐릭터 · 솔 에르다 조각 {totalSolErda.toLocaleString()}개
            </p>
          </div>
          {onGoDrop && (
            <button
              onClick={onGoDrop}
              className="text-xs text-maple-400 hover:text-maple-300 border border-maple-500/30 px-3 py-1.5 rounded-lg hover:bg-maple-500/10 transition-colors shrink-0"
            >
              드랍 기록 →
            </button>
          )}
        </div>
        <div className="mt-4 max-w-xs">
          <MiniStat label="솔 에르다 조각" value={`${totalSolErda.toLocaleString()}개`} violet />
        </div>
      </div>
    )
  }

  return (
    <div className="panel-light p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-semibold text-slate-100">드랍 현황</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            모든 캐릭터 · 보유 {summary.heldTotal}개 · 누적 획득 {summary.acquiredTotal}회 · 솔 에르다 {totalSolErda.toLocaleString()}개
          </p>
        </div>
        {onGoDrop && (
          <button
            onClick={onGoDrop}
            className="text-xs text-maple-400 hover:text-maple-300 border border-maple-500/30 px-3 py-1.5 rounded-lg hover:bg-maple-500/10 transition-colors shrink-0"
          >
            드랍 관리 →
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <MiniStat label="보유 종류" value={`${summary.heldKinds}종`} />
        <MiniStat label="보유 개수" value={`${summary.heldTotal}개`} highlight />
        <MiniStat label="누적 획득" value={`${summary.acquiredTotal}회`} />
        <MiniStat label="판매 수익" value={formatMesoKorean(summary.saleIncome)} gold />
        <MiniStat label="솔 에르다 조각" value={`${totalSolErda.toLocaleString()}개`} violet />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-3">보유 현황</p>
          <div className="space-y-3">
            {groups.map(({ group, items }) => {
              const heldItems = items.filter((i) => i.held > 0)
              if (heldItems.length === 0) return null
              return (
                <div key={group}>
                  <p className="text-[10px] text-slate-600 mb-1.5">{group}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {heldItems.map((item) => (
                      <span
                        key={item.id}
                        className="text-xs px-2.5 py-1 rounded-full bg-maple-500/10 border border-maple-500/30 text-maple-200"
                      >
                        {item.name} <strong className="text-maple-400">{item.held}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
            {summary.heldTotal === 0 && (
              <p className="text-xs text-slate-600">보유 중인 드랍이 없어요</p>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 font-medium mb-3">누적 획득 (그동안 얻은 것)</p>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {groups.map(({ group, items }) => {
              const acquiredItems = items.filter((i) => i.totalAcquired > 0)
              if (acquiredItems.length === 0) return null
              return (
                <div key={group}>
                  <p className="text-[10px] text-slate-600 mb-1.5">{group}</p>
                  <div className="space-y-1">
                    {acquiredItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-dark-surface/50"
                      >
                        <span className="text-slate-300 truncate mr-2">{item.name}</span>
                        <span className="text-slate-500 shrink-0">
                          <span className="text-maple-400 font-semibold">{item.totalAcquired}</span>회
                          {item.sold > 0 && (
                            <span className="text-slate-600"> · 판매 {item.sold}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {recentSales.length > 0 && (
        <div className="mt-5 pt-4 border-t border-dark-border">
          <p className="text-xs text-slate-500 font-medium mb-2">최근 판매</p>
          <div className="space-y-1.5">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-400 truncate mr-2">
                  {sale.itemName} · {sale.recordDate}
                </span>
                <span className="text-maple-400 font-semibold shrink-0">+{formatMesoKorean(sale.meso)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value, highlight, gold, violet }: { label: string; value: string; highlight?: boolean; gold?: boolean; violet?: boolean }) {
  return (
    <div className="px-3 py-2 rounded-lg bg-dark-surface/50 border border-dark-border text-center">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${
        highlight ? 'text-maple-400' : gold ? 'text-maple-400' : violet ? 'text-violet-400' : 'text-slate-200'
      }`}>
        {value}
      </p>
    </div>
  )
}
