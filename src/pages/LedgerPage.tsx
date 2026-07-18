import { useMemo, useState } from 'react'
import type { Character, Expense, ExpenseCategory, HuntRecord, Income, IncomeCategory } from '../types'
import { EXPENSE_CATEGORY_LABEL, INCOME_CATEGORY_LABEL } from '../lib/ledgerApi'
import {
  computeExpenseByCategory,
  computeExpenseTotal,
  computeIncomeByCategory,
  computeIncomeTotal,
} from '../lib/ledgerAnalytics'
import { getHeldSolErdaFragments, isSolErdaSpend, isSolErdaPurchaseExpense, parseSolErdaPurchaseMemo } from '../lib/huntStats'
import { formatMesoKorean, getCurrentMonth, getWeeklyPeriod } from '../utils'
import MesoRecordForm from '../components/ledger/MesoRecordForm'
import IncomeRecordSection from '../components/ledger/IncomeRecordSection'
import SolErdaFragmentSection from '../components/hunt/SolErdaFragmentSection'
import SolErdaIcon from '../components/hunt/SolErdaIcon'

type LedgerTab = 'income' | 'expense'

const LEDGER_TABS: { id: LedgerTab; label: string }[] = [
  { id: 'income', label: '수입' },
  { id: 'expense', label: '지출' },
]

interface LedgerPageProps {
  characters: Character[]
  incomes: Income[]
  expenses: Expense[]
  hunts: HuntRecord[]
  onAddIncome: (data: { characterId: string; category: IncomeCategory; amount: number; memo?: string; recordDate: string }) => Promise<void>
  onSaveIncomeMemo: (id: string, memo: string | null) => Promise<void>
  onRemoveIncome: (id: string) => Promise<void>
  onAddExpense: (data: { characterId: string; category: ExpenseCategory; amount: number; memo?: string; recordDate: string }) => Promise<void>
  onSaveExpenseMemo: (id: string, memo: string | null) => Promise<void>
  onRemoveExpense: (id: string) => Promise<void>
  onSpendSolErda: (data: { characterId: string; quantity: number; recordDate: string }) => Promise<void>
  onPurchaseSolErda: (data: { characterId: string; quantity: number; amount: number; recordDate: string }) => Promise<void>
  onRemoveSolErdaPurchase: (expenseId: string, memo: string | null) => Promise<void>
  onRemoveHunt: (id: string) => Promise<void>
}

export default function LedgerPage({
  characters,
  incomes,
  expenses,
  hunts,
  onAddIncome,
  onSaveIncomeMemo,
  onRemoveIncome,
  onAddExpense,
  onSaveExpenseMemo,
  onRemoveExpense,
  onSpendSolErda,
  onPurchaseSolErda,
  onRemoveSolErdaPurchase,
  onRemoveHunt,
}: LedgerPageProps) {
  const [activeTab, setActiveTab] = useState<LedgerTab>('expense')
  const [filterCharacterId, setFilterCharacterId] = useState<string | null>(null)
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('other')
  const [formCharacterId, setFormCharacterId] = useState<string>('')

  const currentMonth = getCurrentMonth()
  const weekPeriod = getWeeklyPeriod()
  const recordFilter = { characterId: filterCharacterId ?? undefined }

  const weekIncome = useMemo(
    () => computeIncomeTotal(incomes, { ...recordFilter, startDate: weekPeriod.start, endDate: weekPeriod.end }),
    [incomes, filterCharacterId, weekPeriod.start, weekPeriod.end]
  )
  const monthIncome = useMemo(
    () => computeIncomeTotal(incomes, { ...recordFilter, month: currentMonth }),
    [incomes, filterCharacterId, currentMonth]
  )
  const allTimeIncome = useMemo(
    () => computeIncomeTotal(incomes, recordFilter),
    [incomes, filterCharacterId]
  )

  const weekExpense = useMemo(
    () => computeExpenseTotal(expenses, { ...recordFilter, startDate: weekPeriod.start, endDate: weekPeriod.end }),
    [expenses, filterCharacterId, weekPeriod.start, weekPeriod.end]
  )
  const monthExpense = useMemo(
    () => computeExpenseTotal(expenses, { ...recordFilter, month: currentMonth }),
    [expenses, filterCharacterId, currentMonth]
  )
  const allTimeExpense = useMemo(
    () => computeExpenseTotal(expenses, recordFilter),
    [expenses, filterCharacterId]
  )

  const charNameById = useMemo(
    () => Object.fromEntries(characters.map((c) => [c.id, c.name])),
    [characters]
  )

  const activeCharacter = filterCharacterId
    ? characters.find((c) => c.id === filterCharacterId) ?? null
    : null

  const visibleIncomes = useMemo(() => {
    const filtered = filterCharacterId
      ? incomes.filter((i) => i.characterId === filterCharacterId)
      : incomes
    return [...filtered].sort((a, b) =>
      b.recordDate.localeCompare(a.recordDate) || b.createdAt.localeCompare(a.createdAt)
    )
  }, [incomes, filterCharacterId])

  const visibleExpenses = useMemo(() => {
    const filtered = filterCharacterId
      ? expenses.filter((e) => e.characterId === filterCharacterId)
      : expenses
    return [...filtered].sort((a, b) =>
      b.recordDate.localeCompare(a.recordDate) || b.createdAt.localeCompare(a.createdAt)
    )
  }, [expenses, filterCharacterId])

  const showCharacter = filterCharacterId === null

  const incomeCategoryBreakdown = useMemo(
    () =>
      computeIncomeByCategory(incomes, {
        characterId: filterCharacterId ?? undefined,
        month: currentMonth,
      }).filter((c) => c.amount > 0),
    [incomes, filterCharacterId, currentMonth]
  )

  const expenseCategoryBreakdown = useMemo(
    () =>
      computeExpenseByCategory(expenses, {
        characterId: filterCharacterId ?? undefined,
        month: currentMonth,
      }).filter((c) => c.amount > 0),
    [expenses, filterCharacterId, currentMonth]
  )

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
        <span className="text-5xl mb-4">📒</span>
        <h2 className="text-lg font-semibold text-slate-300">캐릭터를 먼저 추가해주세요</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">장부</h1>
        <p className="text-sm text-slate-500 mt-1">
          {activeCharacter
            ? `${activeCharacter.name} · ${activeTab === 'income' ? '수입' : '지출'} 기록`
            : `${characters.length}개 캐릭터 통합 ${activeTab === 'income' ? '수입' : '지출'} 현황`}
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

      <div className="flex gap-2 overflow-x-auto pb-1">
        {LEDGER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.id
                ? tab.id === 'income'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-neon-sm'
                  : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-neon-sm'
                : 'bg-dark-panel/60 text-slate-400 border border-dark-border hover:border-cyber-700/40 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'income' ? (
        <>
          <div className="panel-glow p-5 border-emerald-500/10 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SummaryChip
                label="이번 주 수입"
                sub={weekPeriod.label}
                amount={weekIncome.total}
                count={weekIncome.count}
                tone="income"
              />
              <SummaryChip
                label="이번 달 수입"
                sub={currentMonth}
                amount={monthIncome.total}
                count={monthIncome.count}
                tone="income"
                highlight
              />
              <SummaryChip
                label={filterCharacterId ? '누적 수입' : '누적 총 수입'}
                sub="전 기간"
                amount={allTimeIncome.total}
                count={allTimeIncome.count}
                tone="income"
              />
            </div>
          </div>

          {incomeCategoryBreakdown.length > 0 && (
            <div className="panel-light p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-slate-100">{currentMonth} 카테고리별</h2>
                  <p className="text-xs text-slate-500 mt-0.5">이번 달 수입 분류</p>
                </div>
                <span className="text-sm font-bold text-emerald-400">{formatMesoKorean(monthIncome.total)}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {incomeCategoryBreakdown.map((item) => (
                  <div
                    key={item.category}
                    className="px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15"
                  >
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">{formatMesoKorean(item.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <IncomeRecordSection
            characters={characters}
            characterId={addCharacterId}
            showCharacterSelect={!filterCharacterId}
            onCharacterChange={setFormCharacterId}
            onSubmit={onAddIncome}
          />

          <div className="panel-light p-5">
            <h2 className="font-semibold text-slate-100 mb-4">수입 내역</h2>
            {visibleIncomes.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">아직 수입 기록이 없어요</p>
            ) : (
              <div className="record-list-scroll-tall">
                {visibleIncomes.map((income) => (
                  <LedgerListItem
                    key={income.id}
                    recordDate={income.recordDate}
                    categoryLabel={INCOME_CATEGORY_LABEL[income.category]}
                    amount={income.amount}
                    memo={income.memo}
                    showCharacter={showCharacter}
                    charName={charNameById[income.characterId] ?? '캐릭터'}
                    tone="income"
                    onSaveMemo={(memo) => onSaveIncomeMemo(income.id, memo)}
                    onRemove={() => onRemoveIncome(income.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="panel-glow p-5 border-red-500/10 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SummaryChip
                label="이번 주 지출"
                sub={weekPeriod.label}
                amount={weekExpense.total}
                count={weekExpense.count}
                tone="expense"
              />
              <SummaryChip
                label="이번 달 지출"
                sub={currentMonth}
                amount={monthExpense.total}
                count={monthExpense.count}
                tone="expense"
                highlight
              />
              <SummaryChip
                label={filterCharacterId ? '누적 지출' : '누적 총 지출'}
                sub="전 기간"
                amount={allTimeExpense.total}
                count={allTimeExpense.count}
                tone="expense"
              />
            </div>
            {heldSolErda > 0 && (
              <p className="text-xs text-violet-400 pt-1 border-t border-dark-border/60 flex items-center gap-1.5">
                <SolErdaIcon size="xs" />
                전체 보유 솔 에르다 {heldSolErda.toLocaleString()}개
              </p>
            )}
          </div>

          {expenseCategoryBreakdown.length > 0 && (
            <div className="panel-light p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-slate-100">{currentMonth} 카테고리별</h2>
                  <p className="text-xs text-slate-500 mt-0.5">이번 달 지출 분류</p>
                </div>
                <span className="text-sm font-bold text-red-400">{formatMesoKorean(monthExpense.total)}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {expenseCategoryBreakdown.map((item) => (
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
              await onAddExpense({
                characterId: addCharacterId,
                category: expenseCategory,
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
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
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
              <div className="record-list-scroll">
                {solErdaSpends.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 p-3 rounded-lg bg-dark-surface/50 border border-dark-border">
                    <SolErdaIcon size="sm" />
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
              <div className="record-list-scroll-tall">
                {visibleExpenses.map((expense) => {
                  const isSolErdaPurchase = isSolErdaPurchaseExpense(expense.memo)
                  const displayMemo = parseSolErdaPurchaseMemo(expense.memo)?.displayMemo ?? expense.memo

                  return (
                    <LedgerListItem
                      key={expense.id}
                      recordDate={expense.recordDate}
                      categoryLabel={
                        isSolErdaPurchase ? '솔 에르다 조각 구매' : EXPENSE_CATEGORY_LABEL[expense.category]
                      }
                      amount={expense.amount}
                      memo={displayMemo}
                      showCharacter={showCharacter}
                      charName={charNameById[expense.characterId] ?? '캐릭터'}
                      tone="expense"
                      memoEditable={!isSolErdaPurchase}
                      onSaveMemo={(memo) => onSaveExpenseMemo(expense.id, memo)}
                      onRemove={() =>
                        isSolErdaPurchase
                          ? onRemoveSolErdaPurchase(expense.id, expense.memo)
                          : onRemoveExpense(expense.id)
                      }
                    />
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function LedgerListItem({
  recordDate,
  categoryLabel,
  amount,
  memo,
  showCharacter,
  charName,
  tone,
  memoEditable = true,
  onSaveMemo,
  onRemove,
}: {
  recordDate: string
  categoryLabel: string
  amount: number
  memo: string | null
  showCharacter: boolean
  charName: string
  tone: 'income' | 'expense'
  memoEditable?: boolean
  onSaveMemo: (memo: string | null) => Promise<void>
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [editMemo, setEditMemo] = useState('')
  const [saving, setSaving] = useState(false)

  const toneClasses =
    tone === 'income'
      ? {
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          amount: 'text-emerald-400',
          prefix: '+',
        }
      : {
          badge: 'bg-red-500/10 text-red-400 border-red-500/20',
          amount: 'text-red-400',
          prefix: '-',
        }

  const startEdit = () => {
    setEditMemo(memo ?? '')
    setEditing(true)
  }

  const saveMemo = async () => {
    setSaving(true)
    try {
      await onSaveMemo(editMemo.trim() || null)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-dark-surface/50 border border-dark-border">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded border ${toneClasses.badge}`}>
            {categoryLabel}
          </span>
          {showCharacter && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-500/10 text-cyber-400 border border-cyber-500/20">
              {charName}
            </span>
          )}
          <span className="text-xs text-slate-500">{recordDate}</span>
        </div>
        {editing ? (
          <div className="mt-2 space-y-2">
            <input
              value={editMemo}
              onChange={(e) => setEditMemo(e.target.value)}
              placeholder="메모"
              className="input-field text-sm w-full"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveMemo}
                disabled={saving}
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
          <div className="mt-1 flex items-start gap-2">
            {memo ? (
              <p
                className={`text-sm text-slate-400 flex-1 min-w-0 ${memoEditable ? 'cursor-pointer hover:text-slate-300' : ''}`}
                onClick={() => memoEditable && startEdit()}
              >
                {memo}
              </p>
            ) : (
              memoEditable && (
                <button
                  type="button"
                  onClick={startEdit}
                  className="text-xs text-slate-600 hover:text-cyber-400"
                >
                  메모 추가
                </button>
              )
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className={`text-sm font-semibold ${toneClasses.amount}`}>
          {toneClasses.prefix}{formatMesoKorean(amount)}
        </span>
        {memoEditable && !editing && (
          <button
            type="button"
            onClick={startEdit}
            className="text-xs px-2 py-1 rounded border border-dark-border text-slate-500 hover:text-cyber-400 hover:border-cyber-500/40 transition-colors"
          >
            {memo ? '수정' : '메모'}
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-600 hover:text-red-400 text-xs px-1"
          title="삭제"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function SummaryChip({
  label,
  sub,
  amount,
  count,
  tone,
  highlight = false,
}: {
  label: string
  sub: string
  amount: number
  count: number
  tone: 'income' | 'expense'
  highlight?: boolean
}) {
  const colors =
    tone === 'income'
      ? {
          panel: highlight ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-dark-surface/50 border-dark-border',
          amount: highlight ? 'text-emerald-400' : 'text-emerald-400/90',
        }
      : {
          panel: highlight ? 'bg-red-500/10 border-red-500/25' : 'bg-dark-surface/50 border-dark-border',
          amount: highlight ? 'text-red-400' : 'text-red-400/90',
        }

  return (
    <div className={`px-4 py-3 rounded-lg border ${colors.panel}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>
      <p className={`text-xl font-bold mt-1 ${colors.amount}`}>
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
