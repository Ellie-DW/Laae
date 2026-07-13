import { useEffect, useMemo, useState } from 'react'
import type { Character, DropRecord } from '../../types'
import { formatMesoKorean } from '../../utils'
import DropAcquisitionList from './DropAcquisitionList'
import DropAcquisitionSummary from './DropAcquisitionSummary'
import DropChecklistSection, { type DropAddItem } from './DropChecklistSection'
import DropSaleSection, { type DropSaleItem } from './DropSaleSection'
import DropItemIcon from './DropItemIcon'

interface DropRecordPanelProps {
  characters: Character[]
  drops: DropRecord[]
  onAdd: (data: { characterId: string; itemName: string; meso: number; memo?: string; recordDate: string }) => Promise<void>
  onSell: (items: DropSaleItem[]) => Promise<void>
  onUpdate: (id: string, data: { recordDate?: string; memo?: string | null }) => Promise<void>
  onRemove: (id: string) => Promise<void>
  embedded?: boolean
}

export default function DropRecordPanel({
  characters,
  drops,
  onAdd,
  onSell,
  onUpdate,
  onRemove,
  embedded,
}: DropRecordPanelProps) {
  const [filterCharacterId, setFilterCharacterId] = useState<string | null>(null)
  const [addCharacterId, setAddCharacterId] = useState(() => characters[0]?.id ?? '')

  useEffect(() => {
    if (characters.length === 0) {
      setAddCharacterId('')
      return
    }
    if (!characters.some((c) => c.id === addCharacterId)) {
      setAddCharacterId(characters[0].id)
    }
  }, [characters, addCharacterId])

  useEffect(() => {
    if (filterCharacterId) setAddCharacterId(filterCharacterId)
  }, [filterCharacterId])

  const charNameById = useMemo(
    () => Object.fromEntries(characters.map((c) => [c.id, c.name])),
    [characters]
  )

  const visibleDrops = useMemo(
    () => (filterCharacterId ? drops.filter((d) => d.characterId === filterCharacterId) : drops),
    [drops, filterCharacterId]
  )

  const acquisitionRecords = useMemo(
    () => visibleDrops.filter((d) => d.meso === 0),
    [visibleDrops]
  )

  const saleRecords = visibleDrops.filter((d) => d.meso > 0)
  const total = saleRecords.reduce((s, d) => s + d.meso, 0)
  const showCharacter = filterCharacterId === null

  const handleChecklistAdd = async (items: DropAddItem[]) => {
    if (!addCharacterId) return
    for (const item of items) {
      await onAdd({
        characterId: addCharacterId,
        itemName: item.itemName,
        meso: 0,
        recordDate: item.recordDate,
      })
    }
  }

  const handleSell = async (items: DropSaleItem[]) => {
    await onSell(items)
  }

  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">💎</span>
        <h2 className="text-lg font-semibold text-slate-300">캐릭터를 먼저 추가해주세요</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="text-2xl font-bold text-slate-100">보스 드랍</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filterCharacterId
              ? `${charNameById[filterCharacterId]} · 획득·판매 기록`
              : `${characters.length}개 캐릭터 통합 드랍 현황`}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <ScopeButton active={filterCharacterId === null} onClick={() => setFilterCharacterId(null)}>
          전체 캐릭터
        </ScopeButton>
        {characters.map((char) => (
          <ScopeButton
            key={char.id}
            active={filterCharacterId === char.id}
            onClick={() => setFilterCharacterId(char.id)}
          >
            {char.name}
          </ScopeButton>
        ))}
      </div>

      <div className="panel-glow p-5 border-maple-500/20">
        <p className="text-sm text-slate-400">총 판매 수익</p>
        <p className="text-2xl font-bold text-maple-400 mt-1">{formatMesoKorean(total)}</p>
        <p className="text-xs text-slate-500 mt-1">{saleRecords.length}건 판매 기록</p>
      </div>

      <DropChecklistSection
        characters={characters}
        characterId={addCharacterId}
        onCharacterChange={setAddCharacterId}
        onAdd={handleChecklistAdd}
      />

      <DropAcquisitionList
        records={acquisitionRecords}
        characters={characters}
        showCharacter={showCharacter}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />

      <DropAcquisitionSummary drops={visibleDrops} characterId={filterCharacterId ?? undefined} />

      <DropSaleSection drops={drops} onSell={handleSell} />

      <div className="panel-light p-5">
        <h2 className="font-semibold text-slate-100 mb-4">판매 내역</h2>
        {saleRecords.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">아직 판매 기록이 없어요</p>
        ) : (
          <div className="record-list-scroll">
            {saleRecords.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-dark-surface/50 border border-dark-border">
                <DropItemIcon name={d.itemName} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-200">{d.itemName}</p>
                    {showCharacter && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-500/10 text-cyber-400 border border-cyber-500/20">
                        {charNameById[d.characterId] ?? '캐릭터'}
                      </span>
                    )}
                  </div>
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

function ScopeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
        active
          ? 'bg-cyber-500/20 border-cyber-500/40 text-cyber-300'
          : 'border-dark-border text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  )
}
