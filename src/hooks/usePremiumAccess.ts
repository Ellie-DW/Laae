import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  checkPremiumAccess,
  fetchPremiumAccessGrants,
  grantPremiumAccessByEmail,
  revokePremiumAccess,
  type PremiumAccessGrant,
} from '../lib/premiumAccessApi'
import { getErrorMessage } from '../utils'

export function usePremiumAccess() {
  const { user } = useAuth()
  const [hasAccess, setHasAccess] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [grants, setGrants] = useState<PremiumAccessGrant[]>([])
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
      const access = await checkPremiumAccess()
      setHasAccess(access.hasAccess)
      setIsOwner(access.isOwner)

      if (access.isOwner) {
        const rows = await fetchPremiumAccessGrants()
        setGrants(rows)
      } else {
        setGrants([])
      }
    } catch (err) {
      setHasAccess(false)
      setIsOwner(false)
      setGrants([])
      setError(getErrorMessage(err, '프리미엄 권한을 확인하지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void reload()
  }, [reload])

  const grantAccess = useCallback(
    async (email: string) => {
      await grantPremiumAccessByEmail(email)
      await reload()
      setError(null)
    },
    [reload]
  )

  const revokeAccess = useCallback(
    async (userId: string) => {
      await revokePremiumAccess(userId)
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
