import { useState } from 'react'
import type { Character, Goal } from '../types'
import type { GoalProgress } from '../lib/ledgerAnalytics'
import { formatMesoKorean, parseMesoInput } from '../utils'

interface GoalsPageProps {
  characters: Character[]
  selectedCharacter: Character | null
  goals: Goal[]
  currentMonth: string
  getGoalProgress: (goal: Goal) => GoalProgress
  onSave: (data: { characterId: string | null; title: string; targetMeso: number; periodMonth: string }) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export default function GoalsPage({
  characters,
  selectedCharacter,
  goals,
  currentMonth,
  getGoalProgress,
  onSave,
  onRemove,
}: GoalsPageProps) {
  const [title, setTitle] = useState('')
  const [targetInput, setTargetInput] = useState('')
  const [scope, setScope] = useState<'account' | 'character'>('character')
  const [saving, setSaving] = useState(false)

  const monthGoals = goals.filter((g) => g.periodMonth === currentMonth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetMeso = parseMesoInput(targetInput)
    if (!title.trim() || targetMeso <= 0) return
    if (scope === 'character' && !selectedCharacter) return

    setSaving(true)
    try {
      await onSave({
        characterId: scope === 'account' ? null : selectedCharacter!.id,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">목표</h1>
        <p className="text-sm text-slate-500 mt-1">{currentMonth} 순수익 목표 (사냥·채집·보스−지출)</p>
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
              className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
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
              disabled={!selectedCharacter}
              className={`flex-1 py-2 rounded-lg text-sm border transition-colors disabled:opacity-40 ${
                scope === 'character'
                  ? 'bg-cyber-500/20 border-cyber-500/40 text-cyber-300'
                  : 'border-dark-border text-slate-400 hover:text-slate-200'
              }`}
            >
              {selectedCharacter ? selectedCharacter.name : '캐릭터 선택 필요'}
            </button>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary text-sm w-full py-2">
          {saving ? '저장 중...' : '목표 설정'}
        </button>
      </form>

      <div className="panel-light p-5">
        <h2 className="font-semibold text-slate-100 mb-4">이번 달 목표 ({monthGoals.length})</h2>

        {monthGoals.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">설정된 목표가 없어요</p>
        ) : (
          <div className="space-y-4">
            {monthGoals.map((goal) => {
              const progress = getGoalProgress(goal)
              const charName = goal.characterId
                ? characters.find((c) => c.id === goal.characterId)?.name
                : '계정 전체'

              return (
                <div key={goal.id} className="p-4 rounded-lg bg-dark-surface/50 border border-dark-border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-200">{goal.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{charName}</p>
                    </div>
                    <button
                      onClick={() => onRemove(goal.id)}
                      className="text-slate-600 hover:text-red-400 text-xs shrink-0"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-lg font-bold text-maple-400">{formatMesoKorean(progress.current)}</p>
                      <p className="text-xs text-slate-500">/ {formatMesoKorean(goal.targetMeso)}</p>
                    </div>
                    <span className={`text-sm font-semibold ${progress.percent >= 100 ? 'text-emerald-400' : 'text-cyber-400'}`}>
                      {progress.percent}%
                    </span>
                  </div>

                  <div className="mt-2 h-2 bg-dark-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        progress.percent >= 100
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                          : 'bg-gradient-to-r from-cyber-600 to-maple-500'
                      }`}
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                    <span>사냥 +{formatMesoKorean(progress.summary.huntMesoIncome)}</span>
                    {progress.summary.solErdaSaleIncome > 0 && (
                      <span>솔에르다 +{formatMesoKorean(progress.summary.solErdaSaleIncome)}</span>
                    )}
                    <span>채집 +{formatMesoKorean(progress.summary.gatherIncome)}</span>
                    <span>드랍 +{formatMesoKorean(progress.summary.dropIncome)}</span>
                    <span className="text-maple-400">보스 +{formatMesoKorean(progress.summary.bossIncome)}</span>
                    <span>지출 -{formatMesoKorean(progress.summary.expenseTotal)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
