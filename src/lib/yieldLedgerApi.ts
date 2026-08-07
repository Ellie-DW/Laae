import type { YieldDailyRecord, YieldDailyRecordInput } from '../types'
import { supabase } from './supabase'

function mapDailyRecord(row: Record<string, unknown>): YieldDailyRecord {
  return {
    id: row.id as string,
    recordDate: row.record_date as string,
    usdKrwRate: Number(row.usd_krw_rate),
    upbitStart: row.upbit_start != null ? Number(row.upbit_start) : null,
    upbitEnd: row.upbit_end != null ? Number(row.upbit_end) : null,
    binanceStart: row.binance_start != null ? Number(row.binance_start) : null,
    binanceEnd: row.binance_end != null ? Number(row.binance_end) : null,
    withdrawalUpbit: row.withdrawal_upbit != null ? Number(row.withdrawal_upbit) : null,
    withdrawalBinance: row.withdrawal_binance != null ? Number(row.withdrawal_binance) : null,
    depositUpbit: row.deposit_upbit != null ? Number(row.deposit_upbit) : null,
    depositBinance: row.deposit_binance != null ? Number(row.deposit_binance) : null,
    memo: (row.memo as string) ?? null,
    createdAt: row.created_at as string,
  }
}

function toDbPayload(userId: string, data: YieldDailyRecordInput) {
  return {
    user_id: userId,
    record_date: data.recordDate,
    usd_krw_rate: data.usdKrwRate,
    upbit_start: data.upbitStart ?? null,
    upbit_end: data.upbitEnd ?? null,
    binance_start: data.binanceStart ?? null,
    binance_end: data.binanceEnd ?? null,
    withdrawal_upbit: data.withdrawalUpbit ?? null,
    withdrawal_binance: data.withdrawalBinance ?? null,
    deposit_upbit: data.depositUpbit ?? null,
    deposit_binance: data.depositBinance ?? null,
    memo: data.memo?.trim() || null,
  }
}

export async function fetchYieldDailyRecords(userId: string): Promise<YieldDailyRecord[]> {
  const { data, error } = await supabase
    .from('yield_daily_records')
    .select('*')
    .eq('user_id', userId)
    .order('record_date', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapDailyRecord)
}

export async function saveYieldDailyRecord(
  userId: string,
  data: YieldDailyRecordInput
): Promise<YieldDailyRecord> {
  const { data: row, error } = await supabase
    .from('yield_daily_records')
    .upsert(toDbPayload(userId, data), { onConflict: 'user_id,record_date' })
    .select('*')
    .single()

  if (error) throw error
  return mapDailyRecord(row)
}

export async function deleteYieldDailyRecord(id: string): Promise<void> {
  const { error } = await supabase.from('yield_daily_records').delete().eq('id', id)
  if (error) throw error
}

export async function clearAllYieldDailyRecords(userId: string): Promise<void> {
  const { error } = await supabase.from('yield_daily_records').delete().eq('user_id', userId)
  if (error) throw error
}
