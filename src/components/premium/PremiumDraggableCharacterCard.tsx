import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Character } from '../../types'
import type { LedgerSummary } from '../../lib/ledgerAnalytics'
import type { PremiumCharacterGroup } from '../../lib/premiumGroupsApi'
import PremiumCharacterCard from './PremiumCharacterCard'

export const premiumCharacterDragId = (characterId: string) => `char:${characterId}`

export function parsePremiumCharacterDragId(id: string | number): string | null {
  const value = String(id)
  return value.startsWith('char:') ? value.slice(5) : null
}

interface PremiumDraggableCharacterCardProps {
  character: Character
  summary?: LedgerSummary
  groups?: PremiumCharacterGroup[]
  onGroupChange?: (groupId: string | null) => void
  onClick?: () => void
  dragEnabled?: boolean
}

export default function PremiumDraggableCharacterCard({
  character,
  dragEnabled = true,
  ...props
}: PremiumDraggableCharacterCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: premiumCharacterDragId(character.id),
    data: { characterId: character.id },
    disabled: !dragEnabled,
  })

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 20 : undefined,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`touch-none ${isDragging ? 'opacity-40' : ''} ${dragEnabled ? 'cursor-grab active:cursor-grabbing' : ''}`}
      {...(dragEnabled ? { ...attributes, ...listeners } : {})}
    >
      <PremiumCharacterCard character={character} {...props} />
    </div>
  )
}
