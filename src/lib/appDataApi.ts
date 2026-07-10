import { supabase } from './supabase'
import { getWeeklyPeriod, getMonthlyPeriod } from '../utils'
import type { Character, CharacterBossData, Page, BossSelection } from '../types'
import { BOSSES } from '../data/bosses'
import { createDefaultDropItems, mergeDropItems } from '../data/dropItems'
import {
  DUPLICATE_CHARACTER_NAME_MESSAGE,
  normalizeCharacterName,
} from './characters'

export async function isGlobalCharacterNameTaken(name: string): Promise<boolean> {
  const trimmed = normalizeCharacterName(name)
  if (!trimmed) return false

  const { data, error } = await supabase.rpc('is_character_name_taken', { p_name: trimmed })
  if (error) throw error
  return Boolean(data)
}

export interface AppData {
  characters: Character[]
  selectedCharacterId: string | null
  bossData: Record<string, CharacterBossData>
  currentPage: Page
}

interface CharacterRow {
  id: string
  user_id: string
  name: string
  boss_data: CharacterBossData
  created_at: string
}

interface PreferencesRow {
  user_id: string
  selected_character_id: string | null
  current_page: string
}

export function createDefaultBossData(): CharacterBossData {
  const selections = BOSSES.flatMap((boss) =>
    boss.difficulties.map((d) => ({
      bossId: boss.id,
      difficulty: d.difficulty,
      partySize: 1,
      checked: false,
    }))
  )
  return { selections, dropItems: createDefaultDropItems(), bossesClearedAt: null, weeklyClearedPeriodStart: null, monthlyClearedPeriodStart: null }
}

function normalizeBossSelections(selections: BossSelection[]): BossSelection[] {
  const keptDifficulty = new Map<string, string>()

  for (const sel of selections) {
    if (sel.checked && !keptDifficulty.has(sel.bossId)) {
      keptDifficulty.set(sel.bossId, sel.difficulty)
    }
  }

  return selections.map((sel) => ({
    ...sel,
    checked: keptDifficulty.get(sel.bossId) === sel.difficulty,
  }))
}

function normalizeBossData(bossData: CharacterBossData): CharacterBossData {
  const defaults = createDefaultBossData()
  const selectionMap = new Map(
    (bossData.selections ?? []).map((s) => [`${s.bossId}-${s.difficulty}`, s])
  )
  const selections = normalizeBossSelections(
    defaults.selections.map(
      (def) => selectionMap.get(`${def.bossId}-${def.difficulty}`) ?? def
    )
  )
  const legacyCleared = bossData.bossesCleared ?? (bossData.selections ?? []).some(
    (s) => (s as BossSelection & { cleared?: boolean }).cleared
  )
  const week = getWeeklyPeriod()
  const month = getMonthlyPeriod()

  let weeklyClearedPeriodStart = bossData.weeklyClearedPeriodStart ?? null
  let monthlyClearedPeriodStart = bossData.monthlyClearedPeriodStart ?? null
  if (legacyCleared && !weeklyClearedPeriodStart && !monthlyClearedPeriodStart) {
    weeklyClearedPeriodStart = week.start
    monthlyClearedPeriodStart = month.start
  }

  return {
    dropItems: mergeDropItems(bossData.dropItems),
    selections,
    bossesClearedAt: bossData.bossesClearedAt ?? null,
    weeklyClearedPeriodStart,
    monthlyClearedPeriodStart,
  }
}

const EMPTY_DATA: AppData = {
  characters: [],
  selectedCharacterId: null,
  bossData: {},
  currentPage: 'boss',
}

function rowToCharacter(row: CharacterRow): Character {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  }
}

function rowsToAppData(characters: CharacterRow[], prefs: PreferencesRow | null): AppData {
  const bossData: Record<string, CharacterBossData> = {}
  for (const row of characters) {
    bossData[row.id] = normalizeBossData(row.boss_data ?? createDefaultBossData())
  }

  const selectedId = prefs?.selected_character_id ?? null
  const validSelectedId = selectedId && bossData[selectedId] ? selectedId : characters[0]?.id ?? null

  return {
    characters: characters.map(rowToCharacter),
    selectedCharacterId: validSelectedId,
    bossData,
    currentPage: (prefs?.current_page as Page) ?? 'boss',
  }
}

export async function fetchUserAppData(userId: string): Promise<AppData> {
  const [charsResult, prefsResult] = await Promise.all([
    supabase
      .from('characters')
      .select('id, user_id, name, boss_data, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
    supabase
      .from('user_preferences')
      .select('user_id, selected_character_id, current_page')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (charsResult.error) throw charsResult.error
  if (prefsResult.error) throw prefsResult.error

  return rowsToAppData(charsResult.data as CharacterRow[], prefsResult.data as PreferencesRow | null)
}

export async function savePreferences(
  userId: string,
  selectedCharacterId: string | null,
  currentPage: Page
) {
  const { error } = await supabase.from('user_preferences').upsert({
    user_id: userId,
    selected_character_id: selectedCharacterId,
    current_page: currentPage,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function createCharacter(
  userId: string,
  name: string,
  bossData: CharacterBossData = createDefaultBossData()
): Promise<Character> {
  const trimmed = normalizeCharacterName(name)
  if (!trimmed) throw new Error('캐릭터명을 입력해주세요.')

  if (await isGlobalCharacterNameTaken(trimmed)) {
    throw new Error(DUPLICATE_CHARACTER_NAME_MESSAGE)
  }

  const { data, error } = await supabase
    .from('characters')
    .insert({ user_id: userId, name: trimmed, boss_data: bossData })
    .select('id, name, created_at')
    .single()

  if (error) {
    if (error.code === '23505') throw new Error(DUPLICATE_CHARACTER_NAME_MESSAGE)
    throw error
  }

  return {
    id: data.id,
    name: data.name,
    createdAt: data.created_at,
  }
}

export async function saveBossData(characterId: string, bossData: CharacterBossData) {
  const { error } = await supabase
    .from('characters')
    .update({ boss_data: bossData })
    .eq('id', characterId)

  if (error) throw error
}

export async function deleteCharacter(characterId: string) {
  const { error } = await supabase.from('characters').delete().eq('id', characterId)
  if (error) throw error
}

export async function migrateLocalDataToSupabase(
  userId: string,
  localData: AppData
): Promise<AppData> {
  const idMap = new Map<string, string>()
  const createdCharacters: Character[] = []
  const bossData: Record<string, CharacterBossData> = {}

  for (const char of localData.characters) {
    const data = localData.bossData[char.id] ?? createDefaultBossData()
    const created = await createCharacter(userId, char.name, data)
    idMap.set(char.id, created.id)
    createdCharacters.push(created)
    bossData[created.id] = data
  }

  const selectedCharacterId = localData.selectedCharacterId
    ? idMap.get(localData.selectedCharacterId) ?? createdCharacters[0]?.id ?? null
    : createdCharacters[0]?.id ?? null

  await savePreferences(userId, selectedCharacterId, localData.currentPage)

  return {
    characters: createdCharacters,
    selectedCharacterId,
    bossData,
    currentPage: localData.currentPage,
  }
}

export { EMPTY_DATA }
