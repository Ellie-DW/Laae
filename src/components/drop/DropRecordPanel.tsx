import type { Character, DropRecord } from '../../types'
import { formatMesoKorean } from '../../utils'
import NoCharacterPrompt, { CharacterBanner } from '../ledger/NoCharacterPrompt'
import DropAcquisitionSummary from './DropAcquisitionSummary'
import DropAcquisitionHistory from './DropAcquisitionHistory'
import DropChecklistSection, { type DropAddItem } from './DropChecklistSection'
import DropSaleSection, { type DropSaleItem } from './DropSaleSection'

interface DropRecordPanelProps {
  selectedCharacter: Character | null
  drops: DropRecord[]
  onAdd: (data: { characterId: string; itemName: string; meso: number; memo?: string; recordDate: string }) => Promise<void>
  onSell: (characterId: string, items: DropSaleItem[]) => Promise<void>
  onRemove: (id: string) => Promise<void>
  embedded?: boolean
}

export default function DropRecordPanel({
  selectedCharacter,
  drops,
  onAdd,
  onSell,
  onRemove,
  embedded,
}: DropRecordPanelProps) {
  if (!selectedCharacter) return <NoCharacterPrompt />

  const charDrops = drops.filter((d) => d.characterId === selectedCharacter.id)
  const saleRecords = charDrops.filter((d) => d.meso > 0)
  const total = saleRecords.reduce((s, d) => s + d.meso, 0)

  const handleChecklistAdd = async (items: DropAddItem[]) => {
    for (const item of items) {
      await onAdd({
        characterId: selectedCharacter.id,
        itemName: item.itemName,
        meso: 0,
        recordDate: item.recordDate,
      })
    }
  }

  const handleSell = async (items: DropSaleItem[]) => {
    await onSell(selectedCharacter.id, items)
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="text-2xl font-bold text-slate-100">보스 드랍</h1>
          <CharacterBanner character={selectedCharacter} />
        </div>
      )}

      <div className="panel-glow p-5 border-maple-500/20">
        <p className="text-sm text-slate-400">총 판매 수익</p>
        <p className="text-2xl font-bold text-maple-400 mt-1">{formatMesoKorean(total)}</p>
        <p className="text-xs text-slate-500 mt-1">{saleRecords.length}건 판매 기록</p>
      </div>

      <DropAcquisitionHistory drops={charDrops} characterId={selectedCharacter.id} />

      <DropAcquisitionSummary drops={charDrops} characterId={selectedCharacter.id} />

      <DropChecklistSection onAdd={handleChecklistAdd} />

      <DropSaleSection drops={charDrops} characterId={selectedCharacter.id} onSell={handleSell} />

      <div className="panel-light p-5">
        <h2 className="font-semibold text-slate-100 mb-4">판매 내역</h2>
        {saleRecords.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">아직 판매 기록이 없어요</p>
        ) : (
          <div className="space-y-2">
            {saleRecords.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-dark-surface/50 border border-dark-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200">{d.itemName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">판매 {d.recordDate}{d.memo ? ` · ${d.memo}` : ''}</p>
                </div>
                <span className="text-sm font-semibold text-maple-400 shrink-0">+{formatMesoKorean(d.meso)}</span>
                <button onClick={() => onRemove(d.id)} className="text-slate-600 hover:text-red-400 text-xs">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
