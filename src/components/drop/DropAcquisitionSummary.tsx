import { useMemo } from 'react'
import type { DropRecord } from '../../types'
import { PREDEFINED_DROP_ITEMS, getAcquisitionCounts } from '../../data/dropItems'

interface DropAcquisitionSummaryProps {
  drops: DropRecord[]
  characterId: string
}

export default function DropAcquisitionSummary({ drops, characterId }: DropAcquisitionSummaryProps) {
  const countByName = useMemo(() => getAcquisitionCounts(drops, characterId), [drops, characterId])

  const groups = useMemo(() => {
    const groupOrder = [...new Set(PREDEFINED_DROP_ITEMS.map((i) => i.group))]
    return groupOrder.map((group) => ({
      group,
      items: PREDEFINED_DROP_ITEMS.filter((i) => i.group === group).map((item) => ({
        ...item,
        count: countByName.get(item.name) ?? 0,
      })),
    }))
  }, [countByName])

  const acquiredKinds = groups.flatMap((g) => g.items).filter((i) => i.count > 0).length
  const totalRecords = groups.flatMap((g) => g.items).reduce((s, i) => s + i.count, 0)

  return (
    <div className="panel-glow p-5 border-maple-500/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-slate-100">획득 현황</h2>
          <p className="text-xs text-slate-500 mt-0.5">보유 중인 드랍 (판매 시 차감)</p>
        </div>
        <span className="text-sm font-bold text-maple-400">
          {acquiredKinds}<span className="text-xs font-normal text-slate-500">종</span>
          {' · '}
          {totalRecords}<span className="text-xs font-normal text-slate-500">개</span>
        </span>
      </div>

      <div className="space-y-4">
        {groups.map(({ group, items }) => (
          <div key={group}>
            <p className="text-xs text-slate-500 font-medium mb-2">{group}</p>
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
                  <p className="truncate text-xs">{item.name}</p>
                  <p className={`text-lg font-bold mt-0.5 ${item.count > 0 ? 'text-maple-400' : 'text-slate-600'}`}>
                    {item.count}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
