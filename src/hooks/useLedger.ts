import { useState, useEffect, useCallback, useMemo } from 'react'
import type { ExpenseCategory, BossResetCycle, BossSnapshot } from '../types'
import { useAuth } from '../contexts/AuthContext'
import {
  fetchLedgerData,
  addExpense,
  deleteExpense,
  updateExpense,
  addHuntRecord,
  deleteHuntRecord,
  addGatherRecord,
  deleteGatherRecord,
  addDropRecord,
  deleteDropRecord,
  sellDropRecords,
  upsertGoal,
  deleteGoal,
  addDiaryNote,
  updateDiaryNote,
  deleteDiaryNote,
} from '../lib/ledgerApi'
import {
  computeLedgerSummary,
  computeDailyNet,
  computeExpenseByCategory,
  computeCharacterSummaries,
  computeGoalProgress,
  enrichLedgerWithBoss,
  getCurrentMonth,
} from '../lib/ledgerAnalytics'
import { getHeldSolErdaFragments, buildSolErdaPurchaseMemo, parseSolErdaPurchaseMemo } from '../lib/huntStats'
import { getWeeklyPeriod, getErrorMessage } from '../utils'

export function useLedger(
  characters: { id: string; name: string }[],
  bossIncomeByCharacter: Record<string, number> = {},
  weeklyBossIncomeByCharacter: Record<string, number> = {}
) {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Awaited<ReturnType<typeof fetchLedgerData>>['expenses']>([])
  const [hunts, setHunts] = useState<Awaited<ReturnType<typeof fetchLedgerData>>['hunts']>([])
  const [gathers, setGathers] = useState<Awaited<ReturnType<typeof fetchLedgerData>>['gathers']>([])
  const [drops, setDrops] = useState<Awaited<ReturnType<typeof fetchLedgerData>>['drops']>([])
  const [goals, setGoals] = useState<Awaited<ReturnType<typeof fetchLedgerData>>['goals']>([])
  const [snapshots, setSnapshots] = useState<Awaited<ReturnType<typeof fetchLedgerData>>['snapshots']>([])
  const [diaryNotes, setDiaryNotes] = useState<Awaited<ReturnType<typeof fetchLedgerData>>['diaryNotes']>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchLedgerData(user.id)
      setExpenses(data.expenses)
      setHunts(data.hunts)
      setGathers(data.gathers)
      setDrops(data.drops)
      setGoals(data.goals)
      setSnapshots(data.snapshots)
      setDiaryNotes(data.diaryNotes)
    } catch (err) {
      setError(getErrorMessage(err, '기록을 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setExpenses([])
      setHunts([])
      setGathers([])
      setDrops([])
      setGoals([])
      setSnapshots([])
      setDiaryNotes([])
      setLoading(false)
      return
    }
    reload()
  }, [user, reload])

  const currentMonth = getCurrentMonth()

  const totalBossIncome = useMemo(
    () => Object.values(bossIncomeByCharacter).reduce((sum, v) => sum + v, 0),
    [bossIncomeByCharacter]
  )

  const totalWeeklyBossIncome = useMemo(
    () => Object.values(weeklyBossIncomeByCharacter).reduce((sum, v) => sum + v, 0),
    [weeklyBossIncomeByCharacter]
  )

  const accountSummary = useMemo(
    () => enrichLedgerWithBoss(
      computeLedgerSummary(hunts, gathers, expenses, drops, { startDate: `${currentMonth}-01`, endDate: `${currentMonth}-31` }),
      totalBossIncome
    ),
    [hunts, gathers, expenses, drops, currentMonth, totalBossIncome]
  )

  const accountWeekSummary = useMemo(() => {
    const { start, end } = getWeeklyPeriod()
    return enrichLedgerWithBoss(
      computeLedgerSummary(hunts, gathers, expenses, drops, { startDate: start, endDate: end }),
      totalWeeklyBossIncome
    )
  }, [hunts, gathers, expenses, drops, totalWeeklyBossIncome])

  const accountSummaryAll = useMemo(
    () => computeLedgerSummary(hunts, gathers, expenses, drops),
    [hunts, gathers, expenses, drops]
  )

  const dailyNet = useMemo(() => computeDailyNet(hunts, gathers, expenses, drops, 7), [hunts, gathers, expenses, drops])

  const expenseByCategory = useMemo(
    () => computeExpenseByCategory(expenses, { month: currentMonth }),
    [expenses, currentMonth]
  )

  const characterSummaries = useMemo(
    () => computeCharacterSummaries(characters, hunts, gathers, expenses, drops, currentMonth, bossIncomeByCharacter),
    [characters, hunts, gathers, expenses, drops, currentMonth, bossIncomeByCharacter]
  )

  const getCharacterSummary = useCallback(
    (characterId: string) =>
      enrichLedgerWithBoss(
        computeLedgerSummary(hunts, gathers, expenses, drops, {
          characterId,
          startDate: `${currentMonth}-01`,
          endDate: `${currentMonth}-31`,
        }),
        bossIncomeByCharacter[characterId] ?? 0
      ),
    [hunts, gathers, expenses, drops, currentMonth, bossIncomeByCharacter]
  )

  const getCharacterWeekSummary = useCallback(
    (characterId: string) => {
      const { start, end } = getWeeklyPeriod()
      return enrichLedgerWithBoss(
        computeLedgerSummary(hunts, gathers, expenses, drops, {
          characterId,
          startDate: start,
          endDate: end,
        }),
        weeklyBossIncomeByCharacter[characterId] ?? 0
      )
    },
    [hunts, gathers, expenses, drops, weeklyBossIncomeByCharacter]
  )

  const getGoalProgress = useCallback(
    (goal: (typeof goals)[0]) =>
      computeGoalProgress(goal, hunts, gathers, expenses, drops, snapshots),
    [hunts, gathers, expenses, drops, snapshots]
  )

  const createExpense = useCallback(
    async (data: { characterId: string; category: ExpenseCategory; amount: number; memo?: string; recordDate: string }) => {
      if (!user) return
      const row = await addExpense(user.id, data)
      setExpenses((prev) => [row, ...prev])
      setError(null)
    },
    [user]
  )

  const removeExpense = useCallback(async (id: string) => {
    await deleteExpense(id)
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const saveExpenseMemo = useCallback(async (id: string, memo: string | null) => {
    const row = await updateExpense(id, { memo: memo?.trim() || null })
    setExpenses((prev) => prev.map((e) => (e.id === id ? row : e)))
    setError(null)
  }, [])

  const createHunt = useCallback(
    async (data: { characterId: string; meso: number; solErdaFragments: number; recordDate: string }) => {
      if (!user) return
      const row = await addHuntRecord(user.id, data)
      setHunts((prev) => [row, ...prev])
      setError(null)
    },
    [user]
  )

  const sellSolErda = useCallback(
    async (data: { characterId: string; quantity: number; meso: number; recordDate: string }) => {
      if (!user) return
      const row = await addHuntRecord(user.id, {
        characterId: data.characterId,
        meso: data.meso,
        solErdaFragments: -data.quantity,
        recordDate: data.recordDate,
      })
      setHunts((prev) => [row, ...prev])
      setError(null)
    },
    [user]
  )

  const spendSolErda = useCallback(
    async (data: { characterId: string; quantity: number; recordDate: string }) => {
      if (!user || data.quantity <= 0) return
      const held = getHeldSolErdaFragments(hunts)
      if (data.quantity > held) {
        setError(`솔 에르다 조각 보유 수량(${held.toLocaleString()}개)이 부족합니다.`)
        return
      }
      const row = await addHuntRecord(user.id, {
        characterId: data.characterId,
        meso: 0,
        solErdaFragments: -data.quantity,
        recordDate: data.recordDate,
      })
      setHunts((prev) => [row, ...prev])
      setError(null)
    },
    [user, hunts]
  )

  const purchaseSolErda = useCallback(
    async (data: {
      characterId: string
      quantity: number
      amount: number
      recordDate: string
    }) => {
      if (!user || data.quantity <= 0 || data.amount <= 0) return
      const hunt = await addHuntRecord(user.id, {
        characterId: data.characterId,
        meso: 0,
        solErdaFragments: data.quantity,
        recordDate: data.recordDate,
      })
      const expense = await addExpense(user.id, {
        characterId: data.characterId,
        category: 'purchase',
        amount: data.amount,
        memo: buildSolErdaPurchaseMemo(data.quantity, hunt.id),
        recordDate: data.recordDate,
      })
      setHunts((prev) => [hunt, ...prev])
      setExpenses((prev) => [expense, ...prev])
      setError(null)
    },
    [user]
  )

  const removeSolErdaPurchase = useCallback(async (expenseId: string, memo: string | null) => {
    const parsed = parseSolErdaPurchaseMemo(memo)
    if (parsed?.huntId) {
      await deleteHuntRecord(parsed.huntId)
      setHunts((prev) => prev.filter((h) => h.id !== parsed.huntId))
    }
    await deleteExpense(expenseId)
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId))
  }, [])

  const removeHunt = useCallback(async (id: string) => {
    await deleteHuntRecord(id)
    setHunts((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const createGather = useCallback(
    async (data: { characterId: string; itemName: string; meso: number; memo?: string; recordDate: string }) => {
      if (!user) return
      const row = await addGatherRecord(user.id, data)
      setGathers((prev) => [row, ...prev])
      setError(null)
    },
    [user]
  )

  const removeGather = useCallback(async (id: string) => {
    await deleteGatherRecord(id)
    setGathers((prev) => prev.filter((g) => g.id !== id))
  }, [])

  const createDrop = useCallback(
    async (data: { characterId: string; itemName: string; meso: number; memo?: string; recordDate: string }) => {
      if (!user) return
      const row = await addDropRecord(user.id, data)
      setDrops((prev) => [row, ...prev])
      setError(null)
    },
    [user]
  )

  const sellDrops = useCallback(
    async (items: { itemName: string; meso: number; recordDate: string; memo?: string }[]) => {
      if (!user || items.length === 0) return
      const { consumedIds, created } = await sellDropRecords(user.id, items, drops)
      setDrops((prev) => [...created, ...prev.filter((d) => !consumedIds.includes(d.id))])
      setError(null)
    },
    [user, drops]
  )

  const removeDrop = useCallback(async (id: string) => {
    await deleteDropRecord(id)
    setDrops((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const saveGoal = useCallback(
    async (data: {
      characterId: string | null
      title: string
      targetMeso: number
      startDate: string
      endDate: string
    }) => {
      if (!user) return
      try {
        const row = await upsertGoal(user.id, data)
        setGoals((prev) => {
          const filtered = prev.filter((g) => !(g.characterId === data.characterId))
          return [row, ...filtered]
        })
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : '목표 저장에 실패했습니다')
        throw e
      }
    },
    [user]
  )

  const removeGoal = useCallback(async (id: string) => {
    await deleteGoal(id)
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }, [])

  const upsertSnapshot = useCallback((snapshot: BossSnapshot) => {
    setSnapshots((prev) => [
      snapshot,
      ...prev.filter(
        (s) =>
          !(
            s.characterId === snapshot.characterId &&
            s.cycle === snapshot.cycle &&
            s.periodStart === snapshot.periodStart
          )
      ),
    ])
  }, [])

  const removeSnapshot = useCallback((characterId: string, cycle: BossResetCycle, periodStart: string) => {
    setSnapshots((prev) =>
      prev.filter(
        (s) => !(s.characterId === characterId && s.cycle === cycle && s.periodStart === periodStart)
      )
    )
  }, [])

  const createDiaryNote = useCallback(
    async (data: { characterId?: string | null; recordDate: string; memo: string }) => {
      if (!user || !data.memo.trim()) return
      const row = await addDiaryNote(user.id, data)
      setDiaryNotes((prev) => [row, ...prev])
      setError(null)
    },
    [user]
  )

  const saveDiaryNote = useCallback(
    async (id: string, data: { characterId?: string | null; memo: string }) => {
      if (!data.memo.trim()) return
      const row = await updateDiaryNote(id, data)
      setDiaryNotes((prev) => prev.map((n) => (n.id === id ? row : n)))
      setError(null)
    },
    []
  )

  const removeDiaryNote = useCallback(async (id: string) => {
    await deleteDiaryNote(id)
    setDiaryNotes((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return {
    expenses,
    hunts,
    gathers,
    drops,
    goals,
    snapshots,
    diaryNotes,
    loading,
    error,
    currentMonth,
    accountSummary,
    accountWeekSummary,
    accountSummaryAll,
    dailyNet,
    expenseByCategory,
    characterSummaries,
    getCharacterSummary,
    getCharacterWeekSummary,
    getGoalProgress,
    createExpense,
    removeExpense,
    saveExpenseMemo,
    createHunt,
    sellSolErda,
    spendSolErda,
    purchaseSolErda,
    removeSolErdaPurchase,
    removeHunt,
    createGather,
    removeGather,
    createDrop,
    sellDrops,
    removeDrop,
    saveGoal,
    removeGoal,
    createDiaryNote,
    saveDiaryNote,
    removeDiaryNote,
    reload,
    upsertSnapshot,
    removeSnapshot,
  }
}
