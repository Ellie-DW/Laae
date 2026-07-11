import { useMemo } from 'react'
import Sidebar from './components/layout/Sidebar'
import BottomNav from './components/layout/BottomNav'
import MobileHeader from './components/layout/MobileHeader'
import { NAV_ITEMS } from './components/layout/nav'
import DashboardPage from './pages/DashboardPage'
import BossPage from './pages/BossPage'
import HuntPage from './pages/HuntPage'
import ExpensePage from './pages/ExpensePage'
import GatherPage from './pages/GatherPage'
import AnalyticsPage from './pages/AnalyticsPage'
import GoalsPage from './pages/GoalsPage'
import DiaryPage from './pages/DiaryPage'
import DropPage from './pages/DropPage'
import LoginPage from './pages/LoginPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import { useAppData } from './hooks/useAppData'
import { useLedger } from './hooks/useLedger'
import { computeExpenseByCategory } from './lib/ledgerAnalytics'
import { useAuth } from './contexts/AuthContext'
import { getWeeklyPeriod } from './utils'

function LoadingScreen({ message = '로딩 중...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-cyber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">{message}</p>
      </div>
    </div>
  )
}

function MainApp() {
  const {
    characters,
    selectedCharacter,
    currentPage,
    bossData,
    bossDataMap,
    bossStats,
    accountStats,
    dataLoading,
    syncError,
    addCharacter,
    removeCharacter,
    reorderCharacters,
    selectCharacter,
    setPage,
    updateBossSelection,
    selectBossDifficulty,
    resetTabSelections,
    toggleWeeklyBossCleared,
    toggleMonthlyBossCleared,
  } = useAppData()

  const bossIncomeByCharacter = useMemo(
    () => Object.fromEntries(accountStats.perCharacter.map((c) => [c.id, c.bossMeso])),
    [accountStats.perCharacter]
  )

  const weeklyBossIncomeByCharacter = useMemo(
    () => Object.fromEntries(accountStats.perCharacter.map((c) => [c.id, c.weeklyBossMeso])),
    [accountStats.perCharacter]
  )

  const ledger = useLedger(characters, bossIncomeByCharacter, weeklyBossIncomeByCharacter)

  if (dataLoading || ledger.loading) return <LoadingScreen message="데이터 불러오는 중..." />

  const combinedError = syncError || ledger.error
  const weekPeriod = getWeeklyPeriod()
  const selectedLedgerSummary = selectedCharacter
    ? ledger.getCharacterSummary(selectedCharacter.id)
    : null

  const handleToggleWeeklyBossCleared = (characterId: string) => {
    void toggleWeeklyBossCleared(characterId).then((result) => {
      if (!result) return
      if (result.type === 'upsert') ledger.upsertSnapshot(result.snapshot)
      else ledger.removeSnapshot(result.characterId, result.cycle, result.periodStart)
    })
  }

  const handleToggleMonthlyBossCleared = (characterId: string) => {
    void toggleMonthlyBossCleared(characterId).then((result) => {
      if (!result) return
      if (result.type === 'upsert') ledger.upsertSnapshot(result.snapshot)
      else ledger.removeSnapshot(result.characterId, result.cycle, result.periodStart)
    })
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardPage
            characters={characters}
            selectedCharacter={selectedCharacter}
            accountStats={accountStats}
            selectedBossTotalMeso={bossStats.totalMeso}
            bossDataMap={bossDataMap}
            ledgerSummary={ledger.accountSummary}
            weekSummary={ledger.accountWeekSummary}
            weekLabel={weekPeriod.label}
            selectedLedgerSummary={selectedLedgerSummary}
            dailyNet={ledger.dailyNet}
            expenseByCategory={
              selectedCharacter
                ? computeExpenseByCategory(ledger.expenses, {
                    characterId: selectedCharacter.id,
                    month: ledger.currentMonth,
                  })
                : ledger.expenseByCategory
            }
            goals={ledger.goals}
            currentMonth={ledger.currentMonth}
            getGoalProgress={ledger.getGoalProgress}
            onSelectCharacter={selectCharacter}
            onToggleWeeklyBossCleared={handleToggleWeeklyBossCleared}
            onToggleMonthlyBossCleared={handleToggleMonthlyBossCleared}
            onGoBoss={() => setPage('boss')}
            onOpenDiary={() => setPage('diary')}
            onGoDrop={() => setPage('drop')}
            diaryHunts={ledger.hunts}
            diaryGathers={ledger.gathers}
            diaryExpenses={ledger.expenses}
            diaryDrops={ledger.drops}
            diarySnapshots={ledger.snapshots}
          />
        )
      case 'diary':
        return (
          <DiaryPage
            characters={characters}
            bossDataMap={bossDataMap}
            hunts={ledger.hunts}
            gathers={ledger.gathers}
            expenses={ledger.expenses}
            drops={ledger.drops}
            snapshots={ledger.snapshots}
            onRemoveHunt={ledger.removeHunt}
            onRemoveGather={ledger.removeGather}
            onRemoveExpense={ledger.removeExpense}
            onRemoveDrop={ledger.removeDrop}
          />
        )
      case 'boss':
        return (
          <BossPage
            selectedCharacter={selectedCharacter}
            bossData={bossData}
            snapshots={ledger.snapshots}
            onUpdateBoss={updateBossSelection}
            onSelectBossDifficulty={selectBossDifficulty}
            onResetTab={resetTabSelections}
          />
        )
      case 'drop':
        return (
          <DropPage
            characters={characters}
            drops={ledger.drops}
            onAdd={ledger.createDrop}
            onSell={ledger.sellDrops}
            onRemove={ledger.removeDrop}
          />
        )
      case 'hunt':
        return (
          <HuntPage
            selectedCharacter={selectedCharacter}
            hunts={ledger.hunts}
            onAdd={ledger.createHunt}
            onSellSolErda={ledger.sellSolErda}
            onRemove={ledger.removeHunt}
          />
        )
      case 'expense':
        return (
          <ExpensePage
            selectedCharacter={selectedCharacter}
            expenses={ledger.expenses}
            onAdd={ledger.createExpense}
            onRemove={ledger.removeExpense}
          />
        )
      case 'gather':
        return (
          <GatherPage
            selectedCharacter={selectedCharacter}
            gathers={ledger.gathers}
            onAdd={ledger.createGather}
            onRemove={ledger.removeGather}
          />
        )
      case 'analytics':
        return (
          <AnalyticsPage
            characters={characters}
            selectedCharacter={selectedCharacter}
            currentMonth={ledger.currentMonth}
            accountSummary={ledger.accountSummary}
            accountSummaryAll={ledger.accountSummaryAll}
            dailyNet={ledger.dailyNet}
            expenseByCategory={ledger.expenseByCategory}
            characterSummaries={ledger.characterSummaries}
          />
        )
      case 'goals':
        return (
          <GoalsPage
            characters={characters}
            selectedCharacter={selectedCharacter}
            goals={ledger.goals}
            currentMonth={ledger.currentMonth}
            getGoalProgress={ledger.getGoalProgress}
            onSave={ledger.saveGoal}
            onRemove={ledger.removeGoal}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex">
      <Sidebar
        characters={characters}
        selectedCharacter={selectedCharacter}
        onSelectCharacter={selectCharacter}
        onAddCharacter={addCharacter}
        onRemoveCharacter={removeCharacter}
        onReorderCharacters={reorderCharacters}
      />

      <div className="flex-1 flex flex-col min-h-screen pb-16 lg:pb-0">
        <MobileHeader
          characters={characters}
          selectedCharacter={selectedCharacter}
          onSelectCharacter={selectCharacter}
          onAddCharacter={addCharacter}
          onRemoveCharacter={removeCharacter}
          onReorderCharacters={reorderCharacters}
        />

        <div className="hidden lg:flex border-b border-dark-border/60 bg-dark-surface/50 backdrop-blur-md px-6 py-2 gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                currentPage === item.id
                  ? 'nav-active'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-panel/50'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        <main className="flex-1 p-4 lg:p-6 max-w-5xl mx-auto w-full">
          {combinedError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              저장 오류: {combinedError}
            </div>
          )}
          {renderPage()}
        </main>
      </div>

      <BottomNav currentPage={currentPage} onNavigate={setPage} />
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (window.location.pathname === '/auth/callback') {
    return <AuthCallbackPage />
  }

  if (loading) return <LoadingScreen />
  if (!user) return <LoginPage />

  return <MainApp />
}
