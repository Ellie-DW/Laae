import { useMemo } from 'react'
import type { Character, HuntRecord, GatherRecord, DropRecord, Expense, BossSnapshot, CharacterBossData } from '../../types'
import { getDropItemStats, getDropStatsSummary, PREDEFINED_DROP_ITEMS } from '../../data/dropItems'
import DropItemIcon from '../drop/DropItemIcon'
import { getHuntCumulativeStats } from '../../lib/huntStats'
import { getAccountBossCumulativeStats } from '../../lib/bossStats'
import { createDefaultBossData } from '../../lib/appDataApi'
import { formatMesoKorean } from '../../utils'

interface CumulativeDashboardSectionProps {
  characters: Character[]
  hunts: HuntRecord[]
  gathers: GatherRecord[]
  drops: DropRecord[]
  expenses: Expense[]
  snapshots: BossSnapshot[]
  bossDataMap: Record<string, CharacterBossData>
}

interface StatCard {
  label: string
  value: string
  active: boolean
  tone?: 'cyber' | 'maple' | 'violet' | 'emerald' | 'expense'
}

export default function CumulativeDashboardSection({
  characters,
  hunts,
  gathers,
  drops,
  expenses,
  snapshots,
  bossDataMap,
}: CumulativeDashboardSectionProps) {
  const huntStats = useMemo(() => getHuntCumulativeStats(hunts), [hunts])
  const dropStats = useMemo(() => getDropItemStats(drops), [drops])
  const dropSummary = useMemo(() => getDropStatsSummary(dropStats), [dropStats])
  const dropGroups = useMemo(() => {
    const statsById = new Map(dropStats.map((s) => [s.id, s]))
    const groupOrder = [...new Set(PREDEFINED_DROP_ITEMS.map((i) => i.group))]
    return groupOrder.map((group) => ({
      group,
      items: PREDEFINED_DROP_ITEMS.filter((i) => i.group === group).map((item) => ({
        ...item,
        count: statsById.get(item.id)?.totalAcquired ?? 0,
      })),
    }))
  }, [dropStats])
  const bossStats = useMemo(
    () => getAccountBossCumulativeStats(snapshots, characters, bossDataMap, createDefaultBossData()),
    [snapshots, characters, bossDataMap]
  )
  const gatherTotal = useMemo(() => gathers.reduce((s, g) => s + g.meso, 0), [gathers])
  const expenseTotal = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses])

  const totalIncome =
    huntStats.huntMesoTotal +
    huntStats.saleMesoTotal +
    dropSummary.saleIncome +
    bossStats.totalMeso +
    gatherTotal

  const netProfit = totalIncome - expenseTotal

  const huntItems: StatCard[] = [
    { label: '사냥 수익', value: formatMesoKorean(huntStats.huntMesoTotal), active: huntStats.huntMesoTotal > 0, tone: 'cyber' },
    { label: '솔 에르다 조각 판매 수익', value: formatMesoKorean(huntStats.saleMesoTotal), active: huntStats.saleMesoTotal > 0, tone: 'violet' },
    { label: '솔 에르다 조각', value: `${huntStats.acquiredSolErda.toLocaleString()}개`, active: huntStats.acquiredSolErda > 0, tone: 'violet' },
  ]

  const bossItems: StatCard[] = [
    { label: '주간 누적', value: formatMesoKorean(bossStats.weeklyMeso), active: bossStats.weeklyMeso > 0, tone: 'cyber' },
    { label: '월간 누적', value: formatMesoKorean(bossStats.monthlyMeso), active: bossStats.monthlyMeso > 0, tone: 'maple' },
    { label: '총 누적 수익', value: formatMesoKorean(bossStats.totalMeso), active: bossStats.totalMeso > 0, tone: 'maple' },
  ]

  const gatherItems: StatCard[] = [
    { label: '총 채집 수익', value: formatMesoKorean(gatherTotal), active: gatherTotal > 0, tone: 'emerald' },
  ]

  const expenseItems: StatCard[] = [
    { label: '총 지출', value: formatMesoKorean(expenseTotal), active: expenseTotal > 0, tone: 'expense' },
    { label: '지출 기록', value: `${expenses.length}건`, active: expenses.length > 0, tone: 'expense' },
  ]

  return (
    <div className="panel-glow p-5 border-cyber-500/20">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <h2 className="font-semibold text-slate-100">총 누적 현황</h2>
          <p className="text-xs text-slate-500 mt-0.5">모든 캐릭터 · 그동안 기록 전체</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0 sm:min-w-[280px]">
          <HeaderStat label="누적 수익" value={formatMesoKorean(totalIncome)} tone="income" />
          <HeaderStat label="누적 지출" value={formatMesoKorean(expenseTotal)} tone="expense" />
          <HeaderStat label="누적 순수익" value={formatMesoKorean(netProfit)} tone="net" positive={netProfit >= 0} />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-2">보스</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {bossItems.map((item) => (
              <StatCard key={item.label} {...item} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 font-medium mb-2">사냥</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {huntItems.map((item) => (
              <StatCard key={item.label} {...item} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500 font-medium">장비</p>
            <span className="text-xs font-bold text-maple-400">
              {dropSummary.acquiredKinds}<span className="font-normal text-slate-500">종</span>
              {' · '}
              {dropSummary.acquiredTotal}<span className="font-normal text-slate-500">개</span>
            </span>
          </div>
          <div className="space-y-3">
            {dropGroups.map(({ group, items }) => (
              <div key={group}>
                <p className="text-[10px] text-slate-600 mb-1.5">{group}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        item.count > 0
                          ? 'bg-maple-500/10 border-maple-500/30 text-maple-200'
                          : 'bg-dark-surface/40 border-dark-border text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <DropItemIcon name={item.name} size="xs" />
                        <p className="truncate text-xs flex-1">{item.name}</p>
                      </div>
                      <p className={`text-lg font-bold mt-1 ${item.count > 0 ? 'text-maple-400' : 'text-slate-600'}`}>
                        {item.count}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 font-medium mb-2">채집</p>
          <div className="grid grid-cols-1 max-w-xs gap-2">
            {gatherItems.map((item) => (
              <StatCard key={item.label} {...item} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 font-medium mb-2">지출</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 max-w-md gap-2">
            {expenseItems.map((item) => (
              <StatCard key={item.label} {...item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function HeaderStat({
  label,
  value,
  tone,
  positive = true,
}: {
  label: string
  value: string
  tone: 'income' | 'expense' | 'net'
  positive?: boolean
}) {
  const valueClass =
    tone === 'income'
      ? 'text-cyber-400'
      : tone === 'expense'
        ? 'text-red-400'
        : positive
          ? 'text-emerald-400'
          : 'text-red-400'

  return (
    <div className="px-2.5 py-2 rounded-lg bg-dark-surface/50 border border-dark-border text-right">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={`text-xs sm:text-sm font-bold mt-0.5 ${valueClass}`}>{value}</p>
    </div>
  )
}

function StatCard({ label, value, active, tone }: StatCard) {
  const valueClass =
    tone === 'cyber' ? 'text-cyber-400'
    : tone === 'maple' ? 'text-maple-400'
    : tone === 'violet' ? 'text-violet-400'
    : tone === 'emerald' ? 'text-emerald-400'
    : tone === 'expense' ? 'text-red-400'
    : 'text-slate-200'

  return (
    <div
      className={`px-3 py-2 rounded-lg border text-sm ${
        active
          ? 'bg-dark-surface/60 border-dark-border text-slate-200'
          : 'bg-dark-surface/40 border-dark-border text-slate-500'
      }`}
    >
      <p className="truncate text-xs">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${active ? valueClass : 'text-slate-600'}`}>{value}</p>
    </div>
  )
}
