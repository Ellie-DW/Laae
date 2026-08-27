import { useEffect, useMemo, useState } from 'react'
import type { BossSnapshot, Character, CharacterBossData, DropRecord, DropRecordInput, BossDifficulty } from '../../types'
import { formatMesoKorean } from '../../utils'
import DropChecklistSection, { type DropAddItem } from './DropChecklistSection'
import DropHistorySection from './DropHistorySection'
import DropInventorySection, { type DropSaleItem } from './DropInventorySection'
import DropRateSection from './DropRateSection'

interface DropRecordPanelProps {
  characters: Character[]
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
  embedded?: boolean
}

type DropViewMode = 'records' | 'rates'

export default function DropRecordPanel({
  characters,
  drops,
  snapshots,
  bossDataMap,
  onAdd,
  onSell,
  onUpdate,
  onRemove,
  embedded,
}: DropRecordPanelProps) {
  const [viewMode, setViewMode] = useState<DropViewMode>('records')
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
        memo: item.memo,
        recordDate: item.recordDate,
        bossId: item.bossId,
        difficulty: item.difficulty,
      })
    }
  }

  const handleSell = async (items: DropSaleItem[]) => {
    await onSell(items, filterCharacterId)
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">보스 드랍</h1>
            <p className="text-sm text-slate-500 mt-1">
              {viewMode === 'rates'
                ? filterCharacterId
                  ? `${charNameById[filterCharacterId]} · 처치 대비 드랍`
                  : '잡음 체크와 획득 기록을 비교해요'
                : filterCharacterId
                  ? `${charNameById[filterCharacterId]} · 획득·판매 기록`
                  : `${characters.length}개 캐릭터 통합 드랍 현황`}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <ViewTab active={viewMode === 'records'} onClick={() => setViewMode('records')}>
              📋 기록
            </ViewTab>
            <ViewTab active={viewMode === 'rates'} onClick={() => setViewMode('rates')}>
              📊 처치 대비
            </ViewTab>
          </div>
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

      {viewMode === 'rates' ? (
        <DropRateSection
          characters={characters}
          characterId={filterCharacterId ?? undefined}
          drops={visibleDrops}
          snapshots={snapshots}
          bossDataMap={bossDataMap}
        />
      ) : (
        <>
          <div className="panel-glow p-5 border-maple-500/20">
            <p className="text-sm text-slate-400">총 판매 수익</p>
            <p className="text-2xl font-bold text-maple-400 mt-1">{formatMesoKorean(total)}</p>
            <p className="text-xs text-slate-500 mt-1">{saleRecords.length}건 판매 기록</p>
          </div>

          <DropChecklistSection
            characters={characters}
            characterId={addCharacterId}
            bossDataMap={bossDataMap}
            onCharacterChange={setAddCharacterId}
            onAdd={handleChecklistAdd}
          />

          <DropInventorySection
            drops={visibleDrops}
            characterId={filterCharacterId}
            onSell={handleSell}
          />

          <DropHistorySection
            acquisitionRecords={acquisitionRecords}
            saleRecords={saleRecords}
            characters={characters}
            showCharacter={showCharacter}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        </>
      )}
    </div>
  )
}

function ViewTab({
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
      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
        active
          ? 'bg-cyber-500/20 border-cyber-500/40 text-cyber-300'
          : 'border-dark-border text-slate-500 hover:text-slate-300'
      }`}
    >
      {children}
    </button>
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
