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
  const [deadlinePreset, setDeadlinePreset] = useState<DeadlinePreset>('d30')
  const [endDate, setEndDate] = useState(() => deadlineFromDays(30))
  const [listFilter, setListFilter] = useState<'active' | 'ended' | 'all'>('active')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (deadlinePreset === 'custom') return
    if (deadlinePreset === 'monthEnd') {
      setEndDate(getEndOfMonthYMD())
      return
    }
    const preset = DEADLINE_PRESETS.find((p) => p.id === deadlinePreset)
    if (preset?.days) setEndDate(deadlineFromDays(preset.days))
  }, [deadlinePreset])

  const accountGoals = useMemo(() => goals.filter((g) => g.characterId === null), [goals])

  const existingGoal = useMemo(
    () => accountGoals.find((g) => isGoalActive(g.startDate, g.endDate) || isGoalNotStarted(g.startDate)) ?? null,
    [accountGoals]
  )

  const visibleGoals = useMemo(() => {
    const filtered = accountGoals.filter((goal) => {
      if (listFilter === 'active') return isGoalActive(goal.startDate, goal.endDate) || isGoalNotStarted(goal.startDate)
      if (listFilter === 'ended') return isGoalEnded(goal.endDate)
      return true
    })
    return filtered.sort((a, b) => a.endDate.localeCompare(b.endDate))
  }, [accountGoals, listFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetMeso = parseMesoInput(targetInput)
    if (!title.trim() || targetMeso <= 0) return
    if (endDate < today) return

    setSaving(true)
    setFormError(null)
    try {
      await onSave({
        characterId: null,
        title: title.trim(),
        targetMeso,
        startDate: today,
        endDate,
      })
      setTitle('')
      setTargetInput('')
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '목표 저장에 실패했습니다')
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
        <p className="text-sm text-slate-500 mt-1">계정 전체 · 마감일(D-day) 기준 순수익 목표</p>
      </div>

      <form onSubmit={handleSubmit} className="panel-light p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-100">새 목표</h2>
          <p className="text-xs text-slate-500 mt-1">
            {formatGoalPeriod(today, endDate)} · {formatGoalDeadline(endDate)} · 계정 전체
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

        {existingGoal && (
          <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            진행 중인 계정 목표가 있어요. 저장하면 「{existingGoal.title}」을 덮어씁니다.
          </p>
        )}

        {formError && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {formError}
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
            <p className="text-xs text-slate-500 mt-0.5">계정 전체 · 오늘({today}) 기준</p>
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
            {visibleGoals.map((goal) => (
              <GoalProgressCard
                key={goal.id}
                goal={goal}
                progress={getGoalProgress(goal)}
                scopeLabel="계정 전체"
                onRemove={() => onRemove(goal.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
