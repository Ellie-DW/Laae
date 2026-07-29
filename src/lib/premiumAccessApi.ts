import { supabase } from './supabase'

export interface PremiumAccessGrant {
  userId: string
  email: string | null
  fullName: string | null
  createdAt: string
}

export async function checkPremiumAccess(): Promise<{ hasAccess: boolean; isOwner: boolean }> {
  const [accessResult, ownerResult] = await Promise.all([
    supabase.rpc('user_has_premium_access'),
    supabase.rpc('user_is_premium_owner'),
  ])

  if (accessResult.error) throw accessResult.error
  if (ownerResult.error) throw ownerResult.error

  return {
    hasAccess: Boolean(accessResult.data),
    isOwner: Boolean(ownerResult.data),
  }
}

export async function fetchPremiumAccessGrants(): Promise<PremiumAccessGrant[]> {
  const { data, error } = await supabase.rpc('list_premium_access_grants')
  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => ({
    userId: row.user_id as string,
    email: (row.email as string) ?? null,
    fullName: (row.full_name as string) ?? null,
    createdAt: row.created_at as string,
  }))
}

export async function grantPremiumAccessByEmail(email: string): Promise<void> {
  const { error } = await supabase.rpc('grant_premium_access', { p_email: email.trim() })
  if (error) throw error
}

export async function revokePremiumAccess(userId: string): Promise<void> {
  const { error } = await supabase.rpc('revoke_premium_access', { p_user_id: userId })
  if (error) throw error
}
