import { supabase } from './supabase'

export interface RiceAccessGrant {
  userId: string
  email: string | null
  fullName: string | null
  createdAt: string
}

export async function checkRiceAccess(): Promise<{ hasAccess: boolean; isOwner: boolean }> {
  const [accessResult, ownerResult] = await Promise.all([
    supabase.rpc('user_has_rice_access'),
    supabase.rpc('user_is_rice_owner'),
  ])

  if (accessResult.error) throw accessResult.error
  if (ownerResult.error) throw ownerResult.error

  return {
    hasAccess: Boolean(accessResult.data),
    isOwner: Boolean(ownerResult.data),
  }
}

export async function fetchRiceAccessGrants(): Promise<RiceAccessGrant[]> {
  const { data, error } = await supabase.rpc('list_rice_access_grants')
  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => ({
    userId: row.user_id as string,
    email: (row.email as string) ?? null,
    fullName: (row.full_name as string) ?? null,
    createdAt: row.created_at as string,
  }))
}

export async function grantRiceAccessByEmail(email: string): Promise<void> {
  const { error } = await supabase.rpc('grant_rice_access', { p_email: email.trim() })
  if (error) throw error
}

export async function revokeRiceAccess(userId: string): Promise<void> {
  const { error } = await supabase.rpc('revoke_rice_access', { p_user_id: userId })
  if (error) throw error
}
