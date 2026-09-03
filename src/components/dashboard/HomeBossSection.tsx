import { useMemo, useState } from 'react'
import type { Character, CharacterBossData } from '../../types'
import type { AccountStats, MonthlyExpectedBossStats } from '../../lib/bossStats'
import {
  calculateMonthlyExpectedBossStats,
  getPlannedBossCycles,
  isHomeBossCheckComplete,
  isMonthlyBossCleared,
  isWeeklyBossCleared,
} from '../../lib/bossStats'
import {
  formatDurationMinutes,
  formatElapsedMs,
  getWeeklyRouteMinutes,
  sumRemainingWeeklyRoute,
  sumAccountWeeklyRoute,
  weeklyMesoPerHour,
} from '../../lib/bossRouteTime'
import { createDefaultBossData } from '../../lib/appDataApi'
import { formatMesoKorean, getToday } from '../../utils'

interface HomeBossSectionProps {
  characters: Character[]
  visibleCharacters: Character[]
  selectedCharacterId: string | null
  charStatsById: Record<string, AccountStats['perCharacter'][number]>
  bossDataMap: Record<string, CharacterBossData>
  currentMonth: string
  expected: MonthlyExpectedBossStats
  done: number
  pending: number
  total: number
  showAll: boolean
  runningCharacterId: string | null
  elapsedMs: number
  onShowAll: (value: boolean) => void
  onGoBoss: () => void
  onSelectCharacter: (id: string) => void
  onToggleWeeklyBossCleared: (characterId: string) => void
  onToggleMonthlyBossCleared: (characterId: string) => void
  onSetWeeklyRouteMinutes: (characterId: string, minutes: number | null) => void
  onStartRouteTimer: (characterId: string) => void
  onStopRouteTimer: () => void
}

export default function HomeBossSection({
  characters,
  visibleCharacters,
  selectedCharacterId,
  charStatsById,
  bossDataMap,
  currentMonth,
  expected,
  done,
  pending,
  total,
  showAll,
  runningCharacterId,
  elapsedMs,
  onShowAll,
  onGoBoss,
  onSelectCharacter,
  onToggleWeeklyBossCleared,
  onToggleMonthlyBossCleared,
  onSetWeeklyRouteMinutes,
  onStartRouteTimer,
  onStopRouteTimer,
}: HomeBossSectionProps) {
  const remaining = useMemo(
    () => sumRemainingWeeklyRoute(characters, bossDataMap, createDefaultBossData()),
    [characters, bossDataMap]
  )
  const accountRoute = useMemo(
    () => sumAccountWeeklyRoute(characters, bossDataMap, createDefaultBossData()),
    [characters, bossDataMap]
  )
  const hasExpected = expected.weeklyPerWeek > 0 || expected.monthlyExpectedTotal > 0
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  if (characters.length === 0) {
    return (
      <section className="panel-light px-5 py-10 text-center">
        <p className="text-sm text-slate-300">캐릭터를 먼저 추가해주세요</p>
        <p className="text-xs text-slate-500 mt-1">왼쪽 목록이나 위쪽 캐릭터 버튼에서 추가할 수 있어요</p>
      </section>
    )
  }

  return (
    <section className="panel-light overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">보스 체크</h2>
            <p className="text-sm text-slate-500 mt-1">
              {done}/{total} 완료
              {pending > 0 ? ` · ${pending}명 남음` : ' · 모두 완료'}
            </p>
            {remaining.minutes > 0 && (
              <p className="text-xs text-cyber-300 mt-1">
                남은 약 {formatDurationMinutes(remaining.minutes)}
                {remaining.pendingWithoutTime > 0 ? ` · ${remaining.pendingWithoutTime}명 미입력` : ''}
              </p>
            )}
            {remaining.minutes <= 0 && remaining.pendingWithoutTime > 0 && (
              <p className="text-xs text-slate-600 mt-1">시간을 입력하면 남은 소요를 계산해요</p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0 pt-0.5">
            <button
              type="button"
              onClick={() => onShowAll(!showAll)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              {showAll ? '미완료만' : '전체 보기'}
            </button>
            <button type="button" onClick={onGoBoss} className="text-xs text-cyber-400 hover:text-cyber-300">
              설정
            </button>
          </div>
        </div>

        <div className="mt-3 h-px bg-dark-border/70">
          <div
            className="h-px bg-cyber-400/80 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {(hasExpected || accountRoute.mesoPerHour != null) && (
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-slate-500">주간 예상</p>
              <p className="mt-1 text-xl font-semibold text-slate-100 tracking-tight">
                {formatMesoKorean(expected.weeklyPerWeek)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">월간 보스</p>
              <p className="mt-1 text-xl font-semibold text-slate-100 tracking-tight">
                {formatMesoKorean(expected.monthlyPerMonth)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">종합 시간당</p>
              <p className="mt-1 text-xl font-semibold text-slate-100 tracking-tight">
                {accountRoute.mesoPerHour != null ? formatMesoKorean(accountRoute.mesoPerHour) : '-'}
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {accountRoute.minutes > 0
                  ? `${formatDurationMinutes(accountRoute.minutes)}${accountRoute.missing > 0 ? ` · ${accountRoute.missing}명 미입력` : ''}`
                  : '시간을 입력하면 계산해요'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{currentMonth} 월간 예상</p>
              <p className="mt-1 text-xl font-semibold text-slate-100 tracking-tight">
                {formatMesoKorean(expected.monthlyExpectedTotal)}
              </p>
              {expected.monthlyPerMonth > 0 && (
                <p className="text-[11px] text-slate-600 mt-0.5">
                  주간 보스 {formatMesoKorean(expected.weeklyInMonthTotal)} + 월간 보스 {formatMesoKorean(expected.monthlyPerMonth)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {visibleCharacters.length === 0 ? (
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={() => onShowAll(true)}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            전체 캐릭터 보기
          </button>
        </div>
      ) : (
        <ul className="record-list-scroll-tall space-y-2 px-5 pb-5">
          {visibleCharacters.map((character) => (
            <BossCharacterRow
              key={character.id}
              character={character}
              char={charStatsById[character.id]}
              bossData={bossDataMap[character.id] ?? createDefaultBossData()}
              currentMonth={currentMonth}
              isSelected={selectedCharacterId === character.id}
              isTimerRunning={runningCharacterId === character.id}
              elapsedMs={runningCharacterId === character.id ? elapsedMs : 0}
              onSelectCharacter={onSelectCharacter}
              onToggleWeeklyBossCleared={onToggleWeeklyBossCleared}
              onToggleMonthlyBossCleared={onToggleMonthlyBossCleared}
              onSetWeeklyRouteMinutes={onSetWeeklyRouteMinutes}
              onStartRouteTimer={onStartRouteTimer}
              onStopRouteTimer={onStopRouteTimer}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function BossCharacterRow({
  character,
  char,
  bossData,
  currentMonth,
  isSelected,
  isTimerRunning,
  elapsedMs,
  onSelectCharacter,
  onToggleWeeklyBossCleared,
  onToggleMonthlyBossCleared,
  onSetWeeklyRouteMinutes,
  onStartRouteTimer,
  onStopRouteTimer,
}: {
  character: Character
  char: AccountStats['perCharacter'][number] | undefined
  bossData: CharacterBossData
  currentMonth: string
  isSelected: boolean
  isTimerRunning: boolean
  elapsedMs: number
  onSelectCharacter: (id: string) => void
  onToggleWeeklyBossCleared: (characterId: string) => void
  onToggleMonthlyBossCleared: (characterId: string) => void
  onSetWeeklyRouteMinutes: (characterId: string, minutes: number | null) => void
  onStartRouteTimer: (characterId: string) => void
  onStopRouteTimer: () => void
}) {
  if (!char) return null

  const { hasWeekly, hasMonthly, weeklyCount, monthlyCount, count: plannedCount } = getPlannedBossCycles(bossData)
  const weekCleared = isWeeklyBossCleared(bossData)
  const monthCleared = isMonthlyBossCleared(bossData)
  const homeComplete = isHomeBossCheckComplete(bossData)
  const monthlyExpected = calculateMonthlyExpectedBossStats(bossData, currentMonth, getToday())
  const weeklyMeso = hasWeekly ? monthlyExpected.weeklyPerWeek : 0
  const monthlyMeso = hasMonthly ? monthlyExpected.monthlyPerMonth : 0
  const routeMinutes = getWeeklyRouteMinutes(bossData)
  const mesoPerHour = routeMinutes ? weeklyMesoPerHour(weeklyMeso, routeMinutes) : null

  return (
    <li
      className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 ${
        isSelected
          ? 'border-cyber-500/30 bg-cyber-500/5'
          : 'border-dark-border/60 bg-dark-surface/30'
      }`}
    >
      <div className="flex gap-1.5 shrink-0">
        {hasWeekly && (
          <CycleDot
            label="주"
            checked={weekCleared}
            title={weekCleared ? '주간 잡음 해제' : '주간 보스 잡음'}
            onToggle={() => onToggleWeeklyBossCleared(character.id)}
          />
        )}
        {hasMonthly && (
          <CycleDot
            label="월"
            checked={monthCleared}
            title={monthCleared ? '월간 잡음 해제' : '월간 보스 잡음'}
            onToggle={() => onToggleMonthlyBossCleared(character.id)}
          />
        )}
        {!hasWeekly && !hasMonthly && <span className="w-8 h-8 rounded-full border border-dashed border-dark-border" />}
        {hasWeekly && (
          <TimerButton
            running={isTimerRunning}
            elapsedMs={elapsedMs}
            onStart={() => onStartRouteTimer(character.id)}
            onStop={onStopRouteTimer}
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => onSelectCharacter(character.id)}
        className="flex-1 min-w-0 flex items-center gap-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span
            className={`block text-sm font-semibold truncate ${
              homeComplete ? 'text-slate-400' : 'text-slate-100'
            }`}
          >
            {character.name}
          </span>
          <span className="block text-xs text-slate-500 mt-0.5 truncate">
            {plannedCount === 0
              ? '보스 미설정'
              : [weeklyCount > 0 && `주간 ${weeklyCount}`, monthlyCount > 0 && `월간 ${monthlyCount}`]
                  .filter(Boolean)
                  .join(' · ')}
            {mesoPerHour != null ? ` · ${formatMesoKorean(mesoPerHour)}/시간` : ''}
          </span>
        </span>
        <MesoStack
          weekly={weeklyMeso}
          monthly={monthlyMeso}
          weekCleared={weekCleared}
          monthCleared={monthCleared}
        />
      </button>

      {hasWeekly && (
        <RouteMinutesField
          minutes={routeMinutes}
          running={isTimerRunning}
          elapsedMs={elapsedMs}
          onSave={(value) => onSetWeeklyRouteMinutes(character.id, value)}
          onStop={onStopRouteTimer}
        />
      )}
    </li>
  )
}

function TimerButton({
  running,
  elapsedMs,
  onStart,
  onStop,
}: {
  running: boolean
  elapsedMs: number
  onStart: () => void
  onStop: () => void
}) {
  if (running) {
    return (
      <button
        type="button"
        onClick={onStop}
        title="다시 눌러 저장"
        className="min-w-8 h-8 px-1.5 rounded-full bg-cyber-500/20 text-[11px] font-semibold tabular-nums text-cyber-300"
      >
        {formatElapsedMs(elapsedMs)}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onStart}
      title="돌이 시작"
      className="w-8 h-8 rounded-full border border-dark-border text-slate-500 hover:border-cyber-500/40 hover:text-slate-300"
    >
      ▶
    </button>
  )
}

function RouteMinutesField({
  minutes,
  running,
  elapsedMs,
  onSave,
  onStop,
}: {
  minutes: number | null
  running: boolean
  elapsedMs: number
  onSave: (minutes: number | null) => void
  onStop: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(minutes != null ? String(minutes) : '')

  const startEdit = () => {
    setDraft(minutes != null ? String(minutes) : '')
    setEditing(true)
  }

  const commit = () => {
    const parsed = Number.parseInt(draft, 10)
    onSave(Number.isFinite(parsed) && parsed > 0 ? parsed : null)
    setEditing(false)
  }

  if (running) {
    return (
      <button
        type="button"
        onClick={onStop}
        title="다시 눌러 저장"
        className="shrink-0 text-xs font-semibold tabular-nums whitespace-nowrap text-cyber-300"
      >
        {formatElapsedMs(elapsedMs)}
      </button>
    )
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        min={1}
        max={720}
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setEditing(false)
        }}
        className="input-field w-14 shrink-0 px-2 py-1 text-xs text-center tabular-nums"
        aria-label="주간 루트 소요 분"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      title="소요 시간 입력"
      className={`shrink-0 text-xs tabular-nums whitespace-nowrap ${
        minutes ? 'text-slate-300 hover:text-slate-100' : 'text-slate-600 hover:text-slate-400'
      }`}
    >
      {minutes ? formatDurationMinutes(minutes) : '시간'}
    </button>
  )
}

function MesoStack({
  weekly,
  monthly,
  weekCleared,
  monthCleared,
}: {
  weekly: number
  monthly: number
  weekCleared: boolean
  monthCleared: boolean
}) {
  if (weekly <= 0 && monthly <= 0) return null

  if (weekly <= 0 || monthly <= 0) {
    const amount = weekly > 0 ? weekly : monthly
    const muted = weekly > 0 ? weekCleared : monthCleared
    return (
      <span
        className={`shrink-0 text-right text-sm font-semibold tabular-nums tracking-tight whitespace-nowrap ${
          muted ? 'text-slate-500' : 'text-slate-100'
        }`}
      >
        {formatMesoKorean(amount)}
      </span>
    )
  }

  return (
    <span className="shrink-0 text-right tabular-nums">
      <span
        className={`block text-sm whitespace-nowrap ${
          weekCleared ? 'text-slate-500' : 'text-slate-200'
        }`}
      >
        <span className="text-[11px] text-slate-500 mr-1">주</span>
        {formatMesoKorean(weekly)}
      </span>
      <span
        className={`block text-sm font-semibold mt-0.5 whitespace-nowrap ${
          monthCleared ? 'text-slate-500' : 'text-slate-100'
        }`}
      >
        <span className="text-[11px] text-slate-500 font-normal mr-1">월</span>
        {formatMesoKorean(monthly)}
      </span>
    </span>
  )
}

function CycleDot({
  label,
  checked,
  title,
  onToggle,
}: {
  label: string
  checked: boolean
  title: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={title}
      className={`w-8 h-8 rounded-full text-[11px] font-semibold transition-colors ${
        checked
          ? 'bg-cyber-500 text-white'
          : 'border border-dark-border text-slate-500 hover:border-cyber-500/40 hover:text-slate-300'
      }`}
    >
      {checked ? '✓' : label}
    </button>
  )
}
