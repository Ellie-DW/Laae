import type { NexonCharacterProfile } from '../types'
import { supabase } from './supabase'
import { getYesterdayKoreaYMD } from '../utils'

interface NexonOcidResponse {
  ocid: string
}

interface MapleApiError {
  error: string
}

async function invokeMapleApi<T>(body: Record<string, string>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('maple-api', { body })
  const payload = data as T | MapleApiError | null

  if (error) {
    if (payload && typeof payload === 'object' && 'error' in payload && payload.error) {
      throw new Error(payload.error)
    }
    throw new Error(error.message)
  }

  if (payload && typeof payload === 'object' && 'error' in payload && payload.error) {
    throw new Error(payload.error)
  }

  return payload as T
}

export async function lookupNexonOcid(characterName: string): Promise<string> {
  const data = await invokeMapleApi<NexonOcidResponse>({
    action: 'lookup-ocid',
    character_name: characterName,
  })
  if (!data?.ocid) throw new Error('캐릭터를 찾을 수 없습니다.')
  return data.ocid
}

export async function fetchNexonCharacterBasic(
  ocid: string,
  date = getYesterdayKoreaYMD()
): Promise<NexonCharacterProfile> {
  return invokeMapleApi<NexonCharacterProfile>({
    action: 'character-basic',
    ocid,
    date,
  })
}

export async function fetchNexonCharacterByName(characterName: string) {
  const ocid = await lookupNexonOcid(characterName)
  const profile = await fetchNexonCharacterBasic(ocid)
  return { ocid, profile }
}
