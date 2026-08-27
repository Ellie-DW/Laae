import { useMemo, useState } from 'react'
import type { BossDifficulty, Character, DropRecord } from '../../types'
import { DIFFICULTY_COLORS, formatMesoKorean } from '../../utils'
import { formatDropRecordSource } from '../../lib/dropRates'
import DropAcquisitionList from './DropAcquisitionList'
import DropItemIcon from './DropItemIcon'

type HistoryTab = 'acquired' | 'sold'

interface DropHistorySectionProps {
  acquisitionRecords: DropRecord[]
  saleRecords: DropRecord[]
  characters: Character[]
  showCharacter: boolean
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

export default function DropHistorySection({
  acquisitionRecords,
  saleRecords,
  characters,
  showCharacter,
  onUpdate,
  onRemove,
}: DropHistorySectionProps) {
  const [tab, setTab] = useState<HistoryTab>('acquired')

  const charNameById = useMemo(
    () => Object.fromEntries(characters.map((c) => [c.id, c.name])),
    [characters]
  )

  const sortedSales = useMemo(
    () =>
      [...saleRecords].sort(
        (a, b) =>
          b.recordDate.localeCompare(a.recordDate) || b.createdAt.localeCompare(a.createdAt)
      ),
    [saleRecords]
  )

  return (
    <div className="panel-light p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-semibold text-slate-100">내역</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {tab === 'acquired' ? '날짜·메모 수정 · 상자 개봉 · 삭제 가능' : '판매 기록 확인 · 삭제 가능'}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <HistoryTabButton active={tab === 'acquired'} onClick={() => setTab('acquired')}>
            획득 {acquisitionRecords.length}
          </HistoryTabButton>
          <HistoryTabButton active={tab === 'sold'} onClick={() => setTab('sold')}>
            판매 {saleRecords.length}
          </HistoryTabButton>
        </div>
      </div>

      {tab === 'acquired' ? (
        <DropAcquisitionList
          records={acquisitionRecords}
          characters={characters}
          showCharacter={showCharacter}
          onUpdate={onUpdate}
          onRemove={onRemove}
          embedded
        />
      ) : sortedSales.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">아직 판매 기록이 없어요</p>
      ) : (
        <div className="record-list-scroll">
          {sortedSales.map((record) => (
            <div
              key={record.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-dark-surface/50 border border-dark-border"
            >
              <DropItemIcon name={record.itemName} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-slate-200">{record.itemName}</p>
                  {formatDropRecordSource(record) && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        record.difficulty
                          ? DIFFICULTY_COLORS[record.difficulty]
                          : 'border-dark-border text-slate-500'
                      }`}
                    >
                      {formatDropRecordSource(record)}
                    </span>
                  )}
                  {showCharacter && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-500/10 text-cyber-400 border border-cyber-500/20">
                      {charNameById[record.characterId] ?? '캐릭터'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  판매 {record.recordDate}
                  {record.memo ? ` · ${record.memo}` : ''}
                </p>
              </div>
              <span className="text-sm font-semibold text-maple-400 shrink-0">
                +{formatMesoKorean(record.meso)}
              </span>
              <button
                type="button"
                onClick={() => onRemove(record.id)}
                className="text-slate-600 hover:text-red-400 text-xs"
                title="삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryTabButton({
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
