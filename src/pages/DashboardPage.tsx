import { useMemo, useState } from 'react'
import type { Character, CharacterBossData } from '../types'
import {
  calculateAccountMonthlyExpectedBossStats,
  getBossClearStatus,
  type AccountStats,
} from '../lib/bossStats'
import type { LedgerSummary } from '../lib/ledgerAnalytics'
import { createDefaultBossData } from '../lib/appDataApi'
import { getToday } from '../utils'
import HomeHero from '../components/dashboard/HomeHero'
import HomeBossSection from '../components/dashboard/HomeBossSection'
import HomeUpdatesSection from '../components/dashboard/HomeUpdatesSection'

type Period = 'month' | 'week'

interface DashboardPageProps {
  characters: Character[]
  selectedCharacter: Character | null
  accountStats: AccountStats
  bossDataMap: Record<string, CharacterBossData>
  ledgerSummary: LedgerSummary
  weekSummary: LedgerSummary
  weekLabel: string
  currentMonth: string
  onSelectCharacter: (id: string) => void
  onToggleWeeklyBossCleared: (characterId: string) => void
  onToggleMonthlyBossCleared: (characterId: string) => void
  onGoBoss: () => void
  onGoHunt: () => void
  onGoDrop: () => void
  onGoLedger: () => void
}

export default function DashboardPage({
  characters,
  selectedCharacter,
  accountStats,
  bossDataMap,
  ledgerSummary,
  weekSummary,
  weekLabel,
  currentMonth,
  onSelectCharacter,
  onToggleWeeklyBossCleared,
  onToggleMonthlyBossCleared,
  onGoBoss,
  onGoHunt,
  onGoDrop,
  onGoLedger,
}: DashboardPageProps) {
  const [period, setPeriod] = useState<Period>('month')
  const [showAllBosses, setShowAllBosses] = useState(false)

  const charStatsById = useMemo(
    () => Object.fromEntries(accountStats.perCharacter.map((c) => [c.id, c])),
    [accountStats.perCharacter]
  )

  const periodSummary = period === 'month' ? ledgerSummary : weekSummary
  const periodLabel = period === 'month' ? `${currentMonth} · 이번 달` : `이번 주 · ${weekLabel}`

  const expectedBoss = useMemo(
    () =>
      calculateAccountMonthlyExpectedBossStats(
        characters,
        bossDataMap,
        createDefaultBossData(),
        currentMonth,
        getToday()
      ),
    [characters, bossDataMap, currentMonth]
  )

  const bossCompletion = useMemo(() => {
    let done = 0
    let pending = 0
    for (const character of characters) {
      const bossData = bossDataMap[character.id] ?? createDefaultBossData()
      if (getBossClearStatus(bossData).tone === 'done') done += 1
      else pending += 1
    }
    return { done, pending, total: characters.length }
  }, [characters, bossDataMap])

  const visibleBossCharacters = useMemo(() => {
    if (showAllBosses) return characters
    return characters.filter((character) => {
      const bossData = bossDataMap[character.id] ?? createDefaultBossData()
      return getBossClearStatus(bossData).tone !== 'done'
    })
  }, [characters, bossDataMap, showAllBosses])

  return (
    <div className="space-y-5">
      <HomeHero
        summary={periodSummary}
        period={period}
        periodLabel={periodLabel}
        weekLabel={weekLabel}
        onPeriodChange={setPeriod}
        characterCount={characters.length}
        onGoHunt={onGoHunt}
        onGoDrop={onGoDrop}
        onGoLedger={onGoLedger}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        <HomeBossSection
          characters={characters}
          visibleCharacters={visibleBossCharacters}
          selectedCharacterId={selectedCharacter?.id ?? null}
          charStatsById={charStatsById}
          bossDataMap={bossDataMap}
          currentMonth={currentMonth}
          expected={expectedBoss}
          done={bossCompletion.done}
          pending={bossCompletion.pending}
          total={bossCompletion.total}
          showAll={showAllBosses}
          onShowAll={setShowAllBosses}
          onGoBoss={onGoBoss}
          onSelectCharacter={onSelectCharacter}
          onToggleWeeklyBossCleared={onToggleWeeklyBossCleared}
          onToggleMonthlyBossCleared={onToggleMonthlyBossCleared}
        />
        <div className="lg:sticky lg:top-20">
          <HomeUpdatesSection />
        </div>
      </div>
    </div>
  )
}
