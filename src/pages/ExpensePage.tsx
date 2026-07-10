import { useState } from 'react'
import type { Character, Expense, ExpenseCategory } from '../types'
import { EXPENSE_CATEGORY_LABEL } from '../lib/ledgerApi'
import { formatMesoKorean } from '../utils'
import NoCharacterPrompt, { CharacterBanner } from '../components/ledger/NoCharacterPrompt'
import MesoRecordForm from '../components/ledger/MesoRecordForm'

interface ExpensePageProps {
  selectedCharacter: Character | null
  expenses: Expense[]
  onAdd: (data: { characterId: string; category: ExpenseCategory; amount: number; memo?: string; recordDate: string }) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export default function ExpensePage({ selectedCharacter, expenses, onAdd, onRemove }: ExpensePageProps) {
  const [category, setCategory] = useState<ExpenseCategory>('other')

  if (!selectedCharacter) return <NoCharacterPrompt />

  const charExpenses = expenses.filter((e) => e.characterId === selectedCharacter.id)
  const total = charExpenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">지출</h1>
        <CharacterBanner character={selectedCharacter} />
      </div>

      <div className="panel-glow p-5">
        <p className="text-sm text-slate-400">총 지출</p>
        <p className="text-2xl font-bold text-red-400 mt-1">{formatMesoKorean(total)}</p>
        <p className="text-xs text-slate-500 mt-1">{charExpenses.length}건</p>
      </div>

      <MesoRecordForm
        amountLabel="지출 금액 (억 단위)"
        submitLabel="지출 추가"
        onSubmit={async ({ amount, recordDate, memo }) => {
          await onAdd({
            characterId: selectedCharacter.id,
            category,
            amount,
            memo: memo || undefined,
            recordDate,
          })
        }}
      >
        <div>
          <label className="text-xs text-slate-500 mb-1 block">카테고리</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className="input-field text-sm"
          >
            {(Object.keys(EXPENSE_CATEGORY_LABEL) as ExpenseCategory[]).map((key) => (
              <option key={key} value={key}>{EXPENSE_CATEGORY_LABEL[key]}</option>
            ))}
          </select>
        </div>
      </MesoRecordForm>

      <div className="panel-light p-5">
        <h2 className="font-semibold text-slate-100 mb-4">지출 내역</h2>
        {charExpenses.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">아직 지출 기록이 없어요</p>
        ) : (
          <div className="space-y-2">
            {charExpenses.map((e) => (
              <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg bg-dark-surface/50 border border-dark-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      {EXPENSE_CATEGORY_LABEL[e.category]}
                    </span>
                    <span className="text-xs text-slate-500">{e.recordDate}</span>
                  </div>
                  {e.memo && <p className="text-sm text-slate-400 mt-1 truncate">{e.memo}</p>}
                </div>
                <span className="text-sm font-semibold text-red-400 shrink-0">-{formatMesoKorean(e.amount)}</span>
                <button onClick={() => onRemove(e.id)} className="text-slate-600 hover:text-red-400 text-xs">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
