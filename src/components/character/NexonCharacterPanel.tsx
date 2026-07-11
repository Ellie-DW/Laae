import { useState } from 'react'
import type { Character } from '../../types'

interface NexonCharacterPanelProps {
  character: Character
  onSync: (characterId: string) => Promise<void>
  onClear: (characterId: string) => Promise<void>
  compact?: boolean
}

export default function NexonCharacterPanel({
  character,
  onSync,
  onClear,
  compact = false,
}: NexonCharacterPanelProps) {
  const [loading, setLoading] = useState(false)
  const profile = character.nexonProfile

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

  if (!profile) {
    return (
      <div className={compact ? 'mt-3' : 'mt-4 p-3 rounded-lg bg-dark-surface/50 border border-dark-border'}>
        <p className="text-xs text-slate-500 mb-2">메이플 Open API</p>
        <button
          type="button"
          onClick={handleSync}
          disabled={loading}
          className="w-full btn-secondary text-xs py-2 disabled:opacity-50"
        >
          {loading ? '연동 중...' : '다시 연동'}
        </button>
        <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">
          캐릭터 추가 시 자동으로 연동됩니다. 실패하면 다시 시도해 주세요.
        </p>
      </div>
    )
  }

  return (
    <div className={compact ? 'mt-3' : 'mt-4 p-3 rounded-lg bg-dark-surface/50 border border-maple-500/20'}>
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
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={handleSync}
          disabled={loading}
          className="flex-1 btn-secondary text-xs py-1.5 disabled:opacity-50"
        >
          {loading ? '갱신 중...' : '새로고침'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={loading}
          className="text-xs px-2 py-1.5 text-slate-500 hover:text-red-400 disabled:opacity-50"
        >
          해제
        </button>
      </div>
    </div>
  )
}
