import { supabase } from './supabase'

export interface PremiumCharacterGroup {
  id: string
  name: string
  sortOrder: number
  createdAt: string
}

function mapGroup(row: Record<string, unknown>): PremiumCharacterGroup {
  return {
    id: row.id as string,
    name: row.name as string,
    sortOrder: Number(row.sort_order),
    createdAt: row.created_at as string,
  }
}

export async function fetchPremiumCharacterGroups(): Promise<PremiumCharacterGroup[]> {
  const { data, error } = await supabase
    .from('premium_character_groups')
    .select('id, name, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapGroup)
}

export async function createPremiumCharacterGroup(name: string): Promise<PremiumCharacterGroup> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('그룹 이름을 입력해주세요.')

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  const userId = userData.user?.id
  if (!userId) throw new Error('로그인이 필요합니다.')

  const { data: maxRow, error: maxError } = await supabase
    .from('premium_character_groups')
    .select('sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (maxError) throw maxError

  const { data, error } = await supabase
    .from('premium_character_groups')
    .insert({
      user_id: userId,
      name: trimmed,
      sort_order: (maxRow?.sort_order ?? -1) + 1,
    })
    .select('id, name, sort_order, created_at')
    .single()

  if (error) throw error
  return mapGroup(data)
}

export async function updatePremiumCharacterGroup(
  groupId: string,
  patch: { name?: string }
): Promise<PremiumCharacterGroup> {
  const updates: Record<string, string> = {}
  if (patch.name != null) {
    const trimmed = patch.name.trim()
    if (!trimmed) throw new Error('그룹 이름을 입력해주세요.')
    updates.name = trimmed
  }

  const { data, error } = await supabase
    .from('premium_character_groups')
    .update(updates)
    .eq('id', groupId)
    .select('id, name, sort_order, created_at')
    .single()

  if (error) throw error
  return mapGroup(data)
}

export async function deletePremiumCharacterGroup(groupId: string): Promise<void> {
  const { error } = await supabase.from('premium_character_groups').delete().eq('id', groupId)
  if (error) throw error
}

export async function assignCharacterPremiumGroup(
  characterId: string,
  groupId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .update({ premium_group_id: groupId })
    .eq('id', characterId)

  if (error) throw error
}

export async function clearAllCharacterPremiumGroupAssignments(): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  const userId = userData.user?.id
  if (!userId) throw new Error('로그인이 필요합니다.')

  const { error } = await supabase
    .from('characters')
    .update({ premium_group_id: null })
    .eq('user_id', userId)
    .not('premium_group_id', 'is', null)

  if (error) throw error
}
