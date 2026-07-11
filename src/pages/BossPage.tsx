import { useMemo, useState } from 'react'
import type { Character, CharacterBossData, BossTab } from '../types'
import { calculatePlannedBossStats, calculateMonthlyExpectedBossStats, MAX_WEEKLY_BOSSES } from '../lib/bossStats'
import { BOSS_TABS, getBossesByTab } from '../data/bosses'
import { formatMesoKorean, getWeeklyPeriod, getMonthlyPeriod, getCurrentMonth, getToday } from '../utils'
import BossCard from '../components/boss/BossCard'
import SelectedBossSummary from '../components/boss/SelectedBossSummary'

interface BossPageProps {
  selectedCharacter: Character | null
  bossData: CharacterBossData
  onUpdateBoss: (bossId: string, difficulty: string, updates: Partial<CharacterBossData['selections'][0]>) => void
  onSelectBossDifficulty: (bossId: string, difficulty: string | null) => void
  onResetTab: (tab: string) => void
}

export default function BossPage({
  selectedCharacter,
  bossData,
  onUpdateBoss,
  onSelectBossDifficulty,
  onResetTab,
}: BossPageProps) {
  const [activeTab, setActiveTab] = useState<BossTab>('grandis')
  const week = getWeeklyPeriod()
  const month = getMonthlyPeriod()
  const tabInfo = BOSS_TABS.find((t) => t.id === activeTab)!
  const bosses = getBossesByTab(activeTab)
  const plannedStats = useMemo(() => calculatePlannedBossStats(bossData), [bossData])
  const monthlyExpected = useMemo(
    () => calculateMonthlyExpectedBossStats(bossData, getCurrentMonth(), getToday()),
    [bossData]
  )

  if (!selectedCharacter) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4 drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]">🍁</span>
        <h2 className="text-lg font-semibold text-slate-300">아직 선택된 캐릭터가 없어요</h2>
        <p className="text-sm text-slate-500 mt-2">캐릭터를 추가해주세요</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">보스 수익</h1>
        <p className="text-sm text-slate-400 mt-1">
          난이도·파티는 여기서 설정하고, 잡음 체크는 대시보드에서 하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="panel-light p-4">
          <p className="text-xs text-cyber-400 font-medium mb-1">주간 기간 (목~수)</p>
          <p className="text-sm text-slate-300">{week.label}</p>
        </div>
        <div className="panel-light p-4 border-maple-500/20">
          <p className="text-xs text-maple-400 font-medium mb-1">월간 기간 (검은 마법사)</p>
          <p className="text-sm text-slate-300">{month.label}</p>
        </div>
      </div>

      <div className="panel-glow p-5 bg-gradient-to-r from-cyber-900/30 to-maple-900/20 border-cyber-700/30">
        <p className="text-sm text-slate-400">이번 주 예상 보스 수익</p>
        <p className="text-3xl font-bold text-maple-400 mt-1 font-display tracking-wide">
          {formatMesoKorean(plannedStats.bossMeso)}
        </p>
        <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
          <span>주간 {formatMesoKorean(plannedStats.weeklyBossMeso)}</span>
          <span>월간 주기 {formatMesoKorean(plannedStats.monthlyBossMeso)}</span>
          <span>주간 보스 {plannedStats.weeklyPlannedBossCount}/{MAX_WEEKLY_BOSSES}개</span>
          <span>선택 {plannedStats.plannedBossCount}개</span>
        </div>
        <p className="text-[10px] text-slate-600 mt-2">난이도를 선택하면 예상 수익에 바로 반영돼요. 잡음 체크는 대시보드에서 하세요.</p>
      </div>

      <div className="panel-light p-5 border-maple-500/20">
        <p className="text-sm text-slate-400">{monthlyExpected.targetMonth} 월간 예상 보스 수익</p>
        <p className="text-2xl font-bold text-maple-400 mt-1 font-display tracking-wide">
          {formatMesoKorean(monthlyExpected.monthlyExpectedTotal)}
        </p>
        <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
          {monthlyExpected.weeklyPerWeek > 0 && (
            <span>
              주간 환산 {formatMesoKorean(monthlyExpected.weeklyInMonthTotal)}
              {monthlyExpected.weeksInMonth > 0 && ` (${formatMesoKorean(monthlyExpected.weeklyPerWeek)} × ${monthlyExpected.weeksInMonth}주)`}
            </span>
          )}
          {monthlyExpected.monthlyPerMonth > 0 && (
            <span>+ 월간 주기 {formatMesoKorean(monthlyExpected.monthlyPerMonth)}</span>
          )}
        </div>
        <p className="text-[10px] text-slate-600 mt-2">
          달 경계 주는 잡은 달에만 포함돼요. 아직 안 잡은 주는 이번 달 예상에 남아요.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatBox label="예상 주간 보스 (1주)" value={formatMesoKorean(plannedStats.weeklyBossMeso)} highlight />
        <StatBox label="월간 주기 보스 (1회)" value={formatMesoKorean(plannedStats.monthlyBossMeso)} gold />
        <StatBox label={`${monthlyExpected.targetMonth} 월간 예상`} value={formatMesoKorean(monthlyExpected.monthlyExpectedTotal)} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {BOSS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-cyber-600 to-cyber-500 text-white shadow-neon-sm'
                : 'bg-dark-panel/60 text-slate-400 border border-dark-border hover:border-cyber-700/40 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-300">현재 탭 · {tabInfo.label}</p>
          <p className="text-xs text-slate-500">{tabInfo.desc}</p>
        </div>
        <button
          onClick={() => onResetTab(activeTab)}
          className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
        >
          주간 잡음 초기화
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bosses.map((boss) => (
          <BossCard
            key={boss.id}
            boss={boss}
            selections={bossData.selections}
            weeklySelectedCount={plannedStats.weeklyPlannedBossCount}
            maxWeeklyBosses={MAX_WEEKLY_BOSSES}
            onUpdate={onUpdateBoss}
            onSelectDifficulty={onSelectBossDifficulty}
          />
        ))}
      </div>

      <SelectedBossSummary plannedBosses={plannedStats.plannedBosses} />
    </div>
  )
}

function StatBox({ label, value, highlight, gold }: { label: string; value: string; highlight?: boolean; gold?: boolean }) {
  return (
    <div className={`panel-light p-4 text-center ${highlight ? 'border-cyber-700/30' : gold ? 'border-maple-500/20' : ''}`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${
        highlight ? 'text-cyber-400' : gold ? 'text-maple-400' : 'text-slate-100'
      }`}>{value}</p>
    </div>
  )
}
