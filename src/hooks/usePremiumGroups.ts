import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  assignCharacterPremiumGroup,
  clearAllCharacterPremiumGroupAssignments,
  createPremiumCharacterGroup,
  deletePremiumCharacterGroup,
  fetchPremiumCharacterGroups,
  updatePremiumCharacterGroup,
  type PremiumCharacterGroup,
} from '../lib/premiumGroupsApi'
import { getErrorMessage } from '../utils'

export function usePremiumGroups(enabled: boolean) {
  const { user } = useAuth()
  const [groups, setGroups] = useState<PremiumCharacterGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user || !enabled) {
      setGroups([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const rows = await fetchPremiumCharacterGroups()
      setGroups(rows)
    } catch (err) {
      setGroups([])
      setError(getErrorMessage(err, '프리미엄 그룹을 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [user, enabled])

  useEffect(() => {
    void reload()
  }, [reload])

  const createGroup = useCallback(
    async (name: string) => {
      const row = await createPremiumCharacterGroup(name)
      setGroups((prev) => [...prev, row])
      setError(null)
      return row
    },
    []
  )

  const renameGroup = useCallback(async (groupId: string, name: string) => {
    const row = await updatePremiumCharacterGroup(groupId, { name })
    setGroups((prev) => prev.map((group) => (group.id === groupId ? row : group)))
    setError(null)
  }, [])

  const removeGroup = useCallback(async (groupId: string) => {
    await deletePremiumCharacterGroup(groupId)
    setGroups((prev) => prev.filter((group) => group.id !== groupId))
    setError(null)
  }, [])

  const assignCharacterGroup = useCallback(async (characterId: string, groupId: string | null) => {
    await assignCharacterPremiumGroup(characterId, groupId)
    setError(null)
  }, [])

  const resetAllAssignments = useCallback(async () => {
    await clearAllCharacterPremiumGroupAssignments()
    setError(null)
  }, [])

  return {
    groups,
    loading,
    error,
    createGroup,
    renameGroup,
    removeGroup,
    assignCharacterGroup,
    resetAllAssignments,
    reload,
  }
}
