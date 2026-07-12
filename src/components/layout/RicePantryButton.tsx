import { useState } from 'react'
import type { Character, RiceRecord } from '../../types'
import { formatWon } from '../../utils'
import RicePantryPanel from './RicePantryPanel'

interface RicePantryButtonProps {
  characters: Character[]
  selectedCharacter: Character | null
  records: RiceRecord[]
  onAdd: (data: {
    characterId?: string | null
    amount: number
    description: string
    memo?: string
    recordDate: string
  }) => Promise<void>
  onRemove: (id: string) => Promise<void>
  compact?: boolean
}

export default function RicePantryButton({
  characters,
  selectedCharacter,
  records,
  onAdd,
  onRemove,
  compact = false,
}: RicePantryButtonProps) {
  const [open, setOpen] = useState(false)
  const total = records.reduce((sum, r) => sum + r.amount, 0)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? 'flex items-center gap-1.5 text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-full hover:bg-amber-500/15 transition-colors shrink-0'
            : 'flex items-center gap-2 text-sm text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg hover:bg-amber-500/15 transition-colors'
        }
        title="쌀곳간"
      >
        <span>🍚</span>
        <span className="font-medium">쌀곳간</span>
        {total > 0 && (
          <span className={`text-amber-400/80 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {formatWon(total)}
          </span>
        )}
      </button>

      <RicePantryPanel
        open={open}
        onClose={() => setOpen(false)}
        characters={characters}
        selectedCharacter={selectedCharacter}
        records={records}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    </>
  )
}
