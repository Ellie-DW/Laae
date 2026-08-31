import type { Character, CharacterBossData } from '../../types'
import type { AccountStats, MonthlyExpectedBossStats } from '../../lib/bossStats'
import {
  calculateMonthlyExpectedBossStats,
  getBossClearStatus,
  getPlannedBossCycles,
  isMonthlyBossCleared,
  isWeeklyBossCleared,
} from '../../lib/bossStats'
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
  onShowAll: (value: boolean) => void
  onGoBoss: () => void
  onSelectCharacter: (id: string) => void
  onToggleWeeklyBossCleared: (characterId: string) => void
  onToggleMonthlyBossCleared: (characterId: string) => void
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
  onShowAll,
  onGoBoss,
  onSelectCharacter,
  onToggleWeeklyBossCleared,
  onToggleMonthlyBossCleared,
}: HomeBossSectionProps) {
  if (characters.length === 0) {
    return (
      <section className="panel-light px-5 py-10 text-center">
        <p className="text-sm text-slate-300">캐릭터를 먼저 추가해주세요</p>
        <p className="text-xs text-slate-500 mt-1">왼쪽 목록이나 위쪽 캐릭터 버튼에서 추가할 수 있어요</p>
      </section>
    )
  }

  const hasExpected = expected.weeklyPerWeek > 0 || expected.monthlyExpectedTotal > 0
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

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

        {hasExpected && (
          <div className="mt-4 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-500">주간 예상</p>
              <p className="mt-1 text-xl font-semibold text-slate-100 tracking-tight">
                {formatMesoKorean(expected.weeklyPerWeek)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{currentMonth} 월간 예상</p>
              <p className="mt-1 text-xl font-semibold text-slate-100 tracking-tight">
                {formatMesoKorean(expected.monthlyExpectedTotal)}
              </p>
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
              onSelectCharacter={onSelectCharacter}
              onToggleWeeklyBossCleared={onToggleWeeklyBossCleared}
              onToggleMonthlyBossCleared={onToggleMonthlyBossCleared}
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
  onSelectCharacter,
  onToggleWeeklyBossCleared,
  onToggleMonthlyBossCleared,
}: {
  character: Character
  char: AccountStats['perCharacter'][number] | undefined
  bossData: CharacterBossData
  currentMonth: string
  isSelected: boolean
  onSelectCharacter: (id: string) => void
  onToggleWeeklyBossCleared: (characterId: string) => void
  onToggleMonthlyBossCleared: (characterId: string) => void
}) {
  if (!char) return null

  const { hasWeekly, hasMonthly, weeklyCount, monthlyCount, count: plannedCount } = getPlannedBossCycles(bossData)
  const weekCleared = isWeeklyBossCleared(bossData)
  const monthCleared = isMonthlyBossCleared(bossData)
  const clearStatus = getBossClearStatus(bossData)
  const monthlyExpected = calculateMonthlyExpectedBossStats(bossData, currentMonth, getToday())
  const weeklyMeso = hasWeekly ? monthlyExpected.weeklyPerWeek : 0
  const monthlyMeso = hasMonthly ? monthlyExpected.monthlyPerMonth : 0

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
      </div>

      <button
        type="button"
        onClick={() => onSelectCharacter(character.id)}
        className="flex-1 min-w-0 flex items-center gap-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span
            className={`block text-sm font-semibold truncate ${
              clearStatus.tone === 'done' ? 'text-slate-400' : 'text-slate-100'
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
          </span>
        </span>
        <MesoStack
          weekly={weeklyMeso}
          monthly={monthlyMeso}
          weekCleared={weekCleared}
          monthCleared={monthCleared}
        />
      </button>
    </li>
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
