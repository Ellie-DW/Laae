import type { YieldSettings, YieldSettingsInput } from '../types'
import { supabase } from './supabase'

function mapSettings(row: Record<string, unknown>): YieldSettings {
  return {
    initialPrincipal: Number(row.initial_principal),
    startDate: (row.start_date as string) ?? null,
    memo: (row.memo as string) ?? null,
  }
}

export async function fetchYieldSettings(userId: string): Promise<YieldSettings | null> {
  const { data, error } = await supabase
    .from('yield_settings')
    .select('initial_principal, start_date, memo')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapSettings(data)
}

export async function saveYieldSettings(userId: string, data: YieldSettingsInput): Promise<YieldSettings> {
  const { data: row, error } = await supabase
    .from('yield_settings')
    .upsert(
      {
        user_id: userId,
        initial_principal: data.initialPrincipal,
        start_date: data.startDate || null,
        memo: data.memo?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select('initial_principal, start_date, memo')
    .single()

  if (error) throw error
  return mapSettings(row)
}
