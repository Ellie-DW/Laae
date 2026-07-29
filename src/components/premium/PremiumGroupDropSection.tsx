import { useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'
import type { PremiumCharacterGroup } from '../../lib/premiumGroupsApi'

export const premiumGroupDropId = (groupId: string | null) =>
  groupId ? `group:${groupId}` : 'group:ungrouped'

export function parsePremiumGroupDropId(id: string | number): string | null | undefined {
  const value = String(id)
  if (!value.startsWith('group:')) return undefined
  const groupKey = value.slice(6)
  return groupKey === 'ungrouped' ? null : groupKey
}

interface PremiumGroupDropSectionProps {
  group: PremiumCharacterGroup | null
  characterCount: number
  dropEnabled?: boolean
  children: ReactNode
}

export default function PremiumGroupDropSection({
  group,
  characterCount,
  dropEnabled = true,
  children,
}: PremiumGroupDropSectionProps) {
  const groupId = group?.id ?? null
  const { setNodeRef, isOver } = useDroppable({
    id: premiumGroupDropId(groupId),
    data: { groupId },
    disabled: !dropEnabled,
  })

  const title = group?.name ?? '미분류'

  return (
    <section
      ref={setNodeRef}
      className={`rounded-xl transition-colors ${
        isOver ? 'bg-violet-500/10 ring-2 ring-violet-400/40 ring-inset' : ''
      }`}
    >
      <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2 px-1">
        <span aria-hidden>{group ? '👑' : '📁'}</span>
        {title}
        <span className="text-xs font-normal text-slate-500">{characterCount}명</span>
        {dropEnabled && isOver && (
          <span className="text-xs font-normal text-violet-300 ml-auto">여기에 놓기</span>
        )}
      </h2>
      {children}
    </section>
  )
}
