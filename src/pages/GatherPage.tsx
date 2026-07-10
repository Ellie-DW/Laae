import { useState } from 'react'
import type { Character, GatherRecord } from '../types'
import { formatMesoKorean } from '../utils'
import NoCharacterPrompt, { CharacterBanner } from '../components/ledger/NoCharacterPrompt'
import MesoRecordForm from '../components/ledger/MesoRecordForm'

interface GatherPageProps {
  selectedCharacter: Character | null
  gathers: GatherRecord[]
  onAdd: (data: { characterId: string; itemName: string; meso: number; memo?: string; recordDate: string }) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export default function GatherPage({ selectedCharacter, gathers, onAdd, onRemove }: GatherPageProps) {
  const [itemName, setItemName] = useState('')

  if (!selectedCharacter) return <NoCharacterPrompt />

  const charGathers = gathers.filter((g) => g.characterId === selectedCharacter.id)
  const total = charGathers.reduce((s, g) => s + g.meso, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">채집</h1>
        <CharacterBanner character={selectedCharacter} />
      </div>

      <div className="panel-glow p-5">
        <p className="text-sm text-slate-400">총 채집 수익</p>
        <p className="text-2xl font-bold text-emerald-400 mt-1">{formatMesoKorean(total)}</p>
        <p className="text-xs text-slate-500 mt-1">{charGathers.length}건</p>
      </div>

      <MesoRecordForm
        amountLabel="판매/수익 메소 (억 단위)"
        submitLabel="채집 기록 추가"
        onSubmit={async ({ amount, recordDate, memo }) => {
          if (!itemName.trim()) return
          await onAdd({
            characterId: selectedCharacter.id,
            itemName: itemName.trim(),
            meso: amount,
            memo: memo || undefined,
            recordDate,
          })
          setItemName('')
        }}
      >
        <div>
          <label className="text-xs text-slate-500 mb-1 block">채집 품목</label>
          <input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
            placeholder="예: 악에 물든 전리품, 심층광"
            className="input-field text-sm"
          />
        </div>
      </MesoRecordForm>

      <div className="panel-light p-5">
        <h2 className="font-semibold text-slate-100 mb-4">채집 기록</h2>
        {charGathers.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">아직 채집 기록이 없어요</p>
        ) : (
          <div className="space-y-2">
            {charGathers.map((g) => (
              <div key={g.id} className="flex items-center gap-3 p-3 rounded-lg bg-dark-surface/50 border border-dark-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200">{g.itemName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{g.recordDate}{g.memo ? ` · ${g.memo}` : ''}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-400 shrink-0">+{formatMesoKorean(g.meso)}</span>
                <button onClick={() => onRemove(g.id)} className="text-slate-600 hover:text-red-400 text-xs">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
