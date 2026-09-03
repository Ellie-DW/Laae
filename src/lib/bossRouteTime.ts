import type { CharacterBossData } from '../types'
import { calculatePlannedBossStats, getPlannedBossCycles, isWeeklyBossCleared } from './bossStats'

export const MAX_WEEKLY_ROUTE_SAMPLES = 8
export const MIN_ROUTE_SAMPLE_MS = 1_000
export const MAX_ROUTE_MINUTES = 12 * 60
export const BOSS_ROUTE_TIMER_KEY = 'laae-boss-route-timer'

export interface BossRouteTimerState {
  characterId: string
  startedAt: number
}

export function getWeeklyRouteMinutes(bossData: CharacterBossData): number | null {
  const minutes = bossData.weeklyRouteMinutes
  if (typeof minutes === 'number' && minutes > 0) return minutes
  return null
}

export function clampRouteMinutes(value: number): number {
  return Math.min(MAX_ROUTE_MINUTES, Math.max(1, Math.round(value)))
}

export function formatDurationMinutes(minutes: number): string {
  const rounded = Math.max(0, Math.round(minutes))
  if (rounded < 60) return `${rounded}분`
  const hours = Math.floor(rounded / 60)
  const rest = rounded % 60
  return rest > 0 ? `${hours}시간 ${rest}분` : `${hours}시간`
}

export function formatElapsedMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** 주간 메소 ÷ 시간. 1시간 미만은 1시간으로 봐서 주간 예상을 넘기지 않음 */
export function weeklyMesoPerHour(weeklyMeso: number, minutes: number): number | null {
  if (weeklyMeso <= 0 || minutes <= 0) return null
  const hours = Math.max(minutes / 60, 1)
  return Math.round(weeklyMeso / hours)
}

export function applyManualRouteMinutes(
  bossData: CharacterBossData,
  minutes: number | null
): CharacterBossData {
  if (minutes == null || minutes <= 0) {
    return { ...bossData, weeklyRouteMinutes: null, weeklyRouteSamples: [] }
  }
  return {
    ...bossData,
    weeklyRouteMinutes: clampRouteMinutes(minutes),
    weeklyRouteSamples: [],
  }
}

export function applyRouteSample(bossData: CharacterBossData, measuredMinutes: number): CharacterBossData {
  const sample = clampRouteMinutes(measuredMinutes)
  const samples = [...(bossData.weeklyRouteSamples ?? []), sample].slice(-MAX_WEEKLY_ROUTE_SAMPLES)
  return {
    ...bossData,
    weeklyRouteSamples: samples,
    weeklyRouteMinutes: sample,
  }
}

export function sampleMinutesFromElapsed(elapsedMs: number): number | null {
  if (elapsedMs < MIN_ROUTE_SAMPLE_MS) return null
  return clampRouteMinutes(elapsedMs / 60_000)
}

export function sumRemainingWeeklyRoute(
  characters: { id: string }[],
  bossDataMap: Record<string, CharacterBossData>,
  fallback: CharacterBossData
) {
  let minutes = 0
  let pendingWithoutTime = 0

  for (const character of characters) {
    const bossData = bossDataMap[character.id] ?? fallback
    const { hasWeekly } = getPlannedBossCycles(bossData)
    if (!hasWeekly || isWeeklyBossCleared(bossData)) continue
    const routeMinutes = getWeeklyRouteMinutes(bossData)
    if (routeMinutes) minutes += routeMinutes
    else pendingWithoutTime += 1
  }

  return { minutes, pendingWithoutTime }
}

export function sumAccountWeeklyRoute(
  characters: { id: string }[],
  bossDataMap: Record<string, CharacterBossData>,
  fallback: CharacterBossData
) {
  let weeklyMeso = 0
  let minutes = 0
  let missing = 0

  for (const character of characters) {
    const bossData = bossDataMap[character.id] ?? fallback
    const { hasWeekly } = getPlannedBossCycles(bossData)
    if (!hasWeekly) continue
    const meso = calculatePlannedBossStats(bossData).weeklyBossMeso
    const routeMinutes = getWeeklyRouteMinutes(bossData)
    if (!routeMinutes || meso <= 0) {
      if (meso > 0) missing += 1
      continue
    }
    weeklyMeso += meso
    minutes += routeMinutes
  }

  return {
    weeklyMeso,
    minutes,
    missing,
    mesoPerHour: weeklyMesoPerHour(weeklyMeso, minutes),
  }
}

export function readBossRouteTimer(): BossRouteTimerState | null {
  try {
    const raw = localStorage.getItem(BOSS_ROUTE_TIMER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<BossRouteTimerState>
    if (typeof parsed.characterId !== 'string' || typeof parsed.startedAt !== 'number') return null
    if (!Number.isFinite(parsed.startedAt) || parsed.startedAt > Date.now()) return null
    return { characterId: parsed.characterId, startedAt: parsed.startedAt }
  } catch {
    return null
  }
}

export function writeBossRouteTimer(timer: BossRouteTimerState | null) {
  try {
    if (!timer) localStorage.removeItem(BOSS_ROUTE_TIMER_KEY)
    else localStorage.setItem(BOSS_ROUTE_TIMER_KEY, JSON.stringify(timer))
  } catch {
    /* ignore quota / private mode */
  }
}
