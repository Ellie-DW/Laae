import { useMemo, useState } from 'react'
import { PREDEFINED_DROP_ITEMS, getDropItemGroups } from '../../data/dropItems'
import { getToday } from '../../utils'

export interface DropAddItem {
  itemName: string
  recordDate: string
}

interface DropChecklistSectionProps {
  onAdd: (items: DropAddItem[]) => Promise<void>
}

export default function DropChecklistSection({ onAdd }: DropChecklistSectionProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [recordDate, setRecordDate] = useState(getToday())
  const [adding, setAdding] = useState(false)

  const groups = useMemo(
    () =>
      getDropItemGroups(
        PREDEFINED_DROP_ITEMS.map((item) => ({
          id: item.id,
          name: item.name,
          meso: 0,
          checked: selected.has(item.id),
        }))
      ),
    [selected]
  )

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAdd = async () => {
    if (selected.size === 0 || adding) return
    const items = PREDEFINED_DROP_ITEMS.filter((i) => selected.has(i.id)).map((i) => ({
      itemName: i.name,
      recordDate,
    }))
    setAdding(true)
    try {
      await onAdd(items)
      setSelected(new Set())
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="panel-light p-5">
      <div className="mb-4">
        <h2 className="font-semibold text-slate-100">드랍 체크리스트</h2>
        <p className="text-xs text-slate-500 mt-0.5">획득일만 기록합니다. 판매는 아래 기타 드랍에서 입력하세요.</p>
      </div>

      <div className="space-y-5">
        {groups.map(({ group, items }) => (
          <div key={group}>
            <p className="text-xs text-slate-500 font-medium mb-2">{group}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((item) => {
                const isSelected = selected.has(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSelect(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-cyber-500/10 border-cyber-500/40 text-cyber-200'
                        : 'bg-dark-surface/50 border-dark-border text-slate-400 hover:border-maple-500/20 hover:text-slate-300'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 text-xs ${
                        isSelected
                          ? 'bg-cyber-500 border-cyber-400 text-white'
                          : 'border-slate-600'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                    <span className="text-sm">{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-dark-border space-y-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">획득일</label>
          <input
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            className="input-field text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={selected.size === 0 || adding}
          className="btn-primary text-sm w-full py-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {adding ? '추가 중...' : `선택 항목 추가하기 (${selected.size})`}
        </button>
      </div>
    </div>
  )
}
