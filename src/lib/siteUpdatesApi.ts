import { supabase } from './supabase'
import type { SiteUpdate } from './updates'

interface SiteUpdateRow {
  id: string
  date: string
  title: string
  items: string[] | null
}

function toSiteUpdate(row: SiteUpdateRow): SiteUpdate {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    items: row.items ?? [],
  }
}

export async function fetchSiteUpdates(): Promise<SiteUpdate[]> {
  const { data, error } = await supabase
    .from('site_updates')
    .select('id, date, title, items')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(toSiteUpdate)
}

export async function createSiteUpdate(input: {
  date: string
  title: string
  items: string[]
}): Promise<SiteUpdate> {
  const { data, error } = await supabase
    .from('site_updates')
    .insert({
      date: input.date,
      title: input.title,
      items: input.items,
    })
    .select('id, date, title, items')
    .single()

  if (error) throw error
  return toSiteUpdate(data)
}

export async function deleteSiteUpdate(id: string): Promise<void> {
  const { error } = await supabase.from('site_updates').delete().eq('id', id)
  if (error) throw error
}

export async function checkSiteUpdateOwner(): Promise<boolean> {
  const { data, error } = await supabase.rpc('user_is_rice_owner')
  if (error) throw error
  return Boolean(data)
}
