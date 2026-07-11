import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { CharacterBossData, BossSelection, Page, BossSnapshot, BossResetCycle } from '../types'
import {
  calculateBossStats,
  calculateAccountStats,
  isWeeklyBossCleared,
  isMonthlyBossCleared,
  canSelectWeeklyBoss,
} from '../lib/bossStats'
import { BOSSES, getBossResetCycle } from '../data/bosses'
import { STORAGE_KEY, getToday, getWeeklyPeriod, getMonthlyPeriod, getErrorMessage } from '../utils'
import { useAuth } from '../contexts/AuthContext'
import {
  type AppData,
  EMPTY_DATA,
  createDefaultBossData,
  fetchUserAppData,
  savePreferences,
  createCharacter,
  saveBossData,
  deleteCharacter,
  reorderCharacters as persistCharacterOrder,
  migrateLocalDataToSupabase,
  isGlobalCharacterNameTaken,
} from '../lib/appDataApi'
import { saveBossSnapshot, deleteBossSnapshot } from '../lib/ledgerApi'
import {
  DUPLICATE_CHARACTER_NAME_MESSAGE,
  normalizeCharacterName,
} from '../lib/characters'

export type BossSnapshotSync =
  | { type: 'upsert'; snapshot: BossSnapshot }
  | { type: 'delete'; characterId: string; cycle: BossResetCycle; periodStart: string }

function loadLocalData(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AppData
  } catch {
    return null
  }
}

export function useAppData() {
  const { user } = useAuth()
  const [data, setData] = useState<AppData>(EMPTY_DATA)
  const [dataLoading, setDataLoading] = useState(true)
  const [syncError, setSyncError] = useState<string | null>(null)
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user) {
      setData(EMPTY_DATA)
      setDataLoading(false)
      userIdRef.current = null
      return
    }

    let cancelled = false
    userIdRef.current = user.id
    setDataLoading(true)
    setSyncError(null)

    const load = async () => {
      try {
        let appData = await fetchUserAppData(user.id)

        if (appData.characters.length === 0) {
          const localData = loadLocalData()
          if (localData && localData.characters.length > 0) {
            appData = await migrateLocalDataToSupabase(user.id, localData)
            localStorage.removeItem(STORAGE_KEY)
          }
        }

        if (!cancelled) {
          setData({ ...appData, currentPage: 'dashboard' })
        }
      } catch (err) {
        if (!cancelled) {
          setSyncError(getErrorMessage(err, '데이터를 불러오지 못했습니다.'))
          setData(EMPTY_DATA)
        }
      } finally {
        if (!cancelled) setDataLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [user])

  const selectedCharacter = useMemo(
    () => data.characters.find((c) => c.id === data.selectedCharacterId) ?? null,
    [data.characters, data.selectedCharacterId]
  )

  const bossData = useMemo(() => {
    if (!data.selectedCharacterId) return createDefaultBossData()
    return data.bossData[data.selectedCharacterId] ?? createDefaultBossData()
  }, [data.selectedCharacterId, data.bossData])

  const persistPreferences = useCallback(
    async (selectedCharacterId: string | null, currentPage: Page) => {
      if (!user) return
      try {
        await savePreferences(user.id, selectedCharacterId, currentPage)
        setSyncError(null)
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : '설정 저장에 실패했습니다.')
      }
    },
    [user]
  )

  const persistBossData = useCallback(
    async (characterId: string, bossDataToSave: CharacterBossData) => {
      if (!user) return
      try {
        await saveBossData(characterId, bossDataToSave)
        setSyncError(null)
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : '보스 데이터 저장에 실패했습니다.')
      }
    },
    [user]
  )

  const addCharacter = useCallback(
    async (name: string) => {
      if (!user) return
      const trimmed = normalizeCharacterName(name)
      if (!trimmed) return

      const defaultBoss = createDefaultBossData()
      try {
        if (await isGlobalCharacterNameTaken(trimmed)) {
          setSyncError(DUPLICATE_CHARACTER_NAME_MESSAGE)
          return
        }

        const char = await createCharacter(user.id, trimmed, defaultBoss)
        setData((prev) => ({
          ...prev,
          characters: [...prev.characters, char],
          selectedCharacterId: char.id,
          bossData: { ...prev.bossData, [char.id]: defaultBoss },
        }))
        await savePreferences(user.id, char.id, data.currentPage)
        setSyncError(null)
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : '캐릭터 추가에 실패했습니다.')
      }
    },
    [user, data.currentPage]
  )

  const removeCharacter = useCallback(
    async (id: string) => {
      if (!user) return

      const characters = data.characters.filter((c) => c.id !== id)
      const { [id]: _removed, ...bossData } = data.bossData
      const selectedCharacterId =
        data.selectedCharacterId === id ? characters[0]?.id ?? null : data.selectedCharacterId

      try {
        await deleteCharacter(id)
        setData((prev) => ({ ...prev, characters, bossData, selectedCharacterId }))
        await savePreferences(user.id, selectedCharacterId, data.currentPage)
        setSyncError(null)
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : '캐릭터 삭제에 실패했습니다.')
      }
    },
    [user, data]
  )

  const reorderCharactersList = useCallback(
    async (orderedIds: string[]) => {
      if (!user) return
      if (orderedIds.length !== data.characters.length) return

      const charMap = new Map(data.characters.map((c) => [c.id, c]))
      const reordered = orderedIds.flatMap((id, sortOrder) => {
        const char = charMap.get(id)
        return char ? [{ ...char, sortOrder }] : []
      })
      if (reordered.length !== data.characters.length) return

      const previousCharacters = data.characters
      setData((prev) => ({ ...prev, characters: reordered }))

      try {
        await persistCharacterOrder(orderedIds)
        setSyncError(null)
      } catch (err) {
        setData((prev) => ({ ...prev, characters: previousCharacters }))
        setSyncError(err instanceof Error ? err.message : '캐릭터 순서 저장에 실패했습니다.')
      }
    },
    [user, data.characters]
  )

  const selectCharacter = useCallback(
    (id: string) => {
      setData((prev) => ({ ...prev, selectedCharacterId: id }))
      persistPreferences(id, data.currentPage)
    },
    [persistPreferences, data.currentPage]
  )

  const setPage = useCallback(
    (page: Page) => {
      setData((prev) => ({ ...prev, currentPage: page }))
      persistPreferences(data.selectedCharacterId, page)
    },
    [persistPreferences, data.selectedCharacterId]
  )

  const updateBossSelection = useCallback(
    (bossId: string, difficulty: string, updates: Partial<BossSelection>) => {
      if (!data.selectedCharacterId) return
      const charId = data.selectedCharacterId

      setData((prev) => {
        const current = prev.bossData[charId] ?? createDefaultBossData()
        const selections = current.selections.map((s) =>
          s.bossId === bossId && s.difficulty === difficulty ? { ...s, ...updates } : s
        )
        const updated = { ...current, selections }
        persistBossData(charId, updated)
        return {
          ...prev,
          bossData: { ...prev.bossData, [charId]: updated },
        }
      })
    },
    [data.selectedCharacterId, persistBossData]
  )

  const selectBossDifficulty = useCallback(
    (bossId: string, difficulty: string | null) => {
      if (!data.selectedCharacterId) return
      const charId = data.selectedCharacterId

      setData((prev) => {
        const current = prev.bossData[charId] ?? createDefaultBossData()
        if (difficulty !== null && !canSelectWeeklyBoss(current, bossId)) {
          return prev
        }
        const selections = current.selections.map((s) => {
          if (s.bossId !== bossId) return s
          return { ...s, checked: difficulty !== null && s.difficulty === difficulty }
        })
        const updated = { ...current, selections }
        persistBossData(charId, updated)
        return {
          ...prev,
          bossData: { ...prev.bossData, [charId]: updated },
        }
      })
    },
    [data.selectedCharacterId, persistBossData]
  )

  const resetTabSelections = useCallback(
    (tab: string) => {
      if (!data.selectedCharacterId) return
      const charId = data.selectedCharacterId
      const tabWeeklyBossIds = BOSSES
        .filter((b) => b.tab === tab && getBossResetCycle(b) === 'weekly')
        .map((b) => b.id)

      setData((prev) => {
        const current = prev.bossData[charId] ?? createDefaultBossData()
        const selections = current.selections.map((s) =>
          tabWeeklyBossIds.includes(s.bossId) ? { ...s, checked: false } : s
        )
        const updated = { ...current, selections, weeklyClearedPeriodStart: null, bossesClearedAt: null }
        persistBossData(charId, updated)
        return {
          ...prev,
          bossData: { ...prev.bossData, [charId]: updated },
        }
      })
    },
    [data.selectedCharacterId, persistBossData]
  )

  const toggleWeeklyBossCleared = useCallback(
    async (characterId: string): Promise<BossSnapshotSync | null> => {
      const current = data.bossData[characterId] ?? createDefaultBossData()
      const week = getWeeklyPeriod()
      const clearing = !isWeeklyBossCleared(current)
      const updated = clearing
        ? { ...current, weeklyClearedPeriodStart: week.start, bossesClearedAt: getToday() }
        : { ...current, weeklyClearedPeriodStart: null, bossesClearedAt: null }

      setData((prev) => ({
        ...prev,
        bossData: { ...prev.bossData, [characterId]: updated },
      }))
      persistBossData(characterId, updated)

      if (!user) return null

      try {
        if (clearing) {
          const stats = calculateBossStats(updated)
          const snapshot = await saveBossSnapshot(user.id, {
            characterId,
            cycle: 'weekly',
            periodStart: week.start,
            periodEnd: week.end,
            bossData: updated,
            totalMeso: stats.weeklyBossMeso,
          })
          return { type: 'upsert', snapshot }
        }

        await deleteBossSnapshot(characterId, 'weekly', week.start)
        return { type: 'delete', characterId, cycle: 'weekly', periodStart: week.start }
      } catch (err) {
        setSyncError(getErrorMessage(err, '보스 기록 저장에 실패했습니다.'))
        return null
      }
    },
    [data.bossData, persistBossData, user]
  )

  const toggleMonthlyBossCleared = useCallback(
    async (characterId: string): Promise<BossSnapshotSync | null> => {
      const current = data.bossData[characterId] ?? createDefaultBossData()
      const month = getMonthlyPeriod()
      const clearing = !isMonthlyBossCleared(current)
      const updated = clearing
        ? { ...current, monthlyClearedPeriodStart: month.start, bossesClearedAt: getToday() }
        : { ...current, monthlyClearedPeriodStart: null, bossesClearedAt: null }

      setData((prev) => ({
        ...prev,
        bossData: { ...prev.bossData, [characterId]: updated },
      }))
      persistBossData(characterId, updated)

      if (!user) return null

      try {
        if (clearing) {
          const stats = calculateBossStats(updated)
          const snapshot = await saveBossSnapshot(user.id, {
            characterId,
            cycle: 'monthly',
            periodStart: month.start,
            periodEnd: month.end,
            bossData: updated,
            totalMeso: stats.monthlyBossMeso,
          })
          return { type: 'upsert', snapshot }
        }

        await deleteBossSnapshot(characterId, 'monthly', month.start)
        return { type: 'delete', characterId, cycle: 'monthly', periodStart: month.start }
      } catch (err) {
        setSyncError(getErrorMessage(err, '보스 기록 저장에 실패했습니다.'))
        return null
      }
    },
    [data.bossData, persistBossData, user]
  )

  const bossStats = useMemo(
    () => calculateBossStats(bossData),
    [bossData]
  )

  const accountStats = useMemo(
    () => calculateAccountStats(data.characters, data.bossData, createDefaultBossData()),
    [data.characters, data.bossData]
  )

  return {
    characters: data.characters,
    selectedCharacter,
    currentPage: data.currentPage,
    bossData,
    bossDataMap: data.bossData,
    bossStats,
    accountStats,
    dataLoading,
    syncError,
    addCharacter,
    removeCharacter,
    reorderCharacters: reorderCharactersList,
    selectCharacter,
    setPage,
    updateBossSelection,
    selectBossDifficulty,
    resetTabSelections,
    toggleWeeklyBossCleared,
    toggleMonthlyBossCleared,
  }
}
