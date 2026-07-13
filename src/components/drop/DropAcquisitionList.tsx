import { useMemo, useState } from 'react'
import type { Character, DropRecord } from '../../types'
import DropItemIcon from './DropItemIcon'

interface DropAcquisitionListProps {
  records: DropRecord[]
  characters: Character[]
  showCharacter: boolean
  onUpdate: (id: string, data: { recordDate?: string; memo?: string | null }) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export default function DropAcquisitionList({
  records,
  characters,
  showCharacter,
  onUpdate,
  onRemove,
}: DropAcquisitionListProps) {
  const charNameById = useMemo(
    () => Object.fromEntries(characters.map((c) => [c.id, c.name])),
    [characters]
  )

  const sorted = useMemo(
    () =>
      [...records].sort(
        (a, b) =>
          b.recordDate.localeCompare(a.recordDate) || b.createdAt.localeCompare(a.createdAt)
      ),
    [records]
  )

  return (
    <div className="panel-light p-5">
      <h2 className="font-semibold text-slate-100 mb-1">획득 내역</h2>
      <p className="text-xs text-slate-500 mb-4">날짜·메모 수정 · 삭제 가능</p>

      {sorted.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">아직 획득 기록이 없어요</p>
      ) : (
        <div className="record-list-scroll">
          {sorted.map((record) => (
            <AcquisitionListItem
              key={record.id}
              record={record}
              charName={charNameById[record.characterId] ?? '캐릭터'}
              showCharacter={showCharacter}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AcquisitionListItem({
  record,
  charName,
  showCharacter,
  onUpdate,
  onRemove,
}: {
  record: DropRecord
  charName: string
  showCharacter: boolean
  onUpdate: (id: string, data: { recordDate?: string; memo?: string | null }) => Promise<void>
  onRemove: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [recordDate, setRecordDate] = useState(record.recordDate)
  const [memo, setMemo] = useState(record.memo ?? '')
  const [saving, setSaving] = useState(false)

  const startEdit = () => {
    setRecordDate(record.recordDate)
    setMemo(record.memo ?? '')
    setEditing(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      await onUpdate(record.id, {
        recordDate,
        memo: memo.trim() || null,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-dark-surface/50 border border-dark-border">
      <DropItemIcon name={record.itemName} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-slate-200">{record.itemName}</p>
          {showCharacter && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-500/10 text-cyber-400 border border-cyber-500/20">
              {charName}
            </span>
          )}
        </div>

        {editing ? (
          <div className="mt-2 space-y-2">
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">획득일</label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="input-field text-sm w-full"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">메모 (선택)</label>
              <input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모"
                className="input-field text-sm w-full"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saving || !recordDate}
                className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 mt-0.5">
            {record.recordDate}
            {record.memo ? ` · ${record.memo}` : ''}
          </p>
        )}
      </div>

      {!editing && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={startEdit}
            className="text-xs px-2 py-1 rounded border border-dark-border text-slate-500 hover:text-cyber-400 hover:border-cyber-500/40 transition-colors"
          >
            수정
          </button>
          <button
            type="button"
            onClick={() => onRemove(record.id)}
            className="text-slate-600 hover:text-red-400 text-xs px-1"
            title="삭제"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
