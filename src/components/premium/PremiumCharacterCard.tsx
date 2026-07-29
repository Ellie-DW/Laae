import type { Character } from '../../types'
import type { LedgerSummary } from '../../lib/ledgerAnalytics'
import type { PremiumCharacterGroup } from '../../lib/premiumGroupsApi'
import { formatMesoKorean } from '../../utils'

interface PremiumCharacterCardProps {
  character: Character
  summary?: LedgerSummary
  groups?: PremiumCharacterGroup[]
  onGroupChange?: (groupId: string | null) => void
  onClick?: () => void
}

function buildHashtags(character: Character): string {
  const profile = character.nexonProfile
  if (!profile) return '#연동필요'

  const tags: string[] = []
  if (profile.character_class) tags.push(`#${profile.character_class.replace(/\s+/g, '')}`)
  if (profile.world_name) tags.push(`#${profile.world_name}`)
  if (profile.character_guild_name) tags.push(`#${profile.character_guild_name}`)
  return tags.slice(0, 3).join(' ')
}

function buildDescription(character: Character): string {
  const profile = character.nexonProfile
  if (!profile) {
    return '메이플 Open API 연동 후 상세 정보가 표시돼요'
  }

  const parts = [
    `Lv.${profile.character_level}`,
    profile.character_class,
    profile.world_name,
  ]
  if (profile.character_guild_name) parts.push(profile.character_guild_name)
  return parts.join(' · ')
}

export default function PremiumCharacterCard({
  character,
  summary,
  groups = [],
  onGroupChange,
  onClick,
}: PremiumCharacterCardProps) {
  const profile = character.nexonProfile
  const displayName = profile?.character_name ?? character.name
  const netProfit = summary?.netProfit ?? 0

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      className="group w-full text-left transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 rounded-xl"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-b from-dark-panel/80 to-dark-bg border border-dark-border/60 group-hover:border-violet-500/30 transition-colors">
        {profile?.character_image ? (
          <img
            src={profile.character_image}
            alt=""
            draggable={false}
            className="absolute left-1/2 bottom-0 block h-[88%] w-auto max-w-none -translate-x-1/2 translate-y-[18%] scale-[1.85] origin-bottom object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:scale-[1.92]"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-dark-surface/60">
            <span className="text-4xl opacity-50">🍁</span>
            <span className="text-[11px] text-slate-500">연동 필요</span>
          </div>
        )}

        {profile && (
          <span className="absolute top-2 left-2 rounded-md bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-black leading-none">
            Lv.{profile.character_level}
          </span>
        )}

        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[10px] text-slate-200 backdrop-blur-sm">
          <span aria-hidden>💰</span>
          {formatMesoKorean(netProfit)}
        </span>
      </div>

      <h3 className="mt-2.5 text-sm font-bold text-slate-100 truncate group-hover:text-violet-200 transition-colors">
        {displayName}
      </h3>
      <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[2.5rem]">
        {buildDescription(character)}
      </p>
      <p className="mt-1.5 text-[11px] text-slate-600 truncate">{buildHashtags(character)}</p>

      {onGroupChange && groups.length > 0 && (
        <label
          className="mt-2 block"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <span className="sr-only">그룹 선택</span>
          <select
            value={character.premiumGroupId ?? ''}
            onChange={(e) => onGroupChange(e.target.value || null)}
            className="w-full rounded-lg border border-dark-border bg-dark-surface/80 px-2 py-1.5 text-[11px] text-slate-400 focus:border-violet-500/40 focus:outline-none"
          >
            <option value="">미분류</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}
