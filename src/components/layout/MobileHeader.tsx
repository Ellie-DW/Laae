import { useState } from 'react'
import type { Character } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import {
  DUPLICATE_CHARACTER_NAME_MESSAGE,
  normalizeCharacterName,
} from '../../lib/characters'
import { isGlobalCharacterNameTaken } from '../../lib/appDataApi'
import CharacterList from './CharacterList'

interface MobileHeaderProps {
  characters: Character[]
  selectedCharacter: Character | null
  onSelectCharacter: (id: string) => void
  onAddCharacter: (name: string) => void
  onRemoveCharacter: (id: string) => void
  onMoveCharacter: (id: string, direction: 'up' | 'down') => void
}

export default function MobileHeader({
  characters,
  selectedCharacter,
  onSelectCharacter,
  onAddCharacter,
  onRemoveCharacter,
  onMoveCharacter,
}: MobileHeaderProps) {
  const { user, signOut } = useAuth()
  const [pickerOpen, setPickerOpen] = useState(false)
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

  const handleSelect = (id: string) => {
    onSelectCharacter(id)
    setPickerOpen(false)
  }

  const handleRemove = (id: string) => {
    onRemoveCharacter(id)
    if (characters.length <= 1) setPickerOpen(false)
  }

  const closePicker = () => {
    setPickerOpen(false)
    setShowAdd(false)
    setNewName('')
    setAddError(null)
  }

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 bg-dark-surface/80 backdrop-blur-lg border-b border-dark-border/60 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">🍁</span>
            <span className="font-display font-bold text-slate-100 tracking-wide truncate">Maple Diary</span>
          </div>

          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-1.5 min-w-0 max-w-[55%] text-sm text-cyber-300 bg-cyber-500/10 border border-cyber-500/20 px-3 py-1.5 rounded-full hover:bg-cyber-500/15 transition-colors"
          >
            <span className="truncate font-medium">
              {selectedCharacter?.name ?? '캐릭터 선택'}
            </span>
            <span className="text-[10px] text-cyber-400 shrink-0">▼</span>
          </button>
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

      {pickerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="닫기"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closePicker}
          />
          <div className="relative w-full max-w-sm max-h-[80vh] flex flex-col bg-dark-surface border border-dark-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border/60 shrink-0">
              <div>
                <h2 className="font-semibold text-slate-100">캐릭터 선택</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {characters.length}개 등록됨
                  {characters.length > 1 && ' · ▲▼로 순서 변경'}
                </p>
              </div>
              <button
                onClick={closePicker}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-dark-panel/60"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
              {characters.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-3xl">🍁</span>
                  <p className="text-sm text-slate-400 mt-3">등록된 캐릭터가 없어요</p>
                </div>
              ) : (
                <CharacterList
                  characters={characters}
                  selectedCharacter={selectedCharacter}
                  onSelectCharacter={handleSelect}
                  onRemoveCharacter={handleRemove}
                  onMoveCharacter={onMoveCharacter}
                  variant="mobile"
                />
              )}
            </div>

            <div className="px-4 py-3 border-t border-dark-border/60 shrink-0">
              {showAdd ? (
                <div className="space-y-2">
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
                    <button onClick={handleAdd} className="btn-primary text-xs flex-1 py-2">추가</button>
                    <button
                      onClick={() => { setShowAdd(false); setAddError(null) }}
                      className="btn-secondary text-xs flex-1 py-2"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setShowAdd(true); setAddError(null) }}
                  className="w-full py-2.5 text-sm text-cyber-400 hover:bg-cyber-500/10 rounded-lg border border-dashed border-cyber-600/40 transition-colors"
                >
                  + 캐릭터 추가
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
