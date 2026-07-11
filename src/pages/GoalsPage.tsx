import { useEffect, useMemo, useState } from 'react'
import type { Character, Goal } from '../types'
import type { GoalProgress } from '../lib/ledgerAnalytics'
import GoalProgressCard from '../components/goals/GoalProgressCard'
import {
  deadlineFromDays,
  formatGoalDeadline,
  formatGoalPeriod,
  getEndOfMonthYMD,
  isGoalActive,
  isGoalEnded,
  isGoalNotStarted,
} from '../lib/goalHelpers'
import { getToday, parseMesoInput } from '../utils'

interface GoalsPageProps {
  characters: Character[]
  goals: Goal[]
  getGoalProgress: (goal: Goal) => GoalProgress
  onSave: (data: {
    characterId: string | null
    title: string
    targetMeso: number
    startDate: string
    endDate: string
  }) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

type DeadlinePreset = 'd7' | 'd14' | 'd30' | 'monthEnd' | 'custom'

const DEADLINE_PRESETS: { id: DeadlinePreset; label: string; days?: number }[] = [
  { id: 'd7', label: 'D-7', days: 7 },
  { id: 'd14', label: 'D-14', days: 14 },
  { id: 'd30', label: 'D-30', days: 30 },
  { id: 'monthEnd', label: '이번 달 말' },
  { id: 'custom', label: '직접 선택' },
]

export default function GoalsPage({
  characters,
  goals,
  getGoalProgress,
  onSave,
  onRemove,
}: GoalsPageProps) {
  const today = getToday()
  const [title, setTitle] = useState('')
  const [targetInput, setTargetInput] = useState('')
  const [filterCharacterId, setFilterCharacterId] = useState<string | null>(null)
  const [scope, setScope] = useState<'account' | 'character'>('character')
  const [deadlinePreset, setDeadlinePreset] = useState<DeadlinePreset>('d30')
  const [endDate, setEndDate] = useState(() => deadlineFromDays(30))
  const [listFilter, setListFilter] = useState<'active' | 'ended' | 'all'>('active')
  const [saving, setSaving] = useState(false)

  const activeCharacter = filterCharacterId
    ? characters.find((c) => c.id === filterCharacterId) ?? null
    : null

  useEffect(() => {
    if (filterCharacterId) {
      setScope('character')
    }
  }, [filterCharacterId])

  useEffect(() => {
    if (deadlinePreset === 'custom') return
    if (deadlinePreset === 'monthEnd') {
      setEndDate(getEndOfMonthYMD())
      return
    }
    const preset = DEADLINE_PRESETS.find((p) => p.id === deadlinePreset)
    if (preset?.days) setEndDate(deadlineFromDays(preset.days))
  }, [deadlinePreset])

  const formCharacterId = filterCharacterId ?? characters[0]?.id ?? null
  const saveCharacterId = scope === 'account' ? null : formCharacterId

  const existingGoal = useMemo(
    () => goals.find((g) => g.characterId === saveCharacterId) ?? null,
    [goals, saveCharacterId]
  )

  const scopedGoals = useMemo(() => {
    return filterCharacterId
      ? goals.filter((g) => g.characterId === null || g.characterId === filterCharacterId)
      : goals
  }, [goals, filterCharacterId])

  const visibleGoals = useMemo(() => {
    const filtered = scopedGoals.filter((goal) => {
      if (listFilter === 'active') return isGoalActive(goal.startDate, goal.endDate) || isGoalNotStarted(goal.startDate)
      if (listFilter === 'ended') return isGoalEnded(goal.endDate)
      return true
    })
    return filtered.sort((a, b) => a.endDate.localeCompare(b.endDate))
  }, [scopedGoals, listFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetMeso = parseMesoInput(targetInput)
    if (!title.trim() || targetMeso <= 0) return
    if (scope === 'character' && !formCharacterId) return
    if (endDate < today) return

    setSaving(true)
    try {
      await onSave({
        characterId: saveCharacterId,
        title: title.trim(),
        targetMeso,
        startDate: today,
        endDate,
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
        <p className="text-sm text-slate-500 mt-1">마감일(D-day) 기준 순수익 목표</p>
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
        <div>
          <h2 className="font-semibold text-slate-100">새 목표</h2>
          <p className="text-xs text-slate-500 mt-1">
            {formatGoalPeriod(today, endDate)} · {formatGoalDeadline(endDate)} ·{' '}
            {activeCharacter ? activeCharacter.name : scope === 'account' ? '계정 전체' : '캐릭터'}
          </p>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">목표 이름</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 100억 모으기"
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
          <label className="text-xs text-slate-500 mb-2 block">마감일</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {DEADLINE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDeadlinePreset(preset.id)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  deadlinePreset === preset.id
                    ? 'bg-cyber-500/20 border-cyber-500/40 text-cyber-300'
                    : 'border-dark-border text-slate-500 hover:text-slate-300'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {deadlinePreset === 'custom' && (
            <input
              type="date"
              value={endDate}
              min={today}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field text-sm"
              required
            />
          )}
          {endDate < today && (
            <p className="text-xs text-red-400 mt-1">마감일은 오늘 이후로 설정해주세요</p>
          )}
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
              {activeCharacter?.name ??
                (formCharacterId ? characters.find((c) => c.id === formCharacterId)?.name : '캐릭터')}
            </button>
          </div>
        </div>

        {existingGoal && (
          <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            같은 범위 목표가 있어요. 저장하면 「{existingGoal.title}」을 덮어씁니다.
          </p>
        )}

        <button
          type="submit"
          disabled={saving || endDate < today}
          className="btn-primary text-sm w-full py-2"
        >
          {saving ? '저장 중...' : existingGoal ? '목표 수정' : '목표 설정'}
        </button>
      </form>

      <div className="panel-light p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-semibold text-slate-100">목표 현황 ({visibleGoals.length})</h2>
            <p className="text-xs text-slate-500 mt-0.5">오늘({today}) 기준</p>
          </div>
          <div className="flex gap-1">
            {(['active', 'ended', 'all'] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setListFilter(id)}
                className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                  listFilter === id
                    ? 'bg-cyber-500/20 border-cyber-500/40 text-cyber-300'
                    : 'border-dark-border text-slate-500 hover:text-slate-300'
                }`}
              >
                {id === 'active' ? '진행 중' : id === 'ended' ? '종료' : '전체'}
              </button>
            ))}
          </div>
        </div>

        {visibleGoals.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            {listFilter === 'active' ? '진행 중인 목표가 없어요' : '표시할 목표가 없어요'}
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
