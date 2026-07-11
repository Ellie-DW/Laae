import { useState } from 'react'
import type { Character } from '../../types'

interface NexonCharacterPanelProps {
  character: Character
  onSync: (characterId: string) => Promise<void>
  onClear: (characterId: string) => Promise<void>
  variant?: 'default' | 'sidebar'
}

export default function NexonCharacterPanel({
  character,
  onSync,
  onClear,
  variant = 'default',
}: NexonCharacterPanelProps) {
  const [loading, setLoading] = useState(false)
  const profile = character.nexonProfile
  const isSidebar = variant === 'sidebar'

  const handleSync = async () => {
    setLoading(true)
    try {
      await onSync(character.id)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    if (!confirm('메이플 API 연동을 해제할까요?')) return
    setLoading(true)
    try {
      await onClear(character.id)
    } finally {
      setLoading(false)
    }
  }

  const shellClass = isSidebar
    ? 'mb-4 p-3 rounded-xl bg-dark-panel/80 border border-maple-500/20'
    : 'mt-4 p-3 rounded-lg bg-dark-surface/50 border border-dark-border'

  if (!profile) {
    return (
      <div className={`${shellClass} ${isSidebar ? 'border-dark-border' : ''}`}>
        {isSidebar && (
          <p className="text-center text-sm font-semibold text-slate-300 mb-3">{character.name}</p>
        )}
        <div className={`${isSidebar ? '' : ''} text-center`}>
          <div
            className={`mx-auto rounded-lg bg-dark-bg/80 border border-dashed border-dark-border flex items-center justify-center ${
              isSidebar ? 'w-full h-56' : 'w-16 h-16'
            }`}
          >
            <span className="text-3xl opacity-40">🍁</span>
          </div>
        </div>
        {!isSidebar && <p className="text-xs text-slate-500 mb-2 mt-3">메이플 Open API</p>}
        <button
          type="button"
          onClick={handleSync}
          disabled={loading}
          className={`w-full btn-secondary disabled:opacity-50 ${isSidebar ? 'text-sm py-2.5 mt-4' : 'text-xs py-2'}`}
        >
          {loading ? '연동 중...' : '다시 연동'}
        </button>
        <p className={`text-slate-600 mt-2 leading-relaxed text-center ${isSidebar ? 'text-xs' : 'text-[10px]'}`}>
          캐릭터 추가 시 자동으로 연동됩니다. 실패하면 다시 시도해 주세요.
        </p>
      </div>
    )
  }

  return (
    <div className={shellClass}>
      {isSidebar ? (
        <div className="text-center">
          <div className="relative h-52 overflow-hidden rounded-lg bg-gradient-to-b from-dark-bg/20 to-dark-bg/60">
            <img
              src={profile.character_image}
              alt=""
              className="absolute left-1/2 bottom-0 block h-40 w-auto max-w-none -translate-x-1/2 translate-y-14 scale-[2.2] origin-bottom drop-shadow-[0_10px_28px_rgba(0,0,0,0.55)]"
            />
          </div>
          <p className="text-lg font-bold text-slate-100 mt-3 truncate">{profile.character_name}</p>
          <p className="text-sm text-cyber-300 mt-1">
            Lv.{profile.character_level} · {profile.character_class}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {profile.world_name}
            {profile.character_guild_name ? ` · ${profile.character_guild_name}` : ''}
          </p>
          {character.nexonSyncedAt && (
            <p className="text-[10px] text-slate-600 mt-2">
              갱신: {character.nexonSyncedAt.slice(0, 10)}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <img
            src={profile.character_image}
            alt=""
            className="w-12 h-12 rounded-lg bg-dark-bg object-cover shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-200 truncate">{profile.character_name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Lv.{profile.character_level} · {profile.character_class}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {profile.world_name}
              {profile.character_guild_name ? ` · ${profile.character_guild_name}` : ''}
            </p>
            {character.nexonSyncedAt && (
              <p className="text-[10px] text-slate-600 mt-1">
                갱신: {character.nexonSyncedAt.slice(0, 10)}
              </p>
            )}
          </div>
        </div>
      )}

      <div className={`flex gap-2 ${isSidebar ? 'mt-4' : 'mt-3'}`}>
        <button
          type="button"
          onClick={handleSync}
          disabled={loading}
          className={`flex-1 btn-secondary disabled:opacity-50 ${isSidebar ? 'text-sm py-2' : 'text-xs py-1.5'}`}
        >
          {loading ? '갱신 중...' : '새로고침'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={loading}
          className={`text-slate-500 hover:text-red-400 disabled:opacity-50 ${
            isSidebar ? 'text-sm px-3 py-2' : 'text-xs px-2 py-1.5'
          }`}
        >
          해제
        </button>
      </div>
    </div>
  )
}
