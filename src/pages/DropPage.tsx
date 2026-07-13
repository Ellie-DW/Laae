import type { Character, DropRecord } from '../types'
import DropRecordPanel from '../components/drop/DropRecordPanel'
import type { DropSaleItem } from '../components/drop/DropSaleSection'

interface DropPageProps {
  characters: Character[]
  drops: DropRecord[]
  onAdd: (data: { characterId: string; itemName: string; meso: number; memo?: string; recordDate: string }) => Promise<void>
  onSell: (items: DropSaleItem[]) => Promise<void>
  onUpdate: (id: string, data: { recordDate?: string; memo?: string | null }) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export default function DropPage(props: DropPageProps) {
  return <DropRecordPanel {...props} />
}
