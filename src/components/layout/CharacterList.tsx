import type { Character } from '../../types'

interface CharacterListProps {
  characters: Character[]
  selectedCharacter: Character | null
  onSelectCharacter: (id: string) => void
  onRemoveCharacter: (id: string) => void
  onMoveCharacter: (id: string, direction: 'up' | 'down') => void
  /** 모바일 모달 등 더 큰 터치 영역 */
  variant?: 'sidebar' | 'mobile'
}

export default function CharacterList({
  characters,
  selectedCharacter,
  onSelectCharacter,
  onRemoveCharacter,
  onMoveCharacter,
  variant = 'sidebar',
}: CharacterListProps) {
  const canReorder = characters.length > 1
  const isMobile = variant === 'mobile'

  const handleRemove = (char: Character) => {
    if (!confirm(`"${char.name}" 캐릭터를 삭제할까요?\n보스·드랍 데이터도 함께 삭제됩니다.`)) return
    onRemoveCharacter(char.id)
  }

  return (
    <div className="space-y-1">
      {characters.map((char, index) => {
        const isSelected = selectedCharacter?.id === char.id
        const isFirst = index === 0
        const isLast = index === characters.length - 1

        return (
          <div key={char.id} className="flex items-center gap-1 group">
            {canReorder && (
              <div className={`flex flex-col shrink-0 ${isMobile ? 'gap-0.5' : 'gap-0 opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                <button
                  type="button"
                  onClick={() => onMoveCharacter(char.id, 'up')}
                  disabled={isFirst}
                  className={`rounded text-slate-500 hover:text-cyber-400 hover:bg-cyber-500/10 disabled:opacity-20 disabled:pointer-events-none transition-colors ${
                    isMobile ? 'w-8 h-7 text-xs' : 'w-6 h-5 text-[10px]'
                  }`}
                  title="위로"
                  aria-label={`${char.name} 위로 이동`}
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => onMoveCharacter(char.id, 'down')}
                  disabled={isLast}
                  className={`rounded text-slate-500 hover:text-cyber-400 hover:bg-cyber-500/10 disabled:opacity-20 disabled:pointer-events-none transition-colors ${
                    isMobile ? 'w-8 h-7 text-xs' : 'w-6 h-5 text-[10px]'
                  }`}
                  title="아래로"
                  aria-label={`${char.name} 아래로 이동`}
                >
                  ▼
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => onSelectCharacter(char.id)}
              className={`flex-1 text-left rounded-lg text-sm transition-all ${
                isMobile ? 'px-3 py-3' : 'px-3 py-2.5'
              } ${
                isSelected
                  ? 'nav-active'
                  : isMobile
                    ? 'text-slate-300 hover:bg-dark-panel/50'
                    : 'text-slate-400 hover:bg-dark-panel/50 hover:text-slate-200'
              }`}
            >
              <span className="font-medium">{char.name}</span>
              {isMobile && isSelected && (
                <span className="ml-2 text-[10px] text-cyber-400">선택됨</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleRemove(char)}
              className={`shrink-0 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs ${
                isMobile
                  ? 'w-9 h-9 text-slate-500'
                  : 'w-7 h-7 opacity-0 group-hover:opacity-100'
              }`}
              title="캐릭터 삭제"
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}
