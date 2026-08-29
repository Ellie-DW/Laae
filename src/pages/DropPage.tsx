import type { Character, CharacterBossData, DropRecord, DropRecordInput, BossSnapshot, BossDifficulty } from '../types'
import DropRecordPanel from '../components/drop/DropRecordPanel'
import type { DropSaleItem } from '../components/drop/DropInventorySection'

interface DropPageProps {
  characters: Character[]
  selectedCharacterId?: string | null
  onSelectCharacter?: (id: string) => void
  drops: DropRecord[]
  snapshots: BossSnapshot[]
  bossDataMap: Record<string, CharacterBossData>
  onAdd: (data: DropRecordInput) => Promise<void>
  onSell: (items: DropSaleItem[], characterId?: string | null) => Promise<void>
  onUpdate: (
    id: string,
    data: {
      recordDate?: string
      memo?: string | null
      itemName?: string
      bossId?: string | null
      difficulty?: BossDifficulty | null
    }
  ) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export default function DropPage(props: DropPageProps) {
  return <DropRecordPanel {...props} />
}
