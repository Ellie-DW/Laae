import type { Character, DropRecord } from '../types'
import DropRecordPanel from '../components/drop/DropRecordPanel'
import type { DropSaleItem } from '../components/drop/DropSaleSection'

interface DropPageProps {
  selectedCharacter: Character | null
  drops: DropRecord[]
  onAdd: (data: { characterId: string; itemName: string; meso: number; memo?: string; recordDate: string }) => Promise<void>
  onSell: (characterId: string, items: DropSaleItem[]) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export default function DropPage(props: DropPageProps) {
  return <DropRecordPanel {...props} />
}
