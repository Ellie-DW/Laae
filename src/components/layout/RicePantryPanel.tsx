import { useMemo, useState } from 'react'
import type { Character, RiceRecord } from '../../types'
import { formatWon, getToday, parseWonInput } from '../../utils'

interface RicePantryPanelProps {
  open: boolean
  onClose: () => void
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
}

export default function RicePantryPanel({
  open,
  onClose,
  characters,
  selectedCharacter,
  records,
  onAdd,
  onRemove,
}: RicePantryPanelProps) {
  const [description, setDescription] = useState('')
  const [characterId, setCharacterId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const total = useMemo(() => records.reduce((sum, r) => sum + r.amount, 0), [records])
  const characterNameById = useMemo(
    () => Object.fromEntries(characters.map((c) => [c.id, c.name])),
    [characters]
  )

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const amount = parseWonInput(String(fd.get('amount') ?? ''))
    const desc = description.trim()
    if (amount <= 0 || !desc) return

    setSubmitting(true)
    try {
      await onAdd({
        characterId: characterId || selectedCharacter?.id || null,
        amount,
        description: desc,
        memo: String(fd.get('memo') ?? '').trim() || undefined,
        recordDate: String(fd.get('recordDate') ?? getToday()),
      })
      setDescription('')
      form.reset()
      const dateInput = form.querySelector<HTMLInputElement>('input[name="recordDate"]')
      if (dateInput) dateInput.value = getToday()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md max-h-[85vh] flex flex-col bg-dark-surface border border-dark-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border/60 shrink-0">
          <div>
            <h2 className="font-semibold text-slate-100 flex items-center gap-2">
              <span>🍚</span> 쌀곳간
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">쌀먹 수익 기록</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-dark-panel/60"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 space-y-4">
          <div className="panel-glow p-4">
            <p className="text-sm text-slate-400">누적 쌀먹</p>
            <p className="text-2xl font-bold text-amber-300 mt-1">{formatWon(total)}</p>
            <p className="text-xs text-slate-500 mt-1">{records.length}건</p>
          </div>

          <form onSubmit={handleSubmit} className="panel-light p-4 space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">거래 내용</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="예: 주문서 판매, 메소 거래"
                className="input-field text-sm"
              />
            </div>
            {characters.length > 0 && (
              <div>
                <label className="text-xs text-slate-500 mb-1 block">캐릭터 (선택)</label>
                <select
                  value={characterId || selectedCharacter?.id || ''}
                  onChange={(e) => setCharacterId(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">전체 / 미지정</option>
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">수익 (원)</label>
              <input
                name="amount"
                required
                placeholder="예: 150000"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">날짜</label>
              <input
                name="recordDate"
                type="date"
                defaultValue={getToday()}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">메모 (선택)</label>
              <input name="memo" placeholder="메모" className="input-field text-sm" />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm w-full py-2 disabled:opacity-50"
            >
              {submitting ? '저장 중...' : '쌀먹 기록 추가'}
            </button>
          </form>

          <div className="panel-light p-4">
            <h3 className="font-semibold text-slate-100 mb-3">기록</h3>
            {records.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">아직 쌀먹 기록이 없어요</p>
            ) : (
              <div className="space-y-2">
                {records.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-dark-surface/50 border border-dark-border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{r.description}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {r.recordDate}
                        {r.characterId && characterNameById[r.characterId]
                          ? ` · ${characterNameById[r.characterId]}`
                          : ''}
                        {r.memo ? ` · ${r.memo}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-amber-300 shrink-0">
                      +{formatWon(r.amount)}
                    </span>
                    <button
                      onClick={() => onRemove(r.id)}
                      className="text-slate-600 hover:text-red-400 text-xs shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
