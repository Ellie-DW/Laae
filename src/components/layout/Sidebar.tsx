import { useState } from 'react'
import type { Character } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import {
  DUPLICATE_CHARACTER_NAME_MESSAGE,
  normalizeCharacterName,
} from '../../lib/characters'
import { isGlobalCharacterNameTaken } from '../../lib/appDataApi'
import CharacterList from './CharacterList'

interface SidebarProps {
  characters: Character[]
  selectedCharacter: Character | null
  onSelectCharacter: (id: string) => void
  onAddCharacter: (name: string) => void
  onRemoveCharacter: (id: string) => void
  onMoveCharacter: (id: string, direction: 'up' | 'down') => void
  onReorderCharacters: (orderedIds: string[]) => void
}

export default function Sidebar({
  characters,
  selectedCharacter,
  onSelectCharacter,
  onAddCharacter,
  onRemoveCharacter,
  onMoveCharacter,
  onReorderCharacters,
}: SidebarProps) {
  const { user, signOut } = useAuth()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  const handleAdd = async () => {
    const trimmed = normalizeCharacterName(newName)
    if (!trimmed) return

    try {
      if (await isGlobalCharacterNameTaken(trimmed)) {
        setAddError(DUPLICATE_CHARACTER_NAME_MESSAGE)
        return
      }
    } catch {
      setAddError('캐릭터명 확인에 실패했습니다.')
      return
    }

    onAddCharacter(trimmed)
    setNewName('')
    setAddError(null)
    setShowAdd(false)
  }

  const handleRemove = (char: Character) => {
    if (!confirm(`"${char.name}" 캐릭터를 삭제할까요?\n보스·드랍 데이터도 함께 삭제됩니다.`)) return
    onRemoveCharacter(char.id)
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-dark-border/60 bg-dark-surface/60 backdrop-blur-md h-screen sticky top-0">
      <div className="p-5 border-b border-dark-border/40">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍁</span>
          <div>
            <h1 className="font-display font-bold text-slate-100 tracking-wide">Maple Diary</h1>
            <p className="text-xs text-slate-500">메이플 가계부</p>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <p className="text-xs font-medium text-slate-500 mb-3 px-1 uppercase tracking-wider">My Character</p>

        {characters.length === 0 ? (
          <div className="text-center py-8 px-2">
            <span className="text-3xl">🍁</span>
            <p className="text-sm font-medium text-slate-300 mt-3">등록된 캐릭터 없음</p>
            <p className="text-xs text-slate-500 mt-1">캐릭터를 추가해주세요</p>
          </div>
        ) : (
          <CharacterList
            characters={characters}
            selectedCharacter={selectedCharacter}
            onSelectCharacter={onSelectCharacter}
            onRemoveCharacter={onRemoveCharacter}
            onMoveCharacter={onMoveCharacter}
            onReorderCharacters={onReorderCharacters}
          />
        )}

        {showAdd ? (
          <div className="mt-3 space-y-2">
            <input
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value)
                if (addError) setAddError(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="캐릭터명"
              className="input-field text-sm"
              autoFocus
            />
            {addError && <p className="text-xs text-red-400">{addError}</p>}
            <div className="flex gap-2">
              <button onClick={handleAdd} className="btn-primary text-xs flex-1 py-1.5">추가</button>
              <button onClick={() => { setShowAdd(false); setAddError(null) }} className="btn-secondary text-xs flex-1 py-1.5">취소</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setShowAdd(true); setAddError(null) }}
            className="w-full mt-3 py-2 text-sm text-cyber-400 hover:bg-cyber-500/10 rounded-lg border border-dashed border-cyber-600/40 transition-colors"
          >
            + 캐릭터 추가
          </button>
        )}
      </div>

      {selectedCharacter && (
        <div className="p-4 border-t border-dark-border/40 bg-dark-panel/40">
          <p className="text-xs text-slate-500">선택된 캐릭터</p>
          <p className="font-semibold text-cyber-300">{selectedCharacter.name}</p>
          <button
            onClick={() => handleRemove(selectedCharacter)}
            className="mt-2 text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            캐릭터 삭제
          </button>
        </div>
      )}

      {user && (
        <div className="p-4 border-t border-dark-border/40">
          <div className="flex items-center gap-3 mb-3">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="w-8 h-8 rounded-full border border-dark-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-cyber-500/20 flex items-center justify-center text-xs text-cyber-400">
                {(user.user_metadata?.full_name ?? user.email ?? '?')[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-200 truncate">
                {user.user_metadata?.full_name ?? '사용자'}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full text-xs text-slate-500 hover:text-red-400 py-1.5 transition-colors"
          >
            로그아웃
          </button>
        </div>
      )}
    </aside>
  )
}
