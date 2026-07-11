import type { CharacterBossData, BossSnapshot } from '../types'
import { BOSSES, getBossResetCycle } from '../data/bosses'
import { getWeeklyPeriod, getMonthlyPeriod, getToday, getCurrentMonth, enumerateWeeklyPeriodsOverlappingMonth } from '../utils'

export interface BossStats {
  totalMeso: number
  bossMeso: number
  dropMeso: number
  weeklyBossMeso: number
  monthlyBossMeso: number
  checkedBossCount: number
  weeklyCheckedBossCount: number
  monthlyCheckedBossCount: number
  checkedDropCount: number
  checkedBosses: CharacterBossData['selections']
  checkedDrops: CharacterBossData['dropItems']
}

function selectionCycle(sel: CharacterBossData['selections'][0]) {
  const boss = BOSSES.find((b) => b.id === sel.bossId)
  return boss ? getBossResetCycle(boss) : ('weekly' as const)
}

export function getPlannedBossCycles(bossData: CharacterBossData) {
  const planned = bossData.selections.filter((s) => s.checked)
  const weeklyBossIds = new Set<string>()
  const monthlyBossIds = new Set<string>()
  for (const sel of planned) {
    if (selectionCycle(sel) === 'monthly') monthlyBossIds.add(sel.bossId)
    else weeklyBossIds.add(sel.bossId)
  }
  return {
    hasWeekly: weeklyBossIds.size > 0,
    hasMonthly: monthlyBossIds.size > 0,
    weeklyCount: weeklyBossIds.size,
    monthlyCount: monthlyBossIds.size,
    count: weeklyBossIds.size + monthlyBossIds.size,
  }
}

export function isWeeklyBossCleared(bossData: CharacterBossData): boolean {
  return bossData.weeklyClearedPeriodStart === getWeeklyPeriod().start
}

export function isMonthlyBossCleared(bossData: CharacterBossData): boolean {
  return bossData.monthlyClearedPeriodStart === getMonthlyPeriod().start
}

export function isBossPeriodCleared(bossData: CharacterBossData): boolean {
  const planned = bossData.selections.filter((s) => s.checked)
  if (planned.length === 0) return false
  const hasWeekly = planned.some((s) => selectionCycle(s) === 'weekly')
  const hasMonthly = planned.some((s) => selectionCycle(s) === 'monthly')
  return (!hasWeekly || isWeeklyBossCleared(bossData)) && (!hasMonthly || isMonthlyBossCleared(bossData))
}

function getClearedBosses(bossData: CharacterBossData) {
  const plannedBosses = bossData.selections.filter((s) => s.checked)
  const weekCleared = isWeeklyBossCleared(bossData)
  const monthCleared = isMonthlyBossCleared(bossData)
  return plannedBosses.filter((sel) => {
    const cycle = selectionCycle(sel)
    return cycle === 'monthly' ? monthCleared : weekCleared
  })
}

export function getBossClearStatus(bossData: CharacterBossData) {
  const planned = bossData.selections.filter((s) => s.checked)
  const hasWeekly = planned.some((s) => selectionCycle(s) === 'weekly')
  const hasMonthly = planned.some((s) => selectionCycle(s) === 'monthly')
  const weekCleared = isWeeklyBossCleared(bossData)
  const monthCleared = isMonthlyBossCleared(bossData)

  if (planned.length === 0) return { label: '설정 없음', tone: 'idle' as const }
  if (isBossPeriodCleared(bossData)) return { label: '잡음 완료', tone: 'done' as const }
  if (hasWeekly && !weekCleared && hasMonthly && monthCleared) {
    return { label: '주간 대기', tone: 'pending' as const }
  }
  if (hasMonthly && !monthCleared && hasWeekly && weekCleared) {
    return { label: '월간 대기', tone: 'pending' as const }
  }
  return { label: '대기 중', tone: 'pending' as const }
}

function calcBossShare(sel: CharacterBossData['selections'][0]) {
  const boss = BOSSES.find((b) => b.id === sel.bossId)
  const diff = boss?.difficulties.find((d) => d.difficulty === sel.difficulty)
  if (!boss || !diff) return { meso: 0, cycle: 'weekly' as const }
  return {
    meso: Math.floor(diff.meso / sel.partySize),
    cycle: getBossResetCycle(boss),
  }
}

function sumBossMesoByCycle(selections: CharacterBossData['selections']) {
  let weeklyBossMeso = 0
  let monthlyBossMeso = 0
  const weeklyBossIds = new Set<string>()
  const monthlyBossIds = new Set<string>()

  for (const sel of selections) {
    const { meso, cycle } = calcBossShare(sel)
    if (cycle === 'monthly') {
      monthlyBossMeso += meso
      monthlyBossIds.add(sel.bossId)
    } else {
      weeklyBossMeso += meso
      weeklyBossIds.add(sel.bossId)
    }
  }

  return {
    bossMeso: weeklyBossMeso + monthlyBossMeso,
    weeklyBossMeso,
    monthlyBossMeso,
    weeklyBossIds,
    monthlyBossIds,
  }
}

export interface PlannedBossStats {
  bossMeso: number
  weeklyBossMeso: number
  monthlyBossMeso: number
  plannedBossCount: number
  weeklyPlannedBossCount: number
  monthlyPlannedBossCount: number
  plannedBosses: CharacterBossData['selections']
}

/** 설정된 보스 기준 예상 수익 (잡음 체크 전) */
export function calculatePlannedBossStats(bossData: CharacterBossData): PlannedBossStats {
  const plannedBosses = bossData.selections.filter((s) => s.checked)
  const totals = sumBossMesoByCycle(plannedBosses)

  return {
    bossMeso: totals.bossMeso,
    weeklyBossMeso: totals.weeklyBossMeso,
    monthlyBossMeso: totals.monthlyBossMeso,
    plannedBossCount: plannedBosses.length > 0 ? totals.weeklyBossIds.size + totals.monthlyBossIds.size : 0,
    weeklyPlannedBossCount: totals.weeklyBossIds.size,
    monthlyPlannedBossCount: totals.monthlyBossIds.size,
    plannedBosses,
  }
}

export function calculateBossStats(bossData: CharacterBossData): BossStats {
  const clearedBosses = getClearedBosses(bossData)
  const totals = sumBossMesoByCycle(clearedBosses)

  return {
    totalMeso: totals.bossMeso,
    bossMeso: totals.bossMeso,
    dropMeso: 0,
    weeklyBossMeso: totals.weeklyBossMeso,
    monthlyBossMeso: totals.monthlyBossMeso,
    checkedBossCount: clearedBosses.length > 0 ? totals.weeklyBossIds.size + totals.monthlyBossIds.size : 0,
    weeklyCheckedBossCount: totals.weeklyBossIds.size,
    monthlyCheckedBossCount: totals.monthlyBossIds.size,
    checkedDropCount: bossData.dropItems.filter((d) => d.checked).length,
    checkedBosses: clearedBosses,
    checkedDrops: bossData.dropItems.filter((d) => d.checked),
  }
}

export interface CharacterBossSummary {
  id: string
  name: string
  totalMeso: number
  bossMeso: number
  weeklyBossMeso: number
  monthlyBossMeso: number
  dropMeso: number
  checkedBossCount: number
}

export interface AccountStats {
  totalMeso: number
  bossMeso: number
  weeklyBossMeso: number
  monthlyBossMeso: number
  dropMeso: number
  checkedBossCount: number
  weeklyCheckedBossCount: number
  monthlyCheckedBossCount: number
  checkedDropCount: number
  characterCount: number
  perCharacter: CharacterBossSummary[]
}

export function calculateAccountStats(
  characters: { id: string; name: string }[],
  bossDataMap: Record<string, CharacterBossData>,
  defaultBossData: CharacterBossData
): AccountStats {
  const perCharacter: CharacterBossSummary[] = []
  let totalMeso = 0
  let bossMeso = 0
  let weeklyBossMeso = 0
  let monthlyBossMeso = 0
  let dropMeso = 0
  let checkedBossCount = 0
  let weeklyCheckedBossCount = 0
  let monthlyCheckedBossCount = 0
  let checkedDropCount = 0

  for (const char of characters) {
    const stats = calculateBossStats(bossDataMap[char.id] ?? defaultBossData)
    perCharacter.push({
      id: char.id,
      name: char.name,
      totalMeso: stats.totalMeso,
      bossMeso: stats.bossMeso,
      weeklyBossMeso: stats.weeklyBossMeso,
      monthlyBossMeso: stats.monthlyBossMeso,
      dropMeso: stats.dropMeso,
      checkedBossCount: stats.checkedBossCount,
    })
    totalMeso += stats.totalMeso
    bossMeso += stats.bossMeso
    weeklyBossMeso += stats.weeklyBossMeso
    monthlyBossMeso += stats.monthlyBossMeso
    dropMeso += stats.dropMeso
    checkedBossCount += stats.checkedBossCount
    weeklyCheckedBossCount += stats.weeklyCheckedBossCount
    monthlyCheckedBossCount += stats.monthlyCheckedBossCount
    checkedDropCount += stats.checkedDropCount
  }

  perCharacter.sort((a, b) => b.totalMeso - a.totalMeso)

  return {
    totalMeso,
    bossMeso,
    weeklyBossMeso,
    monthlyBossMeso,
    dropMeso,
    checkedBossCount,
    weeklyCheckedBossCount,
    monthlyCheckedBossCount,
    checkedDropCount,
    characterCount: characters.length,
    perCharacter,
  }
}

export function calculatePlannedBossMeso(bossData: CharacterBossData): number {
  return calculatePlannedBossStats(bossData).bossMeso
}

export interface MonthlyExpectedBossStats {
  targetMonth: string
  /** 주간 보스 1주 예상 */
  weeklyPerWeek: number
  /** 월간 주기 보스 1회 예상 */
  monthlyPerMonth: number
  weeksInMonth: number
  /** 이번 달 주간 환산 (weeklyPerWeek × weeksInMonth) */
  weeklyInMonthTotal: number
  monthlyExpectedTotal: number
}

/** 경계 주는 잡은 달에 귀속, 미클리어는 아직 잡을 수 있는 달에 포함 */
export function getWeeklyPeriodAttributionMonth(
  weekStart: string,
  weekEnd: string,
  bossData: CharacterBossData,
  asOf: string = getToday()
): string | null {
  const clearedThisWeek = bossData.weeklyClearedPeriodStart === weekStart
  const clearDate = bossData.bossesClearedAt?.slice(0, 10) ?? null

  if (clearedThisWeek && clearDate) {
    return clearDate.slice(0, 7)
  }
  if (clearedThisWeek) {
    return weekStart.slice(0, 7)
  }

  if (asOf > weekEnd) return null
  if (asOf >= weekStart) return asOf.slice(0, 7)
  return weekStart.slice(0, 7)
}

export function countWeeklyPeriodsForMonth(
  bossData: CharacterBossData,
  targetMonth: string,
  asOf: string = getToday()
): number {
  if (!getPlannedBossCycles(bossData).hasWeekly) return 0

  const { start: monthStart, end: monthEnd } = getMonthlyPeriod(new Date(`${targetMonth}-15T12:00:00`))
  return enumerateWeeklyPeriodsOverlappingMonth(monthStart, monthEnd).filter(({ start, end }) =>
    getWeeklyPeriodAttributionMonth(start, end, bossData, asOf) === targetMonth
  ).length
}

export function calculateMonthlyExpectedBossStats(
  bossData: CharacterBossData,
  targetMonth: string = getCurrentMonth(),
  asOf: string = getToday()
): MonthlyExpectedBossStats {
  const planned = calculatePlannedBossStats(bossData)
  const weeksInMonth = countWeeklyPeriodsForMonth(bossData, targetMonth, asOf)
  const weeklyInMonthTotal = planned.weeklyBossMeso * weeksInMonth

  return {
    targetMonth,
    weeklyPerWeek: planned.weeklyBossMeso,
    monthlyPerMonth: planned.monthlyBossMeso,
    weeksInMonth,
    weeklyInMonthTotal,
    monthlyExpectedTotal: weeklyInMonthTotal + planned.monthlyBossMeso,
  }
}

export function calculateAccountMonthlyExpectedBossStats(
  characters: { id: string }[],
  bossDataMap: Record<string, CharacterBossData>,
  defaultBossData: CharacterBossData,
  targetMonth: string = getCurrentMonth(),
  asOf: string = getToday()
): MonthlyExpectedBossStats {
  let weeklyPerWeek = 0
  let monthlyPerMonth = 0
  let weeklyInMonthTotal = 0
  let monthlyExpectedTotal = 0

  for (const character of characters) {
    const stats = calculateMonthlyExpectedBossStats(
      bossDataMap[character.id] ?? defaultBossData,
      targetMonth,
      asOf
    )
    weeklyPerWeek += stats.weeklyPerWeek
    monthlyPerMonth += stats.monthlyPerMonth
    weeklyInMonthTotal += stats.weeklyInMonthTotal
    monthlyExpectedTotal += stats.monthlyExpectedTotal
  }

  return {
    targetMonth,
    weeklyPerWeek,
    monthlyPerMonth,
    weeksInMonth: 0,
    weeklyInMonthTotal,
    monthlyExpectedTotal,
  }
}

export interface BossPerBossCumulative {
  bossId: string
  name: string
  shortName: string
  group: string
  clearCount: number
  totalMeso: number
}

export interface BossCumulativeStats {
  weeklyMeso: number
  monthlyMeso: number
  totalMeso: number
  weeklyPeriods: number
  monthlyPeriods: number
  clearedKinds: number
  totalClears: number
  perBoss: BossPerBossCumulative[]
}

function accumulateBossClears(
  bossData: CharacterBossData,
  map: Map<string, { clearCount: number; totalMeso: number }>,
  cycleFilter?: 'weekly' | 'monthly'
) {
  for (const sel of getClearedBosses(bossData)) {
    const cycle = selectionCycle(sel)
    if (cycleFilter && cycle !== cycleFilter) continue
    const { meso } = calcBossShare(sel)
    const boss = BOSSES.find((b) => b.id === sel.bossId)
    if (!boss) continue
    const prev = map.get(sel.bossId) ?? { clearCount: 0, totalMeso: 0 }
    map.set(sel.bossId, { clearCount: prev.clearCount + 1, totalMeso: prev.totalMeso + meso })
  }
}

export function getBossCumulativeStats(
  snapshots: BossSnapshot[],
  characterId: string,
  currentBossData?: CharacterBossData
): BossCumulativeStats {
  const charSnapshots = snapshots.filter((s) => s.characterId === characterId)
  let weeklyMeso = 0
  let monthlyMeso = 0
  let weeklyPeriods = 0
  let monthlyPeriods = 0
  const bossMap = new Map<string, { clearCount: number; totalMeso: number }>()

  for (const s of charSnapshots) {
    if (s.cycle === 'weekly') {
      weeklyMeso += s.totalMeso
      weeklyPeriods += 1
    } else {
      monthlyMeso += s.totalMeso
      monthlyPeriods += 1
    }
    accumulateBossClears(s.bossData, bossMap)
  }

  if (currentBossData) {
    const week = getWeeklyPeriod()
    const month = getMonthlyPeriod()
    const hasWeekSnap = charSnapshots.some((s) => s.cycle === 'weekly' && s.periodStart === week.start)
    const hasMonthSnap = charSnapshots.some((s) => s.cycle === 'monthly' && s.periodStart === month.start)

    if (isWeeklyBossCleared(currentBossData) && !hasWeekSnap) {
      const stats = calculateBossStats(currentBossData)
      weeklyMeso += stats.weeklyBossMeso
      weeklyPeriods += 1
      accumulateBossClears(currentBossData, bossMap, 'weekly')
    }
    if (isMonthlyBossCleared(currentBossData) && !hasMonthSnap) {
      const stats = calculateBossStats(currentBossData)
      monthlyMeso += stats.monthlyBossMeso
      monthlyPeriods += 1
      accumulateBossClears(currentBossData, bossMap, 'monthly')
    }
  }

  const perBoss = BOSSES.map((boss) => {
    const agg = bossMap.get(boss.id) ?? { clearCount: 0, totalMeso: 0 }
    return {
      bossId: boss.id,
      name: boss.name,
      shortName: boss.shortName,
      group: boss.group,
      clearCount: agg.clearCount,
      totalMeso: agg.totalMeso,
    }
  })

  const clearedKinds = perBoss.filter((b) => b.clearCount > 0).length
  const totalClears = perBoss.reduce((s, b) => s + b.clearCount, 0)

  return {
    weeklyMeso,
    monthlyMeso,
    totalMeso: weeklyMeso + monthlyMeso,
    weeklyPeriods,
    monthlyPeriods,
    clearedKinds,
    totalClears,
    perBoss,
  }
}

export function getAccountBossCumulativeStats(
  snapshots: BossSnapshot[],
  characters: { id: string }[],
  bossDataMap: Record<string, CharacterBossData>,
  defaultBossData: CharacterBossData
) {
  let weeklyMeso = 0
  let monthlyMeso = 0

  for (const character of characters) {
    const stats = getBossCumulativeStats(
      snapshots,
      character.id,
      bossDataMap[character.id] ?? defaultBossData
    )
    weeklyMeso += stats.weeklyMeso
    monthlyMeso += stats.monthlyMeso
  }

  return {
    weeklyMeso,
    monthlyMeso,
    totalMeso: weeklyMeso + monthlyMeso,
  }
}
