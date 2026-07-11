import { useEffect, useState } from 'react'
import type { Character, Goal } from '../types'
import type { GoalProgress } from '../lib/ledgerAnalytics'
import GoalProgressCard from '../components/goals/GoalProgressCard'
import { parseMesoInput } from '../utils'

interface GoalsPageProps {
  characters: Character[]
  goals: Goal[]
  currentMonth: string
  getGoalProgress: (goal: Goal) => GoalProgress
  onSave: (data: { characterId: string | null; title: string; targetMeso: number; periodMonth: string }) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export default function GoalsPage({
  characters,
  goals,
  currentMonth,
  getGoalProgress,
  onSave,
  onRemove,
}: GoalsPageProps) {
  const [title, setTitle] = useState('')
  const [targetInput, setTargetInput] = useState('')
  const [filterCharacterId, setFilterCharacterId] = useState<string | null>(null)
  const [scope, setScope] = useState<'account' | 'character'>('character')
  const [saving, setSaving] = useState(false)

  const activeCharacter = filterCharacterId
    ? characters.find((c) => c.id === filterCharacterId) ?? null
    : null

  useEffect(() => {
    if (filterCharacterId) {
      setScope('character')
    }
  }, [filterCharacterId])

  const monthGoals = goals.filter((g) => g.periodMonth === currentMonth)
  const visibleGoals = filterCharacterId
    ? monthGoals.filter((g) => g.characterId === null || g.characterId === filterCharacterId)
    : monthGoals

  const formCharacterId = filterCharacterId ?? characters[0]?.id ?? null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetMeso = parseMesoInput(targetInput)
    if (!title.trim() || targetMeso <= 0) return
    if (scope === 'character' && !formCharacterId) return

    setSaving(true)
    try {
      await onSave({
        characterId: scope === 'account' ? null : formCharacterId,
        title: title.trim(),
        targetMeso,
        periodMonth: currentMonth,
      })
      setTitle('')
      setTargetInput('')
    } finally {
      setSaving(false)
    }
  }

  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">🎯</span>
        <h2 className="text-lg font-semibold text-slate-300">캐릭터를 먼저 추가해주세요</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">목표</h1>
        <p className="text-sm text-slate-500 mt-1">
          {activeCharacter
            ? `${activeCharacter.name} · ${currentMonth} 순수익 목표`
            : `${currentMonth} 순수익 목표 (사냥·채집·보스−지출)`}
        </p>
      </div>

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

      <form onSubmit={handleSubmit} className="panel-light p-5 space-y-4">
        <h2 className="font-semibold text-slate-100">새 목표</h2>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">목표 이름</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 이번 달 100억 모으기"
            className="input-field text-sm"
            required
          />
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">목표 금액 (억 단위)</label>
          <input
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder="예: 10, 0.5, 1.5억"
            className="input-field text-sm"
            required
          />
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-2 block">범위</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setScope('account')}
              disabled={!!filterCharacterId}
              className={`flex-1 py-2 rounded-lg text-sm border transition-colors disabled:opacity-40 ${
                scope === 'account'
                  ? 'bg-cyber-500/20 border-cyber-500/40 text-cyber-300'
                  : 'border-dark-border text-slate-400 hover:text-slate-200'
              }`}
            >
              계정 전체
            </button>
            <button
              type="button"
              onClick={() => setScope('character')}
              className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                scope === 'character'
                  ? 'bg-cyber-500/20 border-cyber-500/40 text-cyber-300'
                  : 'border-dark-border text-slate-400 hover:text-slate-200'
              }`}
            >
              {activeCharacter?.name ?? formCharacterId
                ? characters.find((c) => c.id === formCharacterId)?.name ?? '캐릭터'
                : '캐릭터'}
            </button>
          </div>
          {filterCharacterId && (
            <p className="text-xs text-slate-600 mt-1.5">캐릭터 필터 중에는 해당 캐릭터 목표만 설정할 수 있어요</p>
          )}
        </div>

        <button type="submit" disabled={saving} className="btn-primary text-sm w-full py-2">
          {saving ? '저장 중...' : '목표 설정'}
        </button>
      </form>

      <div className="panel-light p-5">
        <h2 className="font-semibold text-slate-100 mb-4">
          이번 달 목표 ({visibleGoals.length})
        </h2>

        {visibleGoals.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            {filterCharacterId ? '이 캐릭터에 설정된 목표가 없어요' : '설정된 목표가 없어요'}
          </p>
        ) : (
          <div className="space-y-4">
            {visibleGoals.map((goal) => {
              const progress = getGoalProgress(goal)
              const charName = goal.characterId
                ? characters.find((c) => c.id === goal.characterId)?.name
                : '계정 전체'

              return (
                <GoalProgressCard
                  key={goal.id}
                  goal={goal}
                  progress={progress}
                  scopeLabel={charName ?? '계정 전체'}
                  onRemove={() => onRemove(goal.id)}
                />
              )
            })}
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
