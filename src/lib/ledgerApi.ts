import { supabase } from './supabase'
import { normalizeDropItemName } from '../data/dropItems'
import type {
  Expense,
  ExpenseCategory,
  HuntRecord,
  GatherRecord,
  DropRecord,
  Goal,
  BossSnapshot,
  BossResetCycle,
  CharacterBossData,
  DiaryNote,
} from '../types'

function mapExpense(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    characterId: row.character_id as string,
    category: row.category as ExpenseCategory,
    amount: Number(row.amount),
    memo: (row.memo as string) ?? null,
    recordDate: row.record_date as string,
    createdAt: row.created_at as string,
  }
}

function mapHunt(row: Record<string, unknown>): HuntRecord {
  return {
    id: row.id as string,
    characterId: row.character_id as string,
    meso: Number(row.meso),
    solErdaFragments: row.sol_erda_fragments != null ? Number(row.sol_erda_fragments) : 0,
    recordDate: row.record_date as string,
    createdAt: row.created_at as string,
  }
}

function mapGather(row: Record<string, unknown>): GatherRecord {
  return {
    id: row.id as string,
    characterId: row.character_id as string,
    itemName: row.item_name as string,
    meso: Number(row.meso),
    memo: (row.memo as string) ?? null,
    recordDate: row.record_date as string,
    createdAt: row.created_at as string,
  }
}

function mapDrop(row: Record<string, unknown>): DropRecord {
  const recordDate = (row.record_date as string) ?? (row.acquired_date as string) ?? ''
  return {
    id: row.id as string,
    characterId: row.character_id as string,
    itemName: row.item_name as string,
    meso: Number(row.meso),
    memo: (row.memo as string) ?? null,
    recordDate,
    createdAt: row.created_at as string,
  }
}

function mapGoal(row: Record<string, unknown>): Goal {
  const periodMonth = row.period_month as string | undefined
  const legacyStart = periodMonth ? `${periodMonth}-01` : undefined
  const legacyEnd = periodMonth
    ? (() => {
        const [y, m] = periodMonth.split('-').map(Number)
        const lastDay = new Date(y, m, 0).getDate()
        return `${periodMonth}-${String(lastDay).padStart(2, '0')}`
      })()
    : undefined

  return {
    id: row.id as string,
    characterId: (row.character_id as string) ?? null,
    title: row.title as string,
    targetMeso: Number(row.target_meso),
    startDate: (row.start_date as string) ?? legacyStart ?? '',
    endDate: (row.end_date as string) ?? legacyEnd ?? '',
    createdAt: row.created_at as string,
  }
}

function mapDiaryNote(row: Record<string, unknown>): DiaryNote {
  return {
    id: row.id as string,
    characterId: (row.character_id as string) ?? null,
    recordDate: row.record_date as string,
    memo: row.memo as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapSnapshot(row: Record<string, unknown>): BossSnapshot {
  return {
    id: row.id as string,
    characterId: row.character_id as string,
    cycle: row.cycle as BossResetCycle,
    periodStart: row.period_start as string,
    periodEnd: row.period_end as string,
    bossData: row.boss_data as CharacterBossData,
    totalMeso: Number(row.total_meso),
    createdAt: row.created_at as string,
  }
}

export async function fetchLedgerData(userId: string) {
  const [expenses, hunts, gathers, drops, goals, snapshots, diaryNotes] = await Promise.all([
    supabase.from('expenses').select('*').eq('user_id', userId).order('record_date', { ascending: false }),
    supabase.from('hunt_records').select('*').eq('user_id', userId).order('record_date', { ascending: false }),
    supabase.from('gather_records').select('*').eq('user_id', userId).order('record_date', { ascending: false }),
    supabase.from('drop_records').select('*').eq('user_id', userId).order('record_date', { ascending: false }),
    supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('boss_snapshots').select('*').eq('user_id', userId).order('period_start', { ascending: false }),
    supabase.from('diary_notes').select('*').eq('user_id', userId).order('record_date', { ascending: false }),
  ])

  if (expenses.error) throw new Error(expenses.error.message)
  if (hunts.error) throw new Error(hunts.error.message)
  if (gathers.error) throw new Error(gathers.error.message)
  if (drops.error) throw new Error(drops.error.message)
  if (goals.error) throw new Error(goals.error.message)
  if (snapshots.error) throw new Error(snapshots.error.message)
  if (diaryNotes.error) throw new Error(diaryNotes.error.message)

  return {
    expenses: expenses.data.map(mapExpense),
    hunts: hunts.data.map(mapHunt),
    gathers: gathers.data.map(mapGather),
    drops: drops.data.map(mapDrop),
    goals: goals.data.map(mapGoal),
    snapshots: snapshots.data.map(mapSnapshot),
    diaryNotes: diaryNotes.data.map(mapDiaryNote),
  }
}

export async function addExpense(
  userId: string,
  data: { characterId: string; category: ExpenseCategory; amount: number; memo?: string; recordDate: string }
) {
  const { data: row, error } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      character_id: data.characterId,
      category: data.category,
      amount: data.amount,
      memo: data.memo ?? null,
      record_date: data.recordDate,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapExpense(row)
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}

export async function addHuntRecord(
  userId: string,
  data: { characterId: string; meso: number; solErdaFragments: number; recordDate: string }
) {
  const { data: row, error } = await supabase
    .from('hunt_records')
    .insert({
      user_id: userId,
      character_id: data.characterId,
      location: '',
      meso: data.meso,
      sol_erda_fragments: data.solErdaFragments,
      duration_minutes: null,
      memo: null,
      record_date: data.recordDate,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapHunt(row)
}

export async function deleteHuntRecord(id: string) {
  const { error } = await supabase.from('hunt_records').delete().eq('id', id)
  if (error) throw error
}

export async function addGatherRecord(
  userId: string,
  data: { characterId: string; itemName: string; meso: number; memo?: string; recordDate: string }
) {
  const { data: row, error } = await supabase
    .from('gather_records')
    .insert({
      user_id: userId,
      character_id: data.characterId,
      item_name: data.itemName,
      meso: data.meso,
      memo: data.memo ?? null,
      record_date: data.recordDate,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapGather(row)
}

export async function deleteGatherRecord(id: string) {
  const { error } = await supabase.from('gather_records').delete().eq('id', id)
  if (error) throw error
}

export async function addDropRecord(
  userId: string,
  data: { characterId: string; itemName: string; meso: number; memo?: string; recordDate: string }
) {
  const { data: row, error } = await supabase
    .from('drop_records')
    .insert({
      user_id: userId,
      character_id: data.characterId,
      item_name: data.itemName,
      meso: data.meso,
      memo: data.memo ?? null,
      record_date: data.recordDate,
      acquired_date: data.recordDate,
      sold_date: data.meso > 0 ? data.recordDate : null,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapDrop(row)
}

export async function deleteDropRecord(id: string) {
  const { error } = await supabase.from('drop_records').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function sellDropRecords(
  userId: string,
  items: { itemName: string; meso: number; recordDate: string; memo?: string }[],
  acquisitions: DropRecord[]
) {
  const consumedIds: string[] = []
  const created: DropRecord[] = []

  for (const item of items) {
    const acquisition = acquisitions
      .filter(
        (d) =>
          normalizeDropItemName(d.itemName) === normalizeDropItemName(item.itemName) &&
          d.meso === 0 &&
          !consumedIds.includes(d.id)
      )
      .sort((a, b) => a.recordDate.localeCompare(b.recordDate) || a.createdAt.localeCompare(b.createdAt))[0]

    if (!acquisition) {
      throw new Error(`「${item.itemName}」 보유 수량이 부족합니다.`)
    }

    consumedIds.push(acquisition.id)
    await deleteDropRecord(acquisition.id)

    const sale = await addDropRecord(userId, {
      characterId: acquisition.characterId,
      itemName: item.itemName,
      meso: item.meso,
      memo: item.memo,
      recordDate: item.recordDate,
    })
    created.push(sale)
  }

  return { consumedIds, created }
}

export async function upsertGoal(
  userId: string,
  data: {
    characterId: string | null
    title: string
    targetMeso: number
    startDate: string
    endDate: string
  }
) {
  const existing = data.characterId
    ? await supabase.from('goals').select('id').eq('user_id', userId).eq('character_id', data.characterId).maybeSingle()
    : await supabase.from('goals').select('id').eq('user_id', userId).is('character_id', null).maybeSingle()

  const payload = {
    title: data.title,
    target_meso: data.targetMeso,
    start_date: data.startDate,
    end_date: data.endDate,
  }

  if (existing.data?.id) {
    const { data: row, error } = await supabase
      .from('goals')
      .update(payload)
      .eq('id', existing.data.id)
      .select('*')
      .single()
    if (error) throw error
    return mapGoal(row)
  }

  const { data: row, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      character_id: data.characterId,
      ...payload,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapGoal(row)
}

export async function deleteGoal(id: string) {
  const { error } = await supabase.from('goals').delete().eq('id', id)
  if (error) throw error
}

export async function saveBossSnapshot(
  userId: string,
  data: {
    characterId: string
    cycle: BossResetCycle
    periodStart: string
    periodEnd: string
    bossData: CharacterBossData
    totalMeso: number
  }
) {
  const { data: row, error } = await supabase
    .from('boss_snapshots')
    .upsert(
      {
        user_id: userId,
        character_id: data.characterId,
        cycle: data.cycle,
        period_start: data.periodStart,
        period_end: data.periodEnd,
        boss_data: data.bossData,
        total_meso: data.totalMeso,
      },
      { onConflict: 'character_id,cycle,period_start' }
    )
    .select('*')
    .single()
  if (error) throw error
  return mapSnapshot(row)
}

export async function deleteBossSnapshot(
  characterId: string,
  cycle: BossResetCycle,
  periodStart: string
) {
  const { error } = await supabase
    .from('boss_snapshots')
    .delete()
    .eq('character_id', characterId)
    .eq('cycle', cycle)
    .eq('period_start', periodStart)
  if (error) throw error
}

export async function addDiaryNote(
  userId: string,
  data: { characterId?: string | null; recordDate: string; memo: string }
) {
  const { data: row, error } = await supabase
    .from('diary_notes')
    .insert({
      user_id: userId,
      character_id: data.characterId ?? null,
      record_date: data.recordDate,
      memo: data.memo.trim(),
    })
    .select('*')
    .single()
  if (error) throw error
  return mapDiaryNote(row)
}

export async function updateDiaryNote(
  id: string,
  data: { characterId?: string | null; memo: string }
) {
  const { data: row, error } = await supabase
    .from('diary_notes')
    .update({
      character_id: data.characterId ?? null,
      memo: data.memo.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapDiaryNote(row)
}

export async function deleteDiaryNote(id: string) {
  const { error } = await supabase.from('diary_notes').delete().eq('id', id)
  if (error) throw error
}

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  purchase: '구매',
  enhancement: '강화',
  consumable: '소모',
  other: '기타',
}
