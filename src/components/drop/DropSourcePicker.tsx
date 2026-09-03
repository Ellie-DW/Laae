import type { BossDefinition, BossDifficulty } from '../../types'
import { BOSSES } from '../../data/bosses'
import { getBossDropTable } from '../../data/bossDrops'
import { DIFFICULTY_COLORS } from '../../utils'

interface DropSourcePickerProps {
  bossId: string
  difficulty: BossDifficulty | ''
  /** 캐릭터 보스 설정에서 고른 난이도. 보스를 고르면 이 값으로 채움 */
  preferredDifficulties?: Partial<Record<string, BossDifficulty>>
  onChange: (bossId: string, difficulty: BossDifficulty) => void
}

function difficultyOnBoss(boss: BossDefinition, difficulty: BossDifficulty | '' | undefined) {
  if (!difficulty) return false
  return boss.difficulties.some((diff) => diff.difficulty === difficulty)
}

function resolveBossDifficulty(
  boss: BossDefinition,
  preferred: BossDifficulty | undefined,
  current: BossDifficulty | ''
): BossDifficulty {
  if (difficultyOnBoss(boss, preferred)) return preferred as BossDifficulty
  if (difficultyOnBoss(boss, current)) return current as BossDifficulty
  return boss.difficulties[0].difficulty
}

const DROP_BOSSES = BOSSES.filter((boss) => getBossDropTable(boss.id))
const BOSS_GROUPS = [...new Set(DROP_BOSSES.map((boss) => boss.group))]

export default function DropSourcePicker({
  bossId,
  difficulty,
  preferredDifficulties,
  onChange,
}: DropSourcePickerProps) {
  const boss = BOSSES.find((item) => item.id === bossId)
  const preferred = bossId ? preferredDifficulties?.[bossId] : undefined

  const handleBossChange = (nextBossId: string) => {
    const nextBoss = BOSSES.find((item) => item.id === nextBossId)
    if (!nextBoss) return
    onChange(nextBossId, resolveBossDifficulty(nextBoss, preferredDifficulties?.[nextBossId], difficulty))
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-500 mb-1 block">보스</label>
        <select
          value={bossId}
          onChange={(e) => handleBossChange(e.target.value)}
          className="input-field text-sm"
        >
          <option value="">보스 선택</option>
          {BOSS_GROUPS.map((group) => (
            <optgroup key={group} label={group}>
              {DROP_BOSSES.filter((item) => item.group === group).map((item) => (
                <option key={item.id} value={item.id}>
                  {preferredDifficulties?.[item.id]
                    ? `${item.name} · ${preferredDifficulties[item.id]}`
                    : item.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      {boss && (
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">
            난이도
            {preferred ? ` · 설정 ${preferred}` : ''}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {boss.difficulties.map((diff) => (
              <button
                key={diff.difficulty}
                type="button"
                onClick={() => onChange(boss.id, diff.difficulty)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  difficulty === diff.difficulty
                    ? DIFFICULTY_COLORS[diff.difficulty] + ' border'
                    : 'border-dark-border text-slate-500 hover:text-slate-300'
                }`}
              >
                {diff.difficulty}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
