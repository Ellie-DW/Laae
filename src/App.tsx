import { useEffect, useMemo } from 'react'
import Sidebar from './components/layout/Sidebar'
import BottomNav from './components/layout/BottomNav'
import MobileHeader from './components/layout/MobileHeader'
import { getNavItems } from './components/layout/nav'
import NavIcon from './components/layout/NavIcon'
import DashboardPage from './pages/DashboardPage'
import BossPage from './pages/BossPage'
import HuntPage from './pages/HuntPage'
import ExpensePage from './pages/ExpensePage'
import GatherPage from './pages/GatherPage'
import GoalsPage from './pages/GoalsPage'
import RicePage from './pages/RicePage'
import DiaryPage from './pages/DiaryPage'
import DropPage from './pages/DropPage'
import LoginPage from './pages/LoginPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsPage from './pages/TermsPage'
import SiteFooter from './components/layout/SiteFooter'
import { useAppData } from './hooks/useAppData'
import { useLedger } from './hooks/useLedger'
import { useRiceAccess } from './hooks/useRiceAccess'
import { getDiaryEntryTargetPage, type DiaryEntry } from './lib/diaryEntries'
import { computeExpenseByCategory, computeAccountCumulativeNetProfit } from './lib/ledgerAnalytics'
import { useAuth } from './contexts/AuthContext'
import { getWeeklyPeriod } from './utils'
import GridScanBackground from './components/backgrounds/GridScanBackground'
import { useTheme } from './contexts/ThemeContext'

function LoadingScreen({ message = '로딩 중...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
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
    syncNexonProfile,
    clearNexonLink,
    updateBossSelection,
    selectBossDifficulty,
    resetTabSelections,
    selectBossRunnerPreset,
    toggleWeeklyBossCleared,
    toggleMonthlyBossCleared,
  } = useAppData()

  const riceAccess = useRiceAccess()

  const bossIncomeByCharacter = useMemo(
    () => Object.fromEntries(accountStats.perCharacter.map((c) => [c.id, c.bossMeso])),
    [accountStats.perCharacter]
  )

  const weeklyBossIncomeByCharacter = useMemo(
    () => Object.fromEntries(accountStats.perCharacter.map((c) => [c.id, c.weeklyBossMeso])),
    [accountStats.perCharacter]
  )

  const ledger = useLedger(characters, bossIncomeByCharacter, weeklyBossIncomeByCharacter, {
    riceEnabled: riceAccess.hasAccess,
  })

  const navItems = getNavItems(riceAccess.hasAccess)

  const riceHeldMeso = useMemo(
    () =>
      computeAccountCumulativeNetProfit(
        ledger.hunts,
        ledger.gathers,
        ledger.drops,
        ledger.expenses,
        ledger.snapshots,
        characters,
        bossDataMap
      ),
    [ledger.hunts, ledger.gathers, ledger.drops, ledger.expenses, ledger.snapshots, characters, bossDataMap]
  )

  useEffect(() => {
    if (!riceAccess.loading && currentPage === 'rice' && !riceAccess.hasAccess) {
      setPage('dashboard')
    }
  }, [riceAccess.loading, riceAccess.hasAccess, currentPage, setPage])

  if (dataLoading || ledger.loading || riceAccess.loading) {
    return <LoadingScreen message="데이터 불러오는 중..." />
  }

  const combinedError = syncError || ledger.error || riceAccess.error
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

  const handleDiaryNavigate = (entry: DiaryEntry) => {
    const page = getDiaryEntryTargetPage(entry)
    if (!page) return
    if (entry.characterId) selectCharacter(entry.characterId)
    setPage(page)
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
            onGoGoals={() => setPage('goals')}
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
            diaryNotes={ledger.diaryNotes}
            onRemoveHunt={ledger.removeHunt}
            onRemoveGather={ledger.removeGather}
            onRemoveExpense={ledger.removeExpense}
            onRemoveSolErdaPurchase={ledger.removeSolErdaPurchase}
            onRemoveDrop={ledger.removeDrop}
            onCreateNote={ledger.createDiaryNote}
            onSaveNote={ledger.saveDiaryNote}
            onRemoveNote={ledger.removeDiaryNote}
            onNavigateToSource={handleDiaryNavigate}
            goals={ledger.goals}
            getGoalProgress={ledger.getGoalProgress}
            onGoGoals={() => setPage('goals')}
          />
        )
      case 'boss':
        return (
          <BossPage
            selectedCharacter={selectedCharacter}
            bossData={bossData}
            onUpdateBoss={updateBossSelection}
            onSelectBossDifficulty={selectBossDifficulty}
            onResetTab={resetTabSelections}
            onSelectBossRunnerPreset={selectBossRunnerPreset}
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
            characters={characters}
            expenses={ledger.expenses}
            hunts={ledger.hunts}
            onAdd={ledger.createExpense}
            onSaveMemo={ledger.saveExpenseMemo}
            onRemove={ledger.removeExpense}
            onSpendSolErda={ledger.spendSolErda}
            onPurchaseSolErda={ledger.purchaseSolErda}
            onRemoveSolErdaPurchase={ledger.removeSolErdaPurchase}
            onRemoveHunt={ledger.removeHunt}
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
      case 'goals':
        return (
          <GoalsPage
            characters={characters}
            goals={ledger.goals}
            getGoalProgress={ledger.getGoalProgress}
            onSave={ledger.saveGoal}
            onRemove={ledger.removeGoal}
          />
        )
      case 'rice':
        if (!riceAccess.hasAccess) return null
        return (
          <RicePage
            records={ledger.riceRecords}
            heldMeso={riceHeldMeso}
            onAdd={ledger.createRiceRecord}
            onRemove={ledger.removeRiceRecord}
            isOwner={riceAccess.isOwner}
            grants={riceAccess.grants}
            onGrantAccess={riceAccess.grantAccess}
            onRevokeAccess={riceAccess.revokeAccess}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        characters={characters}
        selectedCharacter={selectedCharacter}
        onSelectCharacter={selectCharacter}
        onAddCharacter={addCharacter}
        onRemoveCharacter={removeCharacter}
        onReorderCharacters={reorderCharacters}
        onSyncNexonProfile={syncNexonProfile}
        onClearNexonLink={clearNexonLink}
      />

      <div className="flex-1 flex flex-col min-h-screen pb-16 lg:pb-0">
        <MobileHeader
          characters={characters}
          selectedCharacter={selectedCharacter}
          onSelectCharacter={selectCharacter}
          onAddCharacter={addCharacter}
          onRemoveCharacter={removeCharacter}
          onReorderCharacters={reorderCharacters}
          onSyncNexonProfile={syncNexonProfile}
          onClearNexonLink={clearNexonLink}
        />

        <div className="hidden lg:flex border-b border-dark-border/60 bg-dark-surface/50 backdrop-blur-md px-6 py-2 gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                currentPage === item.id
                  ? 'nav-active'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-panel/50'
              }`}
            >
              <NavIcon page={item.id} size="sm" active={currentPage === item.id} />
              {item.label}
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

        <SiteFooter />
      </div>

      <BottomNav currentPage={currentPage} onNavigate={setPage} hasRiceAccess={riceAccess.hasAccess} />
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  const { theme } = useTheme()

  const content = (() => {
    const pathname = window.location.pathname

    if (pathname === '/auth/callback') {
      return <AuthCallbackPage />
    }

    if (pathname === '/privacy') {
      return <PrivacyPolicyPage />
    }

    if (pathname === '/terms') {
      return <TermsPage />
    }

    if (loading) return <LoadingScreen />
    if (!user) return <LoginPage />

    return <MainApp />
  })()

  return (
    <>
      <GridScanBackground theme={theme} />
      <div className="relative z-0 min-h-screen">{content}</div>
    </>
  )
}
