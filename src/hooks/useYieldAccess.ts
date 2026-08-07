import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  checkYieldAccess,
  fetchYieldAccessGrants,
  grantYieldAccessByEmail,
  revokeYieldAccess,
  type YieldAccessGrant,
} from '../lib/yieldAccessApi'
import { getErrorMessage } from '../utils'

export function useYieldAccess() {
  const { user } = useAuth()
  const [hasAccess, setHasAccess] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [grants, setGrants] = useState<YieldAccessGrant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user) {
      setHasAccess(false)
      setIsOwner(false)
      setGrants([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const access = await checkYieldAccess()
      setHasAccess(access.hasAccess)
      setIsOwner(access.isOwner)

      if (access.isOwner) {
        const rows = await fetchYieldAccessGrants()
        setGrants(rows)
      } else {
        setGrants([])
      }
    } catch (err) {
      setHasAccess(false)
      setIsOwner(false)
      setGrants([])
      setError(getErrorMessage(err, '수익률 가계부 권한을 확인하지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void reload()
  }, [reload])

  const grantAccess = useCallback(
    async (email: string) => {
      await grantYieldAccessByEmail(email)
      await reload()
      setError(null)
    },
    [reload]
  )

  const revokeAccess = useCallback(
    async (userId: string) => {
      await revokeYieldAccess(userId)
      await reload()
      setError(null)
    },
    [reload]
  )

  return {
    hasAccess,
    isOwner,
    grants,
    loading,
    error,
    grantAccess,
    revokeAccess,
    reload,
  }
}
