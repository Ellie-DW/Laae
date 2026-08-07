import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { YieldDailyRecord, YieldDailyRecordInput, YieldSettings, YieldSettingsInput } from '../types'
import {
  clearAllYieldDailyRecords,
  deleteYieldDailyRecord,
  fetchYieldDailyRecords,
  saveYieldDailyRecord,
} from '../lib/yieldLedgerApi'
import { deleteYieldSettings, fetchYieldSettings, saveYieldSettings } from '../lib/yieldSettingsApi'
import { getErrorMessage } from '../utils'

export function useYieldRecords(enabled: boolean) {
  const { user } = useAuth()
  const [records, setRecords] = useState<YieldDailyRecord[]>([])
  const [settings, setSettings] = useState<YieldSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user || !enabled) {
      setRecords([])
      setSettings(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [rows, yieldSettings] = await Promise.all([
        fetchYieldDailyRecords(user.id),
        fetchYieldSettings(user.id),
      ])
      setRecords(rows)
      setSettings(yieldSettings)
    } catch (err) {
      setRecords([])
      setSettings(null)
      setError(getErrorMessage(err, '수익률 기록을 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [user, enabled])

  useEffect(() => {
    void reload()
  }, [reload])

  const saveRecord = useCallback(
    async (data: YieldDailyRecordInput) => {
      if (!user) return
      const row = await saveYieldDailyRecord(user.id, data)
      setRecords((prev) => {
        const next = prev.filter((record) => record.recordDate !== row.recordDate)
        return [row, ...next]
      })
      setError(null)
    },
    [user]
  )

  const saveSettings = useCallback(
    async (data: YieldSettingsInput) => {
      if (!user) return
      const row = await saveYieldSettings(user.id, data)
      setSettings(row)
      setError(null)
    },
    [user]
  )

  const removeRecord = useCallback(async (id: string) => {
    await deleteYieldDailyRecord(id)
    setRecords((prev) => prev.filter((record) => record.id !== id))
    setError(null)
  }, [])

  const resetAll = useCallback(async () => {
    if (!user) return
    await Promise.all([clearAllYieldDailyRecords(user.id), deleteYieldSettings(user.id)])
    setRecords([])
    setSettings(null)
    setError(null)
  }, [user])

  return {
    records,
    settings,
    loading,
    error,
    saveRecord,
    saveSettings,
    removeRecord,
    resetAll,
    reload,
  }
}
