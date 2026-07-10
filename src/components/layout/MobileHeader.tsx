import type { Character } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import {
  DUPLICATE_CHARACTER_NAME_MESSAGE,
  normalizeCharacterName,
} from '../../lib/characters'
import { isGlobalCharacterNameTaken } from '../../lib/appDataApi'

interface MobileHeaderProps {
  selectedCharacter: Character | null
  onAddCharacter: (name: string) => void
  onRemoveCharacter: (id: string) => void
}

export default function MobileHeader({
  selectedCharacter,
  onAddCharacter,
  onRemoveCharacter,
}: MobileHeaderProps) {
  const { user, signOut } = useAuth()

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-dark-surface/80 backdrop-blur-lg border-b border-dark-border/60 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍁</span>
          <span className="font-display font-bold text-slate-100 tracking-wide">Maple Diary</span>
        </div>
        {selectedCharacter ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-cyber-300 bg-cyber-500/10 border border-cyber-500/20 px-3 py-1 rounded-full">
              {selectedCharacter.name}
            </span>
            <button
              onClick={() => {
                if (confirm(`"${selectedCharacter.name}" 캐릭터를 삭제할까요?`)) {
                  onRemoveCharacter(selectedCharacter.id)
                }
              }}
              className="text-xs text-slate-500 hover:text-red-400 px-2 py-1"
            >
              삭제
            </button>
          </div>
        ) : (
          <button
            onClick={async () => {
              const name = prompt('캐릭터명을 입력하세요')
              if (!name) return
              const trimmed = normalizeCharacterName(name)
              if (!trimmed) return
              try {
                if (await isGlobalCharacterNameTaken(trimmed)) {
                  alert(DUPLICATE_CHARACTER_NAME_MESSAGE)
                  return
                }
              } catch {
                alert('캐릭터명 확인에 실패했습니다.')
                return
              }
              onAddCharacter(trimmed)
            }}
            className="text-sm text-cyber-400 font-medium"
          >
            + 캐릭터
          </button>
        )}
      </div>
      {user && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-dark-border/30">
          <div className="flex items-center gap-2 min-w-0">
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-cyber-500/20 flex items-center justify-center text-[10px] text-cyber-400">
                {(user.user_metadata?.full_name ?? user.email ?? '?')[0]}
              </div>
            )}
            <span className="text-xs text-slate-400 truncate">
              {user.user_metadata?.full_name ?? user.email}
            </span>
          </div>
          <button onClick={() => signOut()} className="text-xs text-slate-500 hover:text-red-400 shrink-0">
            로그아웃
          </button>
        </div>
      )}
    </header>
  )
}
