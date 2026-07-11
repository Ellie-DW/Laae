import { useMemo, useState } from 'react'
import type { Character, Expense, ExpenseCategory, HuntRecord } from '../types'
import { EXPENSE_CATEGORY_LABEL } from '../lib/ledgerApi'
import { computeExpenseByCategory, computeExpenseTotal } from '../lib/ledgerAnalytics'
import { getHeldSolErdaFragments, isSolErdaSpend, isSolErdaPurchaseExpense, parseSolErdaPurchaseMemo } from '../lib/huntStats'
import { formatMesoKorean, getCurrentMonth, getWeeklyPeriod } from '../utils'
import MesoRecordForm from '../components/ledger/MesoRecordForm'
import SolErdaFragmentSection from '../components/hunt/SolErdaFragmentSection'

interface ExpensePageProps {
  characters: Character[]
  expenses: Expense[]
  hunts: HuntRecord[]
  onAdd: (data: { characterId: string; category: ExpenseCategory; amount: number; memo?: string; recordDate: string }) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onSpendSolErda: (data: { characterId: string; quantity: number; recordDate: string }) => Promise<void>
  onPurchaseSolErda: (data: { characterId: string; quantity: number; amount: number; recordDate: string }) => Promise<void>
  onRemoveSolErdaPurchase: (expenseId: string, memo: string | null) => Promise<void>
  onRemoveHunt: (id: string) => Promise<void>
}

export default function ExpensePage({
  characters,
  expenses,
  hunts,
  onAdd,
  onRemove,
  onSpendSolErda,
  onPurchaseSolErda,
  onRemoveSolErdaPurchase,
  onRemoveHunt,
}: ExpensePageProps) {
  const [filterCharacterId, setFilterCharacterId] = useState<string | null>(null)
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [formCharacterId, setFormCharacterId] = useState<string>('')

  const currentMonth = getCurrentMonth()
  const weekPeriod = getWeeklyPeriod()
  const expenseFilter = { characterId: filterCharacterId ?? undefined }

  const weekExpense = useMemo(
    () => computeExpenseTotal(expenses, { ...expenseFilter, startDate: weekPeriod.start, endDate: weekPeriod.end }),
    [expenses, filterCharacterId, weekPeriod.start, weekPeriod.end]
  )

  const monthExpense = useMemo(
    () => computeExpenseTotal(expenses, { ...expenseFilter, month: currentMonth }),
    [expenses, filterCharacterId, currentMonth]
  )

  const allTimeExpense = useMemo(
    () => computeExpenseTotal(expenses, expenseFilter),
    [expenses, filterCharacterId]
  )

  const charNameById = useMemo(
    () => Object.fromEntries(characters.map((c) => [c.id, c.name])),
    [characters]
  )

  const activeCharacter = filterCharacterId
    ? characters.find((c) => c.id === filterCharacterId) ?? null
    : null

  const visibleExpenses = useMemo(() => {
    const filtered = filterCharacterId
      ? expenses.filter((e) => e.characterId === filterCharacterId)
      : expenses
    return [...filtered].sort((a, b) =>
      b.recordDate.localeCompare(a.recordDate) || b.createdAt.localeCompare(a.createdAt)
    )
  }, [expenses, filterCharacterId])

  const showCharacter = filterCharacterId === null

  const categoryBreakdown = useMemo(
    () =>
      computeExpenseByCategory(expenses, {
        characterId: filterCharacterId ?? undefined,
        month: currentMonth,
      }).filter((c) => c.amount > 0),
    [expenses, filterCharacterId, currentMonth]
  )

  const monthTotal = monthExpense.total

  const addCharacterId = formCharacterId || filterCharacterId || characters[0]?.id || ''

  const heldSolErda = useMemo(() => getHeldSolErdaFragments(hunts), [hunts])

  const solErdaSpends = useMemo(() => {
    const filtered = hunts.filter((h) => {
      if (!isSolErdaSpend(h)) return false
      if (filterCharacterId && h.characterId !== filterCharacterId) return false
      return true
    })
    return [...filtered].sort((a, b) =>
      b.recordDate.localeCompare(a.recordDate) || b.createdAt.localeCompare(a.createdAt)
    )
  }, [hunts, filterCharacterId])

  const spentSolErdaTotal = solErdaSpends.reduce((s, h) => s + Math.abs(h.solErdaFragments), 0)

  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">💸</span>
        <h2 className="text-lg font-semibold text-slate-300">캐릭터를 먼저 추가해주세요</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">지출</h1>
        <p className="text-sm text-slate-500 mt-1">
          {activeCharacter
            ? `${activeCharacter.name} · 지출 기록`
            : `${characters.length}개 캐릭터 통합 지출 현황`}
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

      <div className="panel-glow p-5 border-red-500/10 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ExpenseSummaryChip
            label="이번 주 지출"
            sub={weekPeriod.label}
            amount={weekExpense.total}
            count={weekExpense.count}
          />
          <ExpenseSummaryChip
            label="이번 달 지출"
            sub={currentMonth}
            amount={monthExpense.total}
            count={monthExpense.count}
            highlight
          />
          <ExpenseSummaryChip
            label={filterCharacterId ? '누적 지출' : '누적 총 지출'}
            sub="전 기간"
            amount={allTimeExpense.total}
            count={allTimeExpense.count}
          />
        </div>
        {heldSolErda > 0 && (
          <p className="text-xs text-violet-400 pt-1 border-t border-dark-border/60">
            전체 보유 솔 에르다 {heldSolErda.toLocaleString()}개
          </p>
        )}
      </div>

      {categoryBreakdown.some((c) => c.amount > 0) && (
        <div className="panel-light p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-100">{currentMonth} 카테고리별</h2>
              <p className="text-xs text-slate-500 mt-0.5">이번 달 지출 분류</p>
            </div>
            <span className="text-sm font-bold text-red-400">{formatMesoKorean(monthTotal)}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categoryBreakdown.map((item) => (
              <div
                key={item.category}
                className="px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/15"
              >
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="text-sm font-bold text-red-400 mt-0.5">{formatMesoKorean(item.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <MesoRecordForm
        amountLabel="지출 금액 (억 단위)"
        submitLabel="지출 추가"
        onSubmit={async ({ amount, recordDate, memo }) => {
          if (!addCharacterId) return
          await onAdd({
            characterId: addCharacterId,
            category,
            amount,
            memo: memo || undefined,
            recordDate,
          })
        }}
      >
        {!filterCharacterId && (
          <div>
            <label className="text-xs text-slate-500 mb-1 block">캐릭터</label>
            <select
              value={addCharacterId}
              onChange={(e) => setFormCharacterId(e.target.value)}
              className="input-field text-sm"
            >
              {characters.map((char) => (
                <option key={char.id} value={char.id}>{char.name}</option>
              ))}
            </select>
          </div>
        )}
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

      <SolErdaFragmentSection
        hunts={hunts}
        characters={characters}
        recordCharacterId={addCharacterId}
        onRecordCharacterChange={setFormCharacterId}
        showCharacterSelect={!filterCharacterId}
        onPurchase={onPurchaseSolErda}
        onSpend={onSpendSolErda}
      />

      {solErdaSpends.length > 0 && (
        <div className="panel-light p-5 border-violet-500/15">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-100">솔 에르다 조각 사용 내역</h2>
              <p className="text-xs text-slate-500 mt-0.5">총 {spentSolErdaTotal.toLocaleString()}개 사용</p>
            </div>
          </div>
          <div className="space-y-2">
            {solErdaSpends.map((h) => (
              <div key={h.id} className="flex items-center gap-3 p-3 rounded-lg bg-dark-surface/50 border border-dark-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      솔 에르다 사용
                    </span>
                    {showCharacter && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-500/10 text-cyber-400 border border-cyber-500/20">
                        {charNameById[h.characterId] ?? '캐릭터'}
                      </span>
                    )}
                    <span className="text-xs text-slate-500">{h.recordDate}</span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-violet-400 shrink-0">
                  -{Math.abs(h.solErdaFragments).toLocaleString()}개
                </span>
                <button onClick={() => onRemoveHunt(h.id)} className="text-slate-600 hover:text-red-400 text-xs">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel-light p-5">
        <h2 className="font-semibold text-slate-100 mb-4">지출 내역</h2>
        {visibleExpenses.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">아직 지출 기록이 없어요</p>
        ) : (
          <div className="space-y-2">
            {visibleExpenses.map((e) => (
              <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg bg-dark-surface/50 border border-dark-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      {EXPENSE_CATEGORY_LABEL[e.category]}
                    </span>
                    {showCharacter && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-500/10 text-cyber-400 border border-cyber-500/20">
                        {charNameById[e.characterId] ?? '캐릭터'}
                      </span>
                    )}
                    <span className="text-xs text-slate-500">{e.recordDate}</span>
                  </div>
                  {e.memo && (
                    <p className="text-sm text-slate-400 mt-1 truncate">
                      {parseSolErdaPurchaseMemo(e.memo)?.displayMemo ?? e.memo}
                    </p>
                  )}
                </div>
                <span className="text-sm font-semibold text-red-400 shrink-0">-{formatMesoKorean(e.amount)}</span>
                <button
                  onClick={() =>
                    isSolErdaPurchaseExpense(e.memo)
                      ? onRemoveSolErdaPurchase(e.id, e.memo)
                      : onRemove(e.id)
                  }
                  className="text-slate-600 hover:text-red-400 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ExpenseSummaryChip({
  label,
  sub,
  amount,
  count,
  highlight = false,
}: {
  label: string
  sub: string
  amount: number
  count: number
  highlight?: boolean
}) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border ${
        highlight
          ? 'bg-red-500/10 border-red-500/25'
          : 'bg-dark-surface/50 border-dark-border'
      }`}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>
      <p className={`text-xl font-bold mt-1 ${highlight ? 'text-red-400' : 'text-red-400/90'}`}>
        {formatMesoKorean(amount)}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{count}건</p>
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
